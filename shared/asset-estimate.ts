export type AssetEstimateToken = {
  symbol: string;
  totalUsd: number;
  totalBalance: number;
  riskCount: number;
};

export const stablecoinSymbols = new Set([
  "AXLUSDC",
  "BUSD",
  "DAI",
  "FDUSD",
  "GUSD",
  "PYUSD",
  "TUSD",
  "USDBC",
  "USDC",
  "USDC.E",
  "USDCE",
  "USDG",
  "USDP",
  "USDS",
  "USDT",
  "USDT.E",
  "USDT0"
]);

export const conservativeVolatileFactor = 0.8;
export const stablecoinMinPrice = 0.9;
export const stablecoinMaxPrice = 1.1;

function canonicalTokenSymbol(symbol: string) {
  return symbol.trim().toUpperCase().replace(/₮/g, "T");
}

export function calculateConservativeEstimate(tokenSummary: AssetEstimateToken[]) {
  const stablecoinUsd = tokenSummary.reduce((sum, token) => {
    const impliedPrice = token.totalBalance > 0 ? token.totalUsd / token.totalBalance : 0;
    const isStablecoin =
      stablecoinSymbols.has(canonicalTokenSymbol(token.symbol)) &&
      token.riskCount === 0 &&
      impliedPrice >= stablecoinMinPrice &&
      impliedPrice <= stablecoinMaxPrice;
    return isStablecoin ? sum + token.totalUsd : sum;
  }, 0);
  const totalUsd = tokenSummary.reduce((sum, token) => sum + token.totalUsd, 0);
  const volatileAssetUsd = Math.max(0, totalUsd - stablecoinUsd);

  return {
    stablecoinUsd,
    volatileAssetUsd,
    conservativeTotalUsd: stablecoinUsd + volatileAssetUsd * conservativeVolatileFactor
  };
}
