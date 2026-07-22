import {
  CircleDollarSign,
  Clock3,
  Coins,
  Network,
  ShieldAlert,
  ShieldCheck,
  WalletCards
} from "lucide-react";
import { forwardRef, useId, type HTMLAttributes } from "react";
import { BarSegment, DistributionBar, MeterBar } from "./ui/DataBar";
import { LegendItem, LegendList } from "./ui/Legend";
import { cx } from "./ui/utils";

type PortfolioSummaryProps = {
  scopeLabel: string;
  totalUsd: number;
  conservativeTotalUsd: number;
  stablecoinUsd: number;
  volatileAssetUsd: number;
  walletCount: number;
  coveredWalletCount: number;
  addressCount: number;
  tokenCount: number;
  activeChainCount: number;
  scannedChainCount: number;
  updatedAtLabel: string;
};

function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2
  }).format(value || 0);
}

function percentage(value: number, total: number) {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, (value / total) * 100));
}

export type AssetShareBarProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  label?: string;
  total: number;
  value: number;
};

export const AssetShareBar = forwardRef<HTMLDivElement, AssetShareBarProps>(function AssetShareBar({
  className,
  label = "占总资产",
  total,
  value,
  ...props
}, ref) {
  const share = percentage(value, total);
  const shareLabel = share < 0.1 && share > 0 ? "<0.1" : share.toFixed(1);
  const state = share <= 0 ? "empty" : share >= 100 ? "full" : "partial";

  return (
    <div
      {...props}
      ref={ref}
      className={cx("asset-share", className)}
      data-share={Number(share.toFixed(4))}
      data-slot="asset-share"
      data-state={state}
    >
      <MeterBar
        className="asset-share-track"
        data-component="asset-share-meter"
        label={`${label} ${shareLabel}%`}
        value={share}
      >
        <BarSegment className="asset-share-indicator" minimumVisible={share > 0} value={share} />
      </MeterBar>
      <span aria-hidden="true" className="asset-share-value" data-slot="asset-share-value">
        {shareLabel}%
      </span>
    </div>
  );
});

export default function PortfolioSummary({
  scopeLabel,
  totalUsd,
  conservativeTotalUsd,
  stablecoinUsd,
  volatileAssetUsd,
  walletCount,
  coveredWalletCount,
  addressCount,
  tokenCount,
  activeChainCount,
  scannedChainCount,
  updatedAtLabel
}: PortfolioSummaryProps) {
  const stableShare = percentage(stablecoinUsd, totalUsd);
  const volatileShare = percentage(volatileAssetUsd, totalUsd);
  const valuationBufferUsd = Math.max(0, totalUsd - conservativeTotalUsd);
  const hasCoverageGap = walletCount > 0 && coveredWalletCount < walletCount;
  const allocationLegendId = useId();

  return (
    <section className="portfolio-summary" aria-label="资产摘要">
      <div className="portfolio-total-block">
        <div className="summary-kicker">
          <CircleDollarSign size={16} />
          <span>{scopeLabel}</span>
        </div>
        <strong className="portfolio-total-value">{currency(totalUsd)}</strong>
        <div className="summary-meta-stack">
          <span className="summary-meta">
            <Clock3 size={13} />
            最后刷新 {updatedAtLabel}
          </span>
          {hasCoverageGap ? (
            <span className="summary-meta coverage-gap">
              <ShieldAlert size={13} />
              仅计入 {coveredWalletCount} / {walletCount} 个钱包
            </span>
          ) : null}
        </div>
      </div>

      <div className="portfolio-risk-block">
        <div className="risk-heading">
          <span>
            <ShieldCheck size={16} />
            保守估值
          </span>
          <strong>{currency(conservativeTotalUsd)}</strong>
        </div>

        <DistributionBar
          aria-describedby={allocationLegendId}
          className="allocation-track"
          label="资产构成"
        >
          <BarSegment className="stable-allocation" value={stableShare} />
          <BarSegment className="volatile-allocation" value={volatileShare} />
        </DistributionBar>

        <LegendList
          className="allocation-legend"
          id={allocationLegendId}
          label="资产构成与估值调整"
        >
          <LegendItem label="稳定币" swatchClassName="stable" value={currency(stablecoinUsd)} />
          <LegendItem label="波动资产" swatchClassName="volatile" value={currency(volatileAssetUsd)} />
          <LegendItem
            label="折价缓冲"
            swatchClassName="buffer"
            swatchVariant="outline"
            value={currency(valuationBufferUsd)}
          />
        </LegendList>
      </div>

      <dl className="portfolio-facts">
        <div>
          <dt><WalletCards size={15} />钱包</dt>
          <dd>{walletCount}</dd>
          <span>{addressCount} 个地址</span>
        </div>
        <div>
          <dt><Coins size={15} />币种</dt>
          <dd>{tokenCount}</dd>
          <span>价值不低于 $1</span>
        </div>
        <div>
          <dt><Network size={15} />有效链</dt>
          <dd>{activeChainCount}</dd>
          <span>{scannedChainCount} 条扫描范围</span>
        </div>
      </dl>
    </section>
  );
}
