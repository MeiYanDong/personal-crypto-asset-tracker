const ARC_CHAIN_ID = "5042";
const ARC_USDC_PREDEPLOY = "0x3600000000000000000000000000000000000000";

type ArcHolding = {
  chainIndex: string;
  symbol: string;
  tokenContractAddress: string;
};

export function dedupeArcUsdcHoldings<T extends ArcHolding>(holdings: T[]): T[] {
  const hasNativeUsdc = holdings.some((holding) =>
    holding.chainIndex === ARC_CHAIN_ID &&
    holding.symbol.toUpperCase() === "USDC" &&
    !holding.tokenContractAddress
  );
  if (!hasNativeUsdc) return holdings;

  return holdings.filter((holding) => !(
    holding.chainIndex === ARC_CHAIN_ID &&
    holding.symbol.toUpperCase() === "USDC" &&
    holding.tokenContractAddress.toLowerCase() === ARC_USDC_PREDEPLOY
  ));
}
