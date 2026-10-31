import limits from "./funds-limits.json" with { type: "json" };
import type { FundRegistry } from "./funds.js";
export { limits };
const core = new Set(["ETH", "BNB", "HYPE", "OKB", "WETH", "USDG", "USDC", "USDT", "MM"]);
export function balanceItems(registry: FundRegistry) {
  return registry.addresses.reduce((sum, a) => sum + (Number(a.chainId) === 501 ? 256 : 1 + registry.tokens.filter(t => String(t.chainId) === String(a.chainId) && (a.role !== "sender" || core.has(t.symbol))).length), 0);
}
export function withinCapacity(registry: FundRegistry) {
  return registry.addresses.length <= limits.accounts && registry.tokens.length <= limits.tokens && registry.servers.length <= limits.servers
    && registry.addresses.filter(a => Number(a.chainId) === 501).length <= limits.solanaAccounts
    && registry.addresses.every(a => limits.chains.includes(Number(a.chainId))) && balanceItems(registry) <= limits.balanceItems;
}
