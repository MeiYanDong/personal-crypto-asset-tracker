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
import { CurrencyValue } from "./ui/CurrencyValue";
import { LegendItem, LegendList } from "./ui/Legend";
import { Skeleton } from "./ui/Skeleton";
import { cx } from "./ui/utils";

export type PortfolioSummaryProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  "data-slot"?: string;
  scopeLabel: string;
  totalUsd: number;
  conservativeTotalUsd: number;
  stablecoinUsd: number;
  volatileAssetUsd: number;
  walletCount: number;
  coveredWalletCount: number;
  addressCount: number;
  walletMeta?: string;
  walletMetaLabel?: string;
  tokenCount: number;
  activeChainCount: number;
  scannedChainCount: number;
  updatedAtLabel: string;
};

export type PortfolioSummarySkeletonProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  "data-slot"?: string;
};

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
        data-slot="asset-share-meter"
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

export const PortfolioSummarySkeleton = forwardRef<HTMLElement, PortfolioSummarySkeletonProps>(
  function PortfolioSummarySkeleton({
    className,
    "data-slot": inheritedSlot,
    ...props
  }, ref) {
    return (
      <section
        {...props}
        ref={ref}
        aria-hidden="true"
        className={cx("portfolio-summary", "portfolio-summary-skeleton", className)}
        data-slot={inheritedSlot ?? "portfolio-summary-skeleton"}
        data-state="loading"
      >
        <div className="portfolio-total-block" data-slot="portfolio-skeleton-total-block">
          <Skeleton className="portfolio-skeleton-kicker" data-slot="portfolio-skeleton-kicker" />
          <Skeleton className="portfolio-skeleton-total" data-slot="portfolio-skeleton-total" />
          <div className="portfolio-skeleton-meta" data-slot="portfolio-skeleton-meta">
            <Skeleton />
            <Skeleton />
          </div>
        </div>

        <div className="portfolio-risk-block" data-slot="portfolio-skeleton-valuation-block">
          <div className="portfolio-skeleton-heading">
            <Skeleton />
            <Skeleton />
          </div>
          <Skeleton className="portfolio-skeleton-track" data-slot="portfolio-skeleton-track" />
          <div className="portfolio-skeleton-legend" data-slot="portfolio-skeleton-legend">
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </div>
        </div>

        <dl className="portfolio-facts" data-slot="portfolio-skeleton-facts">
          {[0, 1, 2].map((index) => (
            <div data-slot="portfolio-skeleton-fact" key={index}>
              <dt><Skeleton className="portfolio-skeleton-fact-label" /></dt>
              <dd><Skeleton className="portfolio-skeleton-fact-value" /></dd>
              <span><Skeleton className="portfolio-skeleton-fact-meta" /></span>
            </div>
          ))}
        </dl>
      </section>
    );
  }
);

export const PortfolioSummary = forwardRef<HTMLElement, PortfolioSummaryProps>(function PortfolioSummary({
  "aria-label": ariaLabel = "资产摘要",
  className,
  "data-slot": inheritedSlot,
  scopeLabel,
  totalUsd,
  conservativeTotalUsd,
  stablecoinUsd,
  volatileAssetUsd,
  walletCount,
  coveredWalletCount,
  addressCount,
  walletMeta,
  walletMetaLabel,
  tokenCount,
  activeChainCount,
  scannedChainCount,
  updatedAtLabel,
  ...props
}, ref) {
  const stableShare = percentage(stablecoinUsd, totalUsd);
  const volatileShare = percentage(volatileAssetUsd, totalUsd);
  const valuationBufferUsd = Math.max(0, totalUsd - conservativeTotalUsd);
  const hasCoverageGap = walletCount > 0 && coveredWalletCount < walletCount;
  const coverageState = walletCount === 0 ? "empty" : hasCoverageGap ? "partial" : "complete";
  const allocationLegendId = useId();

  return (
    <section
      {...props}
      ref={ref}
      aria-label={ariaLabel}
      className={cx("portfolio-summary", className)}
      data-coverage={coverageState}
      data-slot={inheritedSlot ?? "portfolio-summary"}
    >
      <div className="portfolio-total-block" data-slot="portfolio-total">
        <div className="summary-kicker" data-slot="portfolio-total-label">
          <CircleDollarSign size={16} />
          <span>{scopeLabel}</span>
        </div>
        <strong className="portfolio-total-value" data-slot="portfolio-total-value">
          <CurrencyValue value={totalUsd} />
        </strong>
        <div className="summary-meta-stack" data-slot="portfolio-total-meta">
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

      <div className="portfolio-risk-block" data-slot="portfolio-valuation">
        <div className="risk-heading" data-slot="portfolio-valuation-heading">
          <span>
            <ShieldCheck size={16} />
            保守估值
          </span>
          <strong data-slot="portfolio-valuation-value">
            <CurrencyValue value={conservativeTotalUsd} />
          </strong>
        </div>

        <DistributionBar
          aria-describedby={allocationLegendId}
          className="allocation-track"
          data-slot="portfolio-allocation"
          label="资产构成"
        >
          <BarSegment className="stable-allocation" value={stableShare} />
          <BarSegment className="volatile-allocation" value={volatileShare} />
        </DistributionBar>

        <LegendList
          className="allocation-legend"
          data-slot="portfolio-allocation-legend"
          id={allocationLegendId}
          label="资产构成与估值调整"
        >
          <LegendItem label="稳定币" swatchClassName="stable" value={<CurrencyValue value={stablecoinUsd} />} />
          <LegendItem label="波动资产" swatchClassName="volatile" value={<CurrencyValue value={volatileAssetUsd} />} />
          <LegendItem
            label="折价缓冲"
            swatchClassName="buffer"
            swatchVariant="outline"
            value={<CurrencyValue value={valuationBufferUsd} />}
          />
        </LegendList>
      </div>

      <dl className="portfolio-facts" data-slot="portfolio-facts">
        <div data-slot="portfolio-fact">
          <dt><WalletCards size={15} />钱包</dt>
          <dd>{walletCount}</dd>
          <span
            data-condensed={Boolean(walletMeta && walletMetaLabel) || undefined}
            data-slot="portfolio-wallet-meta"
            title={walletMetaLabel}
          >
            {walletMeta && walletMetaLabel ? (
              <>
                <span aria-hidden="true">{walletMeta}</span>
                <span className="sr-only">{walletMetaLabel}</span>
              </>
            ) : walletMeta || `${addressCount} 个地址`}
          </span>
        </div>
        <div data-slot="portfolio-fact">
          <dt><Coins size={15} />币种</dt>
          <dd>{tokenCount}</dd>
          <span>价值不低于 $1</span>
        </div>
        <div data-slot="portfolio-fact">
          <dt><Network size={15} />有效链</dt>
          <dd>{activeChainCount}</dd>
          <span>{scannedChainCount} 条扫描范围</span>
        </div>
      </dl>
    </section>
  );
});

export default PortfolioSummary;
