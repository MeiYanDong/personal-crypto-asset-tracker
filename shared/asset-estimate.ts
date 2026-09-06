export type AssetEstimateToken = {
  symbol: string;
  totalUsd: number;
  totalBalance: number;
  riskCount: number;
};

export type AdditionalAssetEstimate = {
  totalUsd: number;
  stableAssetUsd?: number;
  stablecoinUsd?: number;
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

export const stableAssetSymbols = new Set(["SPY"]);

export const conservativeVolatileFactor = 0.8;
export const stablecoinMinPrice = 0.9;
export const stablecoinMaxPrice = 1.1;

export function canonicalAssetSymbol(symbol: string) {
  return symbol.trim().toUpperCase().replace(/₮/g, "T");
}

export function stableAssetBreakdown(tokenSummary: readonly AssetEstimateToken[]) {
  return tokenSummary.reduce((totals, token) => {
    const symbol = canonicalAssetSymbol(token.symbol);
    const impliedPrice = token.totalBalance > 0 ? token.totalUsd / token.totalBalance : 0;
    const isStablecoin =
      stablecoinSymbols.has(symbol) &&
      token.riskCount === 0 &&
      impliedPrice >= stablecoinMinPrice &&
      impliedPrice <= stablecoinMaxPrice;
    const isNamedStableAsset = stableAssetSymbols.has(symbol) && token.riskCount === 0;
    const stableUsd = isStablecoin || isNamedStableAsset ? Math.max(0, token.totalUsd) : 0;
    return {
      stablecoinUsd: totals.stablecoinUsd + (isStablecoin ? stableUsd : 0),
      stableAssetUsd: totals.stableAssetUsd + stableUsd
    };
  }, { stablecoinUsd: 0, stableAssetUsd: 0 });
}

export function calculateConservativeEstimate(
  tokenSummary: readonly AssetEstimateToken[],
  additionalAssets: number | AdditionalAssetEstimate = 0
) {
  const tokenStable = stableAssetBreakdown(tokenSummary);
  const additionalTotalUsd = typeof additionalAssets === "number"
    ? additionalAssets
    : additionalAssets.totalUsd;
  const safeAdditionalTotalUsd = Number.isFinite(additionalTotalUsd) ? additionalTotalUsd : 0;
  const maxAdditionalStableUsd = Math.max(0, safeAdditionalTotalUsd);
  const additionalStableAssetUsd = typeof additionalAssets === "number"
    ? 0
    : Math.min(maxAdditionalStableUsd, Math.max(0, Number(additionalAssets.stableAssetUsd) || 0));
  const additionalStablecoinUsd = typeof additionalAssets === "number"
    ? 0
    : Math.min(additionalStableAssetUsd, Math.max(0, Number(additionalAssets.stablecoinUsd) || 0));
  const stablecoinUsd = tokenStable.stablecoinUsd + additionalStablecoinUsd;
  const stableAssetUsd = tokenStable.stableAssetUsd + additionalStableAssetUsd;
  const totalUsd = tokenSummary.reduce((sum, token) => sum + token.totalUsd, 0) + safeAdditionalTotalUsd;
  const volatileAssetUsd = Math.max(0, totalUsd - stableAssetUsd);

  return {
    stablecoinUsd,
    stableAssetUsd,
    volatileAssetUsd,
    conservativeTotalUsd: stableAssetUsd + volatileAssetUsd * conservativeVolatileFactor
  };
}
