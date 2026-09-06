import { Network } from "lucide-react";
import { forwardRef, useId, type HTMLAttributes, type ReactNode } from "react";
import { IdentityMark } from "./ui/IdentityMark";
import { CountValue } from "./ui/CountValue";
import { BarSegment, DistributionBar } from "./ui/DataBar";
import { LegendItem, LegendList } from "./ui/Legend";
import { percentageOf, PercentageValue } from "./ui/PercentageValue";
import { cx } from "./ui/utils";

export type ChainTokenSummary = {
  symbol: string;
  iconUrl?: string;
  totalUsd: number;
  totalBalance: number;
  riskCount: number;
};

export type ChainExposureSummary = {
  chainKey: string;
  chainName: string;
  totalUsd: number;
  stablecoinUsd: number;
  volatileAssetUsd: number;
  conservativeTotalUsd: number;
  walletCount: number;
  tokenCount: number;
  defiTotalUsd: number;
  protocolCount: number;
  topTokens: ChainTokenSummary[];
};

export type ChainExposureProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  "data-slot"?: string;
  chains: ChainExposureSummary[];
  totalUsd: number;
  scannedChainCount: number;
};

export function chainTone(chainKey: string, chainName: string) {
  const key = chainKey.trim().toLowerCase();
  const name = chainName.trim().toLowerCase();
  if (name.includes("ethereum") || key === "1" || key === "ethereum") return "ethereum";
  if (name.includes("bsc") || name.includes("bnb") || key === "56" || key === "bsc") return "bsc";
  if (name.includes("base") || key === "8453" || key === "base") return "base";
  if (name.includes("robinhood") || key === "4663" || key === "robinhood") return "robinhood";
  if (name.includes("solana") || key === "501" || key === "solana") return "solana";
  if (name.includes("arbitrum") || key === "42161" || key === "arbitrum") return "arbitrum";
  if (name.includes("optimism") || key === "10" || key === "optimism") return "optimism";
  if (name.includes("polygon") || key === "137" || key === "polygon") return "polygon";
  if (name.includes("avalanche") || key === "43114" || key === "avalanche") return "avalanche";
  if (name.includes("xlayer") || name.includes("x-layer") || key === "196" || key === "xlayer") return "xlayer";
  return "neutral";
}

export type ChainIdentityProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  chain: Pick<ChainExposureSummary, "chainKey" | "chainName">;
  icon?: ReactNode;
};

export const ChainIdentity = forwardRef<HTMLDivElement, ChainIdentityProps>(function ChainIdentity({
  chain,
  className,
  icon = <Network />,
  title,
  ...props
}, ref) {
  const keyLabel = chain.chainKey === chain.chainName ? "已识别网络" : `链 ID ${chain.chainKey}`;
  const tone = chainTone(chain.chainKey, chain.chainName);

  return (
    <div
      {...props}
      ref={ref}
      className={cx("chain-identity", className)}
      data-chain={chain.chainKey}
      data-slot="chain-identity"
      data-tone={tone}
      title={title ?? chain.chainName}
    >
      <IdentityMark
        aria-hidden="true"
        className={`chain-badge ${tone}`}
        data-component="chain-identity-mark"
        kind="icon"
      >
        {icon}
      </IdentityMark>
      <div className="chain-identity-content" data-slot="chain-identity-content">
        <strong className="chain-identity-name" data-slot="chain-identity-name">{chain.chainName}</strong>
        <span className="chain-identity-meta" data-slot="chain-identity-meta">{keyLabel}</span>
      </div>
    </div>
  );
});

export const ChainExposure = forwardRef<HTMLElement, ChainExposureProps>(function ChainExposure({
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  chains,
  className,
  "data-slot": inheritedSlot,
  totalUsd,
  scannedChainCount,
  ...props
}, ref) {
  const titleId = useId();
  const allocationLegendId = useId();

  if (!chains.length) {
    return null;
  }

  const visibleChainUsd = chains.reduce((sum, chain) => sum + chain.totalUsd, 0);
  const smallChainUsd = Math.max(0, totalUsd - visibleChainUsd);
  const smallChainShare = percentageOf(smallChainUsd, totalUsd);
  const hasSmallChainAssets = smallChainUsd >= 0.005;
  return (
    <section
      {...props}
      ref={ref}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy ?? (ariaLabel ? undefined : titleId)}
      className={cx("chain-allocation", className)}
      data-chain-count={chains.length}
      data-slot={inheritedSlot ?? "chain-exposure"}
    >
      <div className="chain-allocation-heading" data-slot="chain-exposure-heading">
        <div
          className="chain-heading-title"
          data-slot="chain-exposure-title"
          id={ariaLabel || ariaLabelledBy ? undefined : titleId}
        >
          <Network size={16} />
          <span>链上资产分布</span>
        </div>
        <span data-slot="chain-exposure-summary">
          <CountValue value={chains.length} /> 条有效链 · <CountValue value={scannedChainCount} /> 条扫描范围
        </span>
      </div>

      <DistributionBar
        aria-describedby={allocationLegendId}
        className="chain-allocation-track"
        data-slot="chain-exposure-bar"
        label="链上资产分布"
      >
        {chains.map((chain) => (
          <BarSegment
            className={`chain-allocation-segment ${chainTone(chain.chainKey, chain.chainName)}`}
            key={chain.chainKey}
            minimumVisible
            value={percentageOf(chain.totalUsd, totalUsd)}
          />
        ))}
        {hasSmallChainAssets ? (
          <BarSegment
            className="chain-allocation-segment neutral"
            minimumVisible
            value={smallChainShare}
          />
        ) : null}
      </DistributionBar>

      <LegendList
        className="chain-allocation-legend"
        data-slot="chain-exposure-legend"
        id={allocationLegendId}
        label="链上资产分布图例"
        layout="grid"
      >
        {chains.map((chain) => {
          const share = percentageOf(chain.totalUsd, totalUsd);
          return (
            <LegendItem
              key={chain.chainKey}
              label={chain.chainName}
              swatchClassName={chainTone(chain.chainKey, chain.chainName)}
              value={<PercentageValue value={share} />}
            />
          );
        })}
        {hasSmallChainAssets ? (
          <LegendItem
            label="链上小额资产"
            swatchClassName="neutral"
            value={<PercentageValue value={smallChainShare} />}
          />
        ) : null}
      </LegendList>
    </section>
  );
});

export default ChainExposure;
