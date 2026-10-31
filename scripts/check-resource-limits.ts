import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { boundedFetch, claimPersonal, reservePersonal, ResourceLimit, withRefreshBudget } from "../server/refresh-budget.js";
import { balanceItems, withinCapacity } from "../shared/funds-policy.js";
import type { FundRegistry } from "../shared/funds.js";
import express from "express";
import { fundsRouter } from "../server/funds.js";

const now = Date.parse("2026-11-01T12:00:00Z");
assert.equal(reservePersonal(null, now).count, 1);
assert.throws(() => reservePersonal({ day: "2026-11-01", count: 1, attemptedAt: now - 1 }, now), ResourceLimit);
assert.throws(() => reservePersonal({ day: "2026-11-01", count: 24, attemptedAt: now - 3600_000 }, now), ResourceLimit);
assert.equal(reservePersonal({ day: "2026-10-31", count: 24, attemptedAt: now - 86400_000 }, now).count, 1);
const directory = await mkdtemp(path.join(tmpdir(), "funds-budget-"));
try {
  const file = path.join(directory, "budget.json");
  const attempts = await Promise.allSettled(Array.from({ length: 8 }, () => claimPersonal(file, false)));
  assert.equal(attempts.filter(x => x.status === "fulfilled").length, 1);
  assert.equal(JSON.parse(await readFile(file, "utf8")).count, 1);
} finally { await rm(directory, { recursive: true }); }

const originalFetch = globalThis.fetch; let calls = 0;
try {
  globalThis.fetch = async () => { calls++; return new Response("failed", { status: 429 }); };
  await withRefreshBudget(async () => {
    for (let i = 0; i < 240; i++) await boundedFetch("https://example.invalid");
    await assert.rejects(boundedFetch("https://example.invalid"), ResourceLimit);
  });
  assert.equal(calls, 240, "failed/retried HTTP calls consume the same budget");
  globalThis.fetch = async () => new Response("x".repeat(2 * 1024 * 1024 + 1));
  await assert.rejects(withRefreshBudget(() => boundedFetch("https://example.invalid")), ResourceLimit);
} finally { globalThis.fetch = originalFetch; }
const registry: FundRegistry = { version: 1, generatedAt: "", addresses: Array.from({ length: 8000 }, (_, i) => ({ chainId: 1, address: "0x" + i.toString(16).padStart(40, "0"), project: "test", host: "test", role: "owner" })), servers: [], gaps: [], tokens: Array.from({ length: 4 }, (_, i) => ({ chainId: 1, address: "0x" + (i + 9000).toString(16).padStart(40, "0"), symbol: "TOKEN", decimals: 18 })) };
assert.equal(balanceItems(registry), 40000);
assert.ok(withinCapacity(registry));
assert.ok(!withinCapacity({ ...registry, addresses: [...registry.addresses, registry.addresses[0]] }));
assert.ok(!withinCapacity({ ...registry, tokens: [...registry.tokens, { ...registry.tokens[0], address: "0x" + "a".repeat(40) }] }));
let writes = 0;
const app = express(); app.use(express.json({ limit: "4mb" }));
app.use(fundsRouter({ ownerToken: "test", read: async <T,>() => registry as T,
  write: async () => { writes++; }, state: async () => ({ wallets: [], assetGroups: [], assignments: {} }),
  snapshot: async () => null, refreshPersonal: async () => ({}) }));
const server = app.listen(0, "127.0.0.1");
await new Promise<void>(resolve => server.once("listening", resolve));
try {
  const incoming = { ...registry, addresses: [{ ...registry.addresses[0], address: "0x" + "f".repeat(40) }] };
  const response = await fetch(`http://127.0.0.1:${(server.address() as { port: number }).port}/registry`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(incoming) });
  assert.equal(response.status, 413, "merging a small delta must not bypass the total capacity");
  assert.equal(writes, 0, "rejected registration must preserve the saved registry");
} finally { await new Promise<void>(resolve => server.close(() => resolve())); }
console.log("Resource limits passed: burst/fanout capacity, daily slots, concurrent reservations, retries and response limits.");
