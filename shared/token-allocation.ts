export type AllocationToken = {
  symbol: string;
  totalUsd: number;
};

export type TokenAllocationSlice = AllocationToken & {
  share: number;
};

export function calculateTokenAllocation(tokens: AllocationToken[], visibleCount = 5) {
  const totals = new Map<string, number>();
  for (const token of tokens) {
    if (!Number.isFinite(token.totalUsd) || token.totalUsd <= 0) continue;
    const symbol = token.symbol.trim() || "未知币种";
    totals.set(symbol, (totals.get(symbol) || 0) + token.totalUsd);
  }

  const ranked = Array.from(totals, ([symbol, totalUsd]) => ({ symbol, totalUsd }))
    .sort((left, right) => right.totalUsd - left.totalUsd || left.symbol.localeCompare(right.symbol));
  const totalUsd = ranked.reduce((sum, token) => sum + token.totalUsd, 0);
  const top = ranked.slice(0, visibleCount);
  const otherUsd = ranked.slice(visibleCount).reduce((sum, token) => sum + token.totalUsd, 0);
  const slices: TokenAllocationSlice[] = [...top, ...(otherUsd >= 0.005 ? [{ symbol: "其他", totalUsd: otherUsd }] : [])]
    .map((token) => ({ ...token, share: totalUsd > 0 ? token.totalUsd / totalUsd : 0 }));

  return { totalUsd, tokenCount: ranked.length, slices };
}
