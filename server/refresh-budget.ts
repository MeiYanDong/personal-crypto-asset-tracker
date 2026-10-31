import { AsyncLocalStorage } from "node:async_hooks";
import { promises as fs } from "node:fs";
import { get, put } from "@vercel/blob";
import limits from "../shared/funds-limits.json" with { type: "json" };

type Budget = { requests: number; responseBytes: number; started: number };
const active = new AsyncLocalStorage<Budget>();
export class ResourceLimit extends Error {
  status = 429;
  constructor(reason: string) { super(`资源额度保护：${reason}；保留上次资产数据。`); }
}
type Reservation = { day: string; count: number; attemptedAt: number };
export function reservePersonal(previous: Reservation | null, now = Date.now()): Reservation {
  const day = new Date(now).toISOString().slice(0, 10);
  if (previous && now - previous.attemptedAt < 900_000) throw new ResourceLimit("个人刷新间隔至少 15 分钟");
  const count = previous?.day === day ? previous.count : 0;
  if (!Number.isInteger(count) || count < 0 || count >= limits.personalRunsPerDay) throw new ResourceLimit(`个人刷新每天最多 ${limits.personalRunsPerDay} 次（UTC）`);
  return { day, count: count + 1, attemptedAt: now };
}

// Compare-and-swap at private Blob origin prevents separate Vercel instances
// from multiplying requests. A failed refresh keeps its reserved daily slot.
export async function claimPersonal(file: string, cloud: boolean) {
  if (cloud) {
    const key = "asset-tracker/funds-personal-budget.json";
    const old = await get(key, { access: "private", useCache: false });
    const previous = old?.statusCode === 200 ? await new Response(old.stream).json() as Reservation : null;
    const next = reservePersonal(previous);
    try {
      await put(key, JSON.stringify(next), { access: "private", addRandomSuffix: false,
        allowOverwrite: Boolean(old), ifMatch: old?.blob.etag, contentType: "application/json", cacheControlMaxAge: 60 });
    } catch { throw new ResourceLimit("刷新预约冲突或预算存储不可用，请稍后重试"); }
    return;
  }
  const lock = await fs.open(file + ".lock", "wx", 0o600).catch(() => { throw new ResourceLimit("已有刷新任务在预约"); });
  try {
    let previous: Reservation | null = null;
    try { previous = JSON.parse(await fs.readFile(file, "utf8")); }
    catch (e) { if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e; }
    await fs.writeFile(file, JSON.stringify(reservePersonal(previous)), { mode: 0o600 });
  } finally { await lock.close(); await fs.unlink(file + ".lock"); }
}

export async function withRefreshBudget<T>(fn: () => Promise<T>) {
  const budget = { requests: 0, responseBytes: 0, started: Date.now() };
  const value = await active.run(budget, fn);
  return { value, resources: { requests: budget.requests, responseBytes: budget.responseBytes, durationSeconds: (Date.now() - budget.started) / 1000 } };
}
export function chargeRequest() {
  const b = active.getStore();
  if (!b) return;
  if (b.requests >= limits.personalRequestsPerRun || b.responseBytes >= limits.personalResponseBytesPerRun || Date.now() - b.started >= limits.personalSeconds * 1000) throw new ResourceLimit("本轮请求、响应大小或耗时已达上限");
  b.requests++;
}
export async function boundedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  chargeRequest();
  const b = active.getStore();
  const remaining = b ? limits.personalSeconds * 1000 - (Date.now() - b.started) : 30_000;
  const deadline = AbortSignal.timeout(Math.max(1, Math.min(30_000, remaining)));
  const signal = init.signal ? AbortSignal.any([init.signal, deadline]) : deadline;
  if (typeof init.body === "string" && Buffer.byteLength(init.body) > 128 * 1024) throw new ResourceLimit("单次请求过大");
  const response = await fetch(input, { ...init, signal });
  const reader = response.body?.getReader();
  if (!reader) return response;
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (b) b.responseBytes += value.byteLength;
      if (size > 2 * 1024 * 1024 || (b && b.responseBytes > limits.personalResponseBytesPerRun)) throw new ResourceLimit("响应数据过大");
      chunks.push(value);
    }
  } finally { await reader.cancel().catch(() => undefined); }
  const headers = new Headers(response.headers); headers.delete("content-encoding"); headers.delete("content-length");
  return new Response(Buffer.concat(chunks), { status: response.status, statusText: response.statusText, headers });
}
