import { Router, type Request, type Response } from "express";
import crypto from "node:crypto";
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
    try { await fn(req, res); } catch (e) { res.status(500).json({ error: e instanceof Error ? e.message : "资金数据读取失败" }); }
  };
  const result = async () => {
    if (cache && Date.now() - cache.at < 30_000) return cache.result;
    const [registry, snapshot, state, worker] = await Promise.all([d.read<FundRegistry>("registry"), d.snapshot(), d.state(), d.read<FundWorkerStatus>("worker")]);
    const ids = [...new Set(registry?.addresses.map(a => String(a.chainId)) || [])];
    const chains = (await Promise.all(ids.map(id => d.read<FundChain>(`chain-${id}`)))).filter((c): c is FundChain => Boolean(c));
    const next = buildFunds(registry, chains, snapshot, state, worker || {});
    cache = { at: Date.now(), result: next }; return next;
  };
  router.get("/", run(async (_req, res) => res.json((await result()).view)));
  router.get("/addresses", run(async (req, res) => {
    const data = await result(), query = String(req.query.q || "").toLowerCase().slice(0, 200);
    const group = String(req.query.group || ""), dimension = String(req.query.dimension || "");
    const matching = new Set(data.facts.filter(f => !group || (dimension === "asset" ? assetKey(f.chainId, f.token) === group : dimension === "project" ? f.project === group : dimension === "host" ? f.host === group : true)).map(f => accountKey(f.chainId, f.address)));
    const rows = data.addresses.filter(r => matching.has(r.id) && (!query || `${r.label} ${r.subtitle}`.toLowerCase().includes(query)));
    const page = Math.max(1, Math.min(Math.ceil(rows.length / 50) || 1, Number(req.query.page) || 1));
    res.json({ rows: rows.slice((page - 1) * 50, page * 50), total: rows.length, page });
  }));
  router.get("/account", run(async (req, res) => res.json((await result()).facts.filter(f => accountKey(f.chainId, f.address) === String(req.query.id || "")))));
  router.get("/registry", run(async (_req, res) => res.json(await d.read("registry"))));
  router.put("/registry", run(async (req, res) => {
    const value = req.body as FundRegistry;
    if (value.version !== 1 || !Array.isArray(value.addresses) || value.addresses.length > 50_000 || !Array.isArray(value.tokens) || !Array.isArray(value.servers) || !Array.isArray(value.gaps)) { res.status(400).json({ error: "无效清单" }); return; }
    if (value.addresses.some(a => !/^\d+$/.test(String(a.chainId)) || !/^(0x[0-9a-fA-F]{40}|[1-9A-HJ-NP-Za-km-z]{32,44})$/.test(a.address) || !a.project || !a.host)) { res.status(400).json({ error: "无效地址或归属" }); return; }
    const previous = await d.read<FundRegistry>("registry");
    // Discovery never deletes known money when a host is down or a manifest is moved.
    const addresses = new Map((previous?.addresses || []).map(a => [accountKey(a.chainId, a.address), a]));
    for (const a of value.addresses) addresses.set(accountKey(a.chainId, a.address), a);
    await d.write("registry", { ...value, addresses: [...addresses.values()] }); cache = undefined;
    res.json({ ok: true, accounts: addresses.size });
  }));
  router.put("/chain", run(async (req, res) => {
    const value = req.body as FundChain;
    if (!/^\d+$/.test(String(value.chainId)) || !Array.isArray(value.rows) || !Array.isArray(value.assets) || !Number.isFinite(Date.parse(value.finishedAt))) { res.status(400).json({ error: "无效余额快照" }); return; }
    if (value.rows.length > 50_000 || value.assets.some(t => !Number.isInteger(t.decimals) || t.decimals < 0 || t.decimals > 36) || value.rows.some(r => !r.balances || Object.values(r.balances).some(v => v !== null && (typeof v !== "string" || !/^\d{1,78}$/.test(v))))) { res.status(400).json({ error: "无效最小单位余额" }); return; }
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
    await d.write(key, { ...value, assets: [...assets.values()], rows: merged }); cache = undefined; res.json({ ok: true });
  }));
  router.get("/worker-token", run(async (_req, res) => res.json({ token: workerToken(d.ownerToken) })));
  router.get("/job", run(async (_req, res) => res.json({ worker: await d.read("worker"), request: await d.read("request") })));
  router.put("/worker", run(async (req, res) => {
    const current = await d.read<FundWorkerStatus>("worker") || {};
    const fields = ["attemptedAt", "completedAt", "personalAttemptedAt", "personalCompletedAt", "error"];
    const update = Object.fromEntries(fields.filter(k => typeof req.body[k] === "string").map(k => [k, String(req.body[k]).slice(0, 200)]));
    await d.write("worker", { ...current, ...update }); cache = undefined; res.json({ ok: true });
  }));
  router.post("/refresh", run(async (_req, res) => {
    await d.write("request", { requestedAt: new Date().toISOString() }); res.status(202).json({ queued: true });
  }));
  router.post("/personal-refresh", run(async (_req, res) => {
    // Same instance coalesces overlapping refreshes; the observer also holds an OS lock.
    personalRefresh ||= d.refreshPersonal().finally(() => { personalRefresh = undefined; cache = undefined; });
    await personalRefresh; res.json({ ok: true });
  }));
  return router;
}
