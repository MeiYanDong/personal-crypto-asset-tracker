import { Network } from "lucide-react";
import { IdentityMark } from "./ui/IdentityMark";
import { BarSegment, DistributionBar } from "./ui/DataBar";
import { LegendItem, LegendList } from "./ui/Legend";

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
  topTokens: ChainTokenSummary[];
};

type ChainExposureProps = {
  chains: ChainExposureSummary[];
  totalUsd: number;
  scannedChainCount: number;
};

function percentage(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, (value / total) * 100));
}

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

export function ChainIdentity({ chain }: { chain: Pick<ChainExposureSummary, "chainKey" | "chainName"> }) {
  const keyLabel = chain.chainKey === chain.chainName ? "已识别网络" : `链 ID ${chain.chainKey}`;
  return (
    <div className="chain-identity">
      <IdentityMark
        aria-hidden="true"
        className={`chain-badge ${chainTone(chain.chainKey, chain.chainName)}`}
        kind="icon"
      >
        <Network />
      </IdentityMark>
      <div>
        <strong>{chain.chainName}</strong>
        <span>{keyLabel}</span>
      </div>
    </div>
  );
}

export default function ChainExposure({ chains, totalUsd, scannedChainCount }: ChainExposureProps) {
  if (!chains.length) {
    return null;
  }

  const visibleChainUsd = chains.reduce((sum, chain) => sum + chain.totalUsd, 0);
  const smallChainUsd = Math.max(0, totalUsd - visibleChainUsd);
  const smallChainShare = percentage(smallChainUsd, totalUsd);
  const hasSmallChainAssets = smallChainUsd >= 0.005;
  const allocationLabel = [
    ...chains.map((chain) => `${chain.chainName} ${percentage(chain.totalUsd, totalUsd).toFixed(1)}%`),
    ...(hasSmallChainAssets ? [`链上小额资产 ${smallChainShare.toFixed(1)}%`] : [])
  ].join("，");

  return (
    <section className="chain-allocation" aria-labelledby="chain-allocation-title">
      <div className="chain-allocation-heading">
        <div className="chain-heading-title" id="chain-allocation-title">
          <Network size={16} />
          <span>链上资产分布</span>
        </div>
        <span>{chains.length} 条有效链 · {scannedChainCount} 条扫描范围</span>
      </div>

      <DistributionBar
        className="chain-allocation-track"
        label={allocationLabel}
      >
        {chains.map((chain) => (
          <BarSegment
            className={`chain-allocation-segment ${chainTone(chain.chainKey, chain.chainName)}`}
            key={chain.chainKey}
            minimumVisible
            value={percentage(chain.totalUsd, totalUsd)}
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

      <LegendList className="chain-allocation-legend" label="链上资产分布图例">
        {chains.map((chain) => {
          const share = percentage(chain.totalUsd, totalUsd);
          return (
            <LegendItem
              key={chain.chainKey}
              label={chain.chainName}
              swatchClassName={chainTone(chain.chainKey, chain.chainName)}
              value={`${share < 0.1 && share > 0 ? "<0.1" : share.toFixed(1)}%`}
            />
          );
        })}
        {hasSmallChainAssets ? (
          <LegendItem
            label="链上小额资产"
            swatchClassName="neutral"
            value={`${smallChainShare < 0.1 ? "<0.1" : smallChainShare.toFixed(1)}%`}
          />
        ) : null}
      </LegendList>
    </section>
  );
}
