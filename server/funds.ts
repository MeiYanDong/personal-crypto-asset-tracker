import { Router, type Request, type Response } from "express";
import crypto from "node:crypto";
import { balanceItems, limits, withinCapacity } from "../shared/funds-policy.js";
import { accountKey, addressKey, assetKey, buildFunds, type FundChain, type FundRegistry, type FundWorkerStatus, type PersonalSnapshot, type PersonalState } from "../shared/funds.js";

export const workerToken = (ownerToken: string) => ownerToken ? crypto.createHmac("sha256", ownerToken).update("asset-funds-observer:v1").digest("hex") : "";
export function isWorkerRequest(path: string, method: string, provided: string, owner: string) {
  const allowed = method === "GET" ? ["/funds/registry", "/funds/job"] : method === "PUT" ? ["/funds/registry", "/funds/chain", "/funds/worker"] : method === "POST" ? ["/funds/personal-refresh"] : [];
  const expected = workerToken(owner);
  return Boolean(expected && allowed.includes(path) && /^[0-9a-f]{64}$/.test(provided) && crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected)));
}
type Dependencies = {
  read: <T>(name: string) => Promise<T | null>; write: (name: string, value: unknown) => Promise<void>;
  state: () => Promise<PersonalState>; snapshot: () => Promise<PersonalSnapshot | null>; refreshPersonal: () => Promise<unknown>; ownerToken: string;
};
export function fundsRouter(d: Dependencies) {
  const router = Router();
  let cache: { at: number; result: ReturnType<typeof buildFunds> } | undefined;
  let personalRefresh: Promise<unknown> | undefined;
  const run = (fn: (req: Request, res: Response) => Promise<unknown>) => async (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "private, no-store");
    try { await fn(req, res); } catch (e) { res.status((e as { status?: number })?.status === 429 ? 429 : 500).json({ error: e instanceof Error ? e.message : "资金数据读取失败" }); }
  };
  const result = async () => {
    if (cache && Date.now() - cache.at < 30_000) return cache.result;
    const [registry, snapshot, state, worker] = await Promise.all([d.read<FundRegistry>("registry"), d.snapshot(), d.state(), d.read<FundWorkerStatus>("worker")]);
    const ids = [...new Set(registry?.addresses.map(a => String(a.chainId)) || [])];
    const chains = (await Promise.all(ids.map(id => d.read<FundChain>(`chain-${id}`)))).filter((c): c is FundChain => Boolean(c));
    const next = buildFunds(registry, chains, snapshot, state, worker || {});
    next.view.capacity = { accounts: registry?.addresses.length || 0, accountLimit: limits.accounts,
      balanceItems: registry ? balanceItems(registry) : 0, balanceLimit: limits.balanceItems,
      personalWallets: state.wallets.length, personalLimit: limits.personalWallets,
      pending: Object.values(registry?.pending || {}).reduce((a, b) => a + b, 0) };
    cache = { at: Date.now(), result: next }; return next;
  };
  router.get("/", run(async (_req, res) => res.json((await result()).view)));
  router.get("/addresses", run(async (req, res) => {
    const data = await result(), query = String(req.query.q || "").toLowerCase().slice(0, 200);
    const group = String(req.query.group || ""), dimension = String(req.query.dimension || "");
    const selected = data.facts.filter(f => !group || (dimension === "asset" ? assetKey(f.chainId, f.token) === group && f.quantity !== "0" : dimension === "project" ? f.project === group : dimension === "host" ? f.host === group : true));
    const matching = new Map(selected.map(f => [accountKey(f.chainId, f.address), f]));
    const rows = data.addresses.filter(r => matching.has(r.id) && (!query || `${r.label} ${r.subtitle}`.toLowerCase().includes(query))).map(r => {
      if (dimension !== "asset" || !group) return r;
      const f = matching.get(r.id)!;
      return { ...r, usd: f.reference ? 0 : f.usd ?? 0, referenceUsd: f.reference ? f.usd ?? 0 : 0, quantity: f.quantity ?? undefined,
        priced: f.usd !== null && !f.reference ? 1 : 0, unpriced: f.usd === null && f.quantity !== null ? 1 : 0, unknown: f.quantity === null && !f.defi ? 1 : 0, stale: f.stale ? 1 : 0, observedAt: f.observedAt };
    }).sort((a, b) => b.usd - a.usd || b.referenceUsd - a.referenceUsd || Number(b.quantity || 0) - Number(a.quantity || 0));
    const page = Math.max(1, Math.min(Math.ceil(rows.length / 50) || 1, Number(req.query.page) || 1));
    res.json({ rows: rows.slice((page - 1) * 50, page * 50), total: rows.length, page });
  }));
  router.get("/account", run(async (req, res) => res.json((await result()).facts.filter(f => accountKey(f.chainId, f.address) === String(req.query.id || "")))));
  router.get("/registry", run(async (_req, res) => res.json(await d.read("registry"))));
  router.put("/registry", run(async (req, res) => {
    const value = req.body as FundRegistry;
    if (value.version !== 1 || !Array.isArray(value.addresses) || value.addresses.length > limits.accounts || !Array.isArray(value.tokens) || value.tokens.length > limits.tokens || !Array.isArray(value.servers) || value.servers.length > limits.servers || !Array.isArray(value.gaps) || value.gaps.length > 128) { res.status(413).json({ error: "清单超过资源额度；保留已有清单，新增部分待接入" }); return; }
    if (value.addresses.some(a => !/^\d+$/.test(String(a.chainId)) || !/^(0x[0-9a-fA-F]{40}|[1-9A-HJ-NP-Za-km-z]{32,44})$/.test(a.address) || !a.project || !a.host)) { res.status(400).json({ error: "无效地址或归属" }); return; }
    const previous = await d.read<FundRegistry>("registry");
    // Discovery never deletes known money when a host is down or a manifest is moved.
    const addresses = new Map((previous?.addresses || []).map(a => [accountKey(a.chainId, a.address), a]));
    for (const a of value.addresses) addresses.set(accountKey(a.chainId, a.address), a);
    const merged = { ...value, addresses: [...addresses.values()] };
    if (!withinCapacity(merged)) { res.status(413).json({ error: "账户或余额查询量超过资源额度；保留已有清单" }); return; }
    if (value.tokens.some(t => !limits.chains.includes(Number(t.chainId)) || !t.address || !/^(0x[0-9a-fA-F]{40}|[1-9A-HJ-NP-Za-km-z]{32,44})$/.test(t.address) || !Number.isInteger(t.decimals) || t.decimals < 0 || t.decimals > 36 || typeof t.symbol !== "string" || t.symbol.length > 32)) { res.status(400).json({ error: "无效代币清单" }); return; }
    await d.write("registry", merged); cache = undefined;
    res.json({ ok: true, accounts: addresses.size });
  }));
  router.put("/chain", run(async (req, res) => {
    const value = req.body as FundChain;
    if (!/^\d+$/.test(String(value.chainId)) || !Array.isArray(value.rows) || !Array.isArray(value.assets) || !Number.isFinite(Date.parse(value.finishedAt))) { res.status(400).json({ error: "无效余额快照" }); return; }
    if (!limits.chains.includes(Number(value.chainId)) || value.rows.length > limits.accounts || value.assets.length > 256 || value.rows.reduce((n, r) => n + Object.keys(r.balances || {}).length, 0) > limits.balanceItems || value.assets.some(t => !Number.isInteger(t.decimals) || t.decimals < 0 || t.decimals > 36) || value.rows.some(r => !r.balances || Object.values(r.balances).some(v => v !== null && (typeof v !== "string" || !/^\d{1,78}$/.test(v))))) { res.status(413).json({ error: "快照无效或超出资源额度；保留旧数据" }); return; }
    const key = `chain-${value.chainId}`, previous = await d.read<FundChain>(key);
    if (previous && Date.parse(previous.finishedAt) > Date.parse(value.finishedAt)) { res.status(409).json({ error: "拒绝覆盖较新快照" }); return; }
    const rows = new Map((previous?.rows || []).map(r => [addressKey(r.address), r]));
    const merged = value.rows.map(row => {
      const prev = rows.get(addressKey(row.address));
      if ((Object.values(row.balances).some(x => x === null) || value.errors.length) && prev) return { ...row, stale: true, observedAt: prev.observedAt || previous!.finishedAt, balances: { ...prev.balances, ...Object.fromEntries(Object.entries(row.balances).map(([k, v]) => [k, v ?? prev.balances[k] ?? null])) } };
      return row;
    });
    const assets = new Map((previous?.assets || []).map(t => [assetKey(t.chainId, t.address), t]));
    for (const token of value.assets) assets.set(assetKey(token.chainId, token.address), token);
    if (assets.size > 256) { res.status(413).json({ error: "代币种类超出额度；保留旧快照" }); return; }
    await d.write(key, { ...value, assets: [...assets.values()], rows: merged }); cache = undefined; res.json({ ok: true });
  }));
  router.get("/worker-token", run(async (_req, res) => res.json({ token: workerToken(d.ownerToken) })));
  router.get("/job", run(async (_req, res) => res.json({ worker: await d.read("worker"), request: await d.read("request") })));
  router.put("/worker", run(async (req, res) => {
    const current = await d.read<FundWorkerStatus>("worker") || {};
    const fields = ["attemptedAt", "completedAt", "personalAttemptedAt", "personalCompletedAt", "error"];
    const update = Object.fromEntries(fields.filter(k => typeof req.body[k] === "string").map(k => [k, String(req.body[k]).slice(0, 200)]));
    for (const field of ["resources", "personalResources"]) if (req.body[field] && typeof req.body[field] === "object") {
      update[field] = Object.fromEntries(Object.entries(req.body[field]).slice(0, 12).filter(([k, v]) => /^[a-zA-Z]{1,32}$/.test(k) && typeof v === "number" && Number.isFinite(v) && v >= 0 && v < 1e12)) as never;
    }
    await d.write("worker", { ...current, ...update }); cache = undefined; res.json({ ok: true });
  }));
  router.post("/refresh", run(async (_req, res) => {
    const previous = await d.read<{ requestedAt: string }>("request");
    if (previous && Date.now() - Date.parse(previous.requestedAt) < limits.fleetIntervalSeconds * 1000) { res.status(202).json({ queued: true }); return; }
    await d.write("request", { requestedAt: new Date().toISOString() }); res.status(202).json({ queued: true });
  }));
  router.post("/personal-refresh", run(async (_req, res) => {
    // Same instance coalesces overlapping refreshes; the observer also holds an OS lock.
    personalRefresh ||= d.refreshPersonal().finally(() => { personalRefresh = undefined; cache = undefined; });
    const completed = await personalRefresh as { resourceUsage?: Record<string, number> }; res.json({ ok: true, resources: completed.resourceUsage });
  }));
  return router;
}
