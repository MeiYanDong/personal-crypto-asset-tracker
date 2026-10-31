import { calculateConservativeEstimate } from "./asset-estimate.js";
import { defiProtocolTotalUsd, defiReceiptTokenAddresses, defiStableAssetBreakdown, type DefiProtocolPosition } from "./defi-position.js";

// Chain/address/contract identities, never symbols or server names, identify money.
export const chainNames: Record<string, string> = { "1": "Ethereum", "10": "Optimism", "56": "BNB Chain", "137": "Polygon", "196": "X Layer", "501": "Solana", "999": "HyperEVM", "4663": "Robinhood", "5042": "Arc", "8453": "Base", "42161": "Arbitrum", "43114": "Avalanche" };
export function addressKey(address: string) { return /^0x/i.test(address) ? address.toLowerCase() : address; }
export function tokenKey(token?: string | null) {
  return !token || /^(native|0x0{40}|0xe{40})$/i.test(token) ? "native" : addressKey(token);
}
export function accountKey(chain: string | number, address: string) { return `${chain}:${addressKey(address)}`; }
export function assetKey(chain: string | number, token?: string | null) { return `${chain}:${tokenKey(token)}`; }
export function units(raw: string, decimals: number): string {
  const n = BigInt(raw); const sign = n < 0n ? "-" : "";
  const digits = (n < 0n ? -n : n).toString().padStart(decimals + 1, "0");
  return decimals ? `${sign}${digits.slice(0, -decimals)}.${digits.slice(-decimals)}`.replace(/\.?0+$/, "") : sign + digits;
}
export type FundAccount = { chainId: string | number; address: string; project: string; host: string; role: string; kind?: string; source?: string; lastSeenAt?: string };
export type FundToken = { chainId: string | number; address: string | null; symbol: string; decimals: number; valuation?: "reference" };
export type FundServer = { id: string; cloud: string; name: string; alias: string; state: string; region: string; guestRead: boolean; registeredAccounts?: number };
export type FundRegistry = { version: 1; generatedAt: string; addresses: FundAccount[]; tokens: FundToken[]; servers: FundServer[]; gaps: string[]; pending?: { accounts: number; tokens: number; servers: number; sources?: number } };
export type FundChain = {
  chainId: string | number; startedAt: string; finishedAt: string; blockNumber?: string; blockHash?: string; blockTimestamp?: string;
  assets: FundToken[]; rows: { address: string; balances: Record<string, string | null>; observedAt?: string; stale?: boolean }[];
  errors: string[]; finality?: string;
};
export type FundWorkerStatus = { attemptedAt?: string; completedAt?: string; personalAttemptedAt?: string; personalCompletedAt?: string; error?: string; requestedAt?: string; resources?: Record<string, number>; personalResources?: Record<string, number> };
type Wallet = { id: string; address: string; label: string; groupId?: string };
export type PersonalState = { wallets: Wallet[]; assetGroups: { id: string; name: string }[]; assignments: Record<string, string> };
export type PersonalSnapshot = { generatedAt: string; walletSummary: {
  wallet: Wallet; wallets?: Wallet[]; status: string; updatedAt?: string; defiStatus?: string;
  holdings: { walletAddress: string; chainIndex: string; symbol: string; tokenContractAddress: string; balance: number; rawBalance: string; tokenPrice: number; isRiskToken: boolean }[];
  defiProtocols?: DefiProtocolPosition[];
}[] };
export type FundFact = {
  id: string; chainId: string; address: string; token: string; symbol: string; quantity: string | null;
  raw: string | null; decimals: number; usd: number | null; priceAt?: string; observedAt?: string;
  project: string; host: string; role: string; source: string; stale: boolean; reference: boolean; risk: boolean; defi: boolean;
};
export type FundRow = { id: string; label: string; subtitle: string; usd: number; referenceUsd: number; priced: number; unpriced: number; stale: number; unknown: number; accounts: number; quantity?: string; observedAt?: string };
export type FundsView = {
  version: 1; generatedAt: string; registryAt?: string; fleetAt?: string; personalAt?: string;
  totalUsd: number; referenceUsd: number; referencePricedCount: number; conservativeUsd: number; stableUsd: number; defiUsd: number;
  accountCount: number; addressCount: number; overlapCount: number; serverCount: number; projectCount: number;
  unpricedCount: number; unknownCount: number; staleCount: number; gaps: string[]; worker: FundWorkerStatus;
  groups: { project: FundRow[]; host: FundRow[]; asset: FundRow[] };
  capacity?: { accounts: number; accountLimit: number; balanceItems: number; balanceLimit: number; personalWallets: number; personalLimit: number; pending: number };
};
const old = (date?: string, minutes = 45) => !date || !Number.isFinite(Date.parse(date)) || Date.now() - Date.parse(date) > minutes * 60_000;
const safeNumber = (n: number) => Number.isFinite(n) ? n : 0;

export function buildFunds(registry: FundRegistry | null, chains: FundChain[], personal: PersonalSnapshot | null, state: PersonalState, worker: FundWorkerStatus = {}) {
  const accounts = new Map<string, FundAccount>();
  const currentWallets = new Map(state.wallets.map(w => [addressKey(w.address), w]));
  const groups = new Map(state.assetGroups.map(g => [g.id, g.name]));
  const personalGroup = (address: string) => {
    const w = currentWallets.get(addressKey(address));
    return `个人 · ${groups.get(state.assignments[w?.groupId || w?.id || ""] || "unclassified") || "未分类"}`;
  };
  for (const a of registry?.addresses || []) accounts.set(accountKey(a.chainId, a.address), a);
  const overlap = new Set((registry?.addresses || []).filter(a => currentWallets.has(addressKey(a.address))).map(a => addressKey(a.address)));
  const metadata = (chain: string, address: string) => accounts.get(accountKey(chain, address)) || { chainId: chain, address, project: personalGroup(address), host: "个人钱包", role: "personal" };
  const facts = new Map<string, FundFact>();
  const prices = new Map<string, { price: number; at: string; risk: boolean }>();
  const receipts = new Set<string>();
  const add = (fact: FundFact) => {
    const prev = facts.get(fact.id);
    if (!prev || (fact.quantity !== null && (prev.quantity === null || Date.parse(fact.observedAt || "") >= Date.parse(prev.observedAt || "")))) facts.set(fact.id, fact);
  };
  let defiStableUsd = 0;
  const seenDefi = new Set<string>();
  for (const summary of personal?.walletSummary || []) {
    const at = summary.updatedAt || personal!.generatedAt;
    for (const holding of summary.holdings) {
      const chain = String(holding.chainIndex), address = addressKey(holding.walletAddress);
      if (!currentWallets.has(address)) continue; // Removed manual wallets stay removed.
      const token = tokenKey(holding.tokenContractAddress), key = assetKey(chain, token);
      const previousPrice = prices.get(key);
      if (holding.tokenPrice > 0 && (!previousPrice || at >= previousPrice.at)) prices.set(key, { price: holding.tokenPrice, at, risk: holding.isRiskToken });
      const raw = /^\d+$/.test(holding.rawBalance) ? holding.rawBalance : null;
      const inferred = raw && holding.balance > 0 ? Math.round(Math.log10(Number(raw) / holding.balance)) : 18;
      const knownToken = registry?.tokens.find(t => assetKey(t.chainId, t.address) === key);
      const decimals = knownToken?.decimals ?? (inferred >= 0 && inferred <= 36 ? inferred : 18);
      const meta = metadata(chain, address);
      accounts.set(accountKey(chain, address), meta);
      add({ id: `${accountKey(chain, address)}:${token}`, chainId: chain, address, token, symbol: holding.symbol,
        quantity: raw ? units(raw, decimals) : String(holding.balance), raw, decimals,
        usd: holding.balance === 0 ? 0 : holding.tokenPrice > 0 ? holding.balance * holding.tokenPrice : null,
        priceAt: at, observedAt: at, project: meta.project, host: meta.host, role: meta.role,
        source: overlap.has(address) ? "个人清单 + 服务器清单" : "个人清单", stale: summary.status !== "ok" || old(at, 120),
        reference: holding.isRiskToken || (registry?.tokens || []).some(t => assetKey(t.chainId, t.address) === key && t.valuation === "reference"), risk: holding.isRiskToken, defi: false });
    }
    for (const protocol of summary.defiProtocols || []) {
      const address = addressKey(protocol.walletAddress);
      if (!currentWallets.has(address)) continue;
      const id = `defi:${address}:${protocol.protocolId}`;
      if (seenDefi.has(id)) continue;
      seenDefi.add(id);
      for (const token of defiReceiptTokenAddresses([protocol])) {
        for (const position of protocol.positions) if (position.poolAddress?.toLowerCase() === token && /^0x[0-9a-f]{40}$/.test(token)) receipts.add(`${position.chainIndex}:${address}:${token}`);
      }
      const chain = protocol.chains.length === 1 ? String(protocol.chains[0].chainIndex) : "multi";
      const meta = metadata(chain, address);
      const usd = defiProtocolTotalUsd([protocol]);
      defiStableUsd += defiStableAssetBreakdown([protocol]).stableAssetUsd;
      add({ id, chainId: chain, address, token: id, symbol: protocol.protocolName, quantity: null, raw: null, decimals: 0, usd,
        priceAt: at, observedAt: at, project: meta.project, host: meta.host, role: meta.role, source: "个人 DeFi", stale: summary.defiStatus !== "ok" || old(at, 120), reference: false, risk: false, defi: true });
    }
  }
  for (const chainData of chains) {
    const chain = String(chainData.chainId);
    const assets = new Map(chainData.assets.map(t => [tokenKey(t.address), t]));
    for (const row of chainData.rows) {
      const address = addressKey(row.address), meta = accounts.get(accountKey(chain, address));
      if (!meta) continue;
      for (const [originalToken, raw] of Object.entries(row.balances)) {
        const token = tokenKey(originalToken), asset = assets.get(token);
        if (!asset || receipts.has(`${chain}:${address}:${token}`)) continue;
        const valid = typeof raw === "string" && /^\d+$/.test(raw);
        const quantity = valid ? units(raw, asset.decimals) : null;
        const price = prices.get(assetKey(chain, token));
        const at = row.observedAt || chainData.finishedAt;
        add({ id: `${accountKey(chain, address)}:${token}`, chainId: chain, address, token, symbol: asset.symbol,
          quantity, raw: valid ? raw : null, decimals: asset.decimals, usd: quantity === "0" ? 0 : quantity !== null && price ? Number(quantity) * price.price : null,
          observedAt: at, priceAt: price?.at, project: meta.project, host: meta.host, role: meta.role,
          source: overlap.has(address) ? "服务器 RPC + 个人清单" : "服务器 RPC", stale: Boolean(row.stale) || old(at) || Boolean(price && old(price.at, 120)),
          reference: asset.valuation === "reference" || Boolean(price?.risk) || Boolean(registry?.tokens.find(t => assetKey(t.chainId, t.address) === assetKey(chain, token))?.valuation === "reference"), risk: Boolean(price?.risk), defi: false });
      }
    }
  }
  const covered = new Set([...facts.values()].filter(f => !f.defi).map(f => accountKey(f.chainId, f.address)));
  for (const [id, meta] of accounts) if (!covered.has(id)) {
    const chain = String(meta.chainId);
    add({ id: `${id}:missing`, chainId: chain, address: addressKey(meta.address), token: "missing", symbol: "待采集", quantity: null, raw: null, decimals: 0, usd: null,
      project: meta.project, host: meta.host, role: meta.role, source: meta.source || "服务器清单", stale: true, reference: false, risk: false, defi: false });
  }
  // A newly added manual address must be visible even before its first successful scan.
  const observedAddresses = new Set([...accounts.values()].map(a => addressKey(a.address)));
  for (const [address] of currentWallets) if (!observedAddresses.has(address)) {
    const summary = personal?.walletSummary.find(s => (s.wallets || [s.wallet]).some(w => addressKey(w.address) === address));
    const empty = summary?.status === "ok";
    facts.set(`manual:${address}`, { id: `manual:${address}`, chainId: /^0x/.test(address) ? "scanned" : "501", address, token: empty ? "empty" : "missing", symbol: empty ? "已扫描范围无持仓" : "待采集", quantity: empty ? "0" : null, raw: empty ? "0" : null, decimals: 0, usd: empty ? 0 : null, observedAt: summary?.updatedAt || personal?.generatedAt, project: personalGroup(address), host: "个人钱包", role: "personal", source: "个人清单", stale: !empty || old(summary?.updatedAt || personal?.generatedAt, 120), reference: false, risk: false, defi: false });
  }
  const all = [...facts.values()];
  const valued = all.filter(f => !f.reference && f.usd !== null);
  const defiUsd = valued.filter(f => f.defi).reduce((s, f) => s + safeNumber(f.usd!), 0);
  const totalUsd = valued.reduce((s, f) => s + safeNumber(f.usd!), 0);
  const referenceUsd = all.filter(f => f.reference).reduce((s, f) => s + safeNumber(f.usd || 0), 0);
  const estimate = calculateConservativeEstimate(valued.filter(f => !f.defi).map(f => ({ symbol: f.symbol, totalUsd: f.usd!, totalBalance: Number(f.quantity || 0), riskCount: f.risk ? 1 : 0 })), { totalUsd: defiUsd, stableAssetUsd: defiStableUsd });
  const rowsFor = (dimension: "project" | "host" | "asset" | "address"): FundRow[] => {
    const rows = new Map<string, FundRow & { addresses: Set<string>; rawSum: bigint; decimals: number; exact: boolean }>();
    for (const f of all) {
      const id = dimension === "asset" ? assetKey(f.chainId, f.token) : dimension === "address" ? accountKey(f.chainId, f.address) : f[dimension];
      const label = dimension === "asset" ? f.symbol : dimension === "address" ? f.address : id;
      const subtitle = dimension === "asset" ? `${chainNames[f.chainId] || f.chainId} · ${f.defi ? "DeFi 净值" : f.token === "native" ? "原生资产" : f.token}` : dimension === "address" ? `${f.project} · ${f.host} · ${chainNames[f.chainId] || f.chainId} · ${f.role}` : "";
      const r = rows.get(id) || { id, label, subtitle, usd: 0, referenceUsd: 0, priced: 0, unpriced: 0, stale: 0, unknown: 0, accounts: 0, addresses: new Set<string>(), rawSum: 0n, decimals: f.decimals, exact: true };
      if (f.usd !== null && !f.reference) r.priced++;
      if (f.reference) r.referenceUsd += safeNumber(f.usd || 0); else r.usd += safeNumber(f.usd || 0);
      if (f.usd === null && f.quantity !== null && f.quantity !== "0") r.unpriced++;
      if (f.quantity === null && !f.defi) r.unknown++;
      if (f.stale) r.stale++;
      if (!f.defi) r.addresses.add(accountKey(f.chainId, f.address));
      if (!r.observedAt || (f.observedAt && f.observedAt < r.observedAt)) r.observedAt = f.observedAt;
      if (f.raw !== null && f.decimals === r.decimals) r.rawSum += BigInt(f.raw); else r.exact = false;
      rows.set(id, r);
    }
    return [...rows.values()].map(({ addresses, rawSum, decimals, exact, ...r }) => ({ ...r, accounts: addresses.size, quantity: dimension === "asset" && exact ? units(rawSum.toString(), decimals) : undefined })).sort((a, b) => b.usd - a.usd || b.referenceUsd - a.referenceUsd || a.label.localeCompare(b.label));
  };
  const project = rowsFor("project"), host = rowsFor("host"), asset = rowsFor("asset");
  for (const server of registry?.servers || []) if (!host.some(h => h.id === server.alias)) host.push({ id: server.alias, label: server.alias, subtitle: `${server.cloud} · ${server.state} · ${server.guestRead ? "尚无已登记钱包" : "待接入"}`, usd: 0, referenceUsd: 0, priced: 0, unpriced: 0, stale: 0, unknown: 1, accounts: 0 });
  const addresses = rowsFor("address");
  const fleetAt = chains.map(c => c.finishedAt).sort()[0];
  const gaps = [...(registry?.gaps || [])];
  if (!registry) gaps.push("服务器清单尚未接入。");
  if (old(registry?.generatedAt, 180)) gaps.push("服务器发现已超过 3 小时未同步；本机离线期间，新资源可能尚未登记。");
  if (old(fleetAt)) gaps.push("部分服务器余额超过 45 分钟未更新，已保留上次观测值。");
  if (old(personal?.generatedAt, 120)) gaps.push("个人资产快照超过 2 小时未更新，价格和 DeFi 净值可能滞后。");
  gaps.push("服务器钱包仅覆盖登记链、原生币与项目已知代币；未登记代币及服务器 DeFi 仓位尚未全面扫描。");
  const view: FundsView = { version: 1, generatedAt: new Date().toISOString(), registryAt: registry?.generatedAt, fleetAt, personalAt: personal?.generatedAt,
    totalUsd, referenceUsd, referencePricedCount: all.filter(f => f.reference && f.usd !== null && f.quantity !== "0").length, conservativeUsd: estimate.conservativeTotalUsd, stableUsd: estimate.stableAssetUsd, defiUsd,
    accountCount: addresses.length, addressCount: new Set(all.map(f => f.address)).size, overlapCount: overlap.size,
    serverCount: registry?.servers.length || 0, projectCount: project.length,
    unpricedCount: all.filter(f => f.usd === null && f.quantity !== null && f.quantity !== "0").length,
    unknownCount: all.filter(f => f.quantity === null && !f.defi).length, staleCount: all.filter(f => f.stale).length,
    gaps, worker, groups: { project, host, asset } };
  return { view, addresses, facts: all };
}
