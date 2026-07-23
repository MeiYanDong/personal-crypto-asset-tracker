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
import { conservativeVolatileFactor } from "../../shared/asset-estimate";
import { CountPair, CountValue, CountWithUnit } from "./ui/CountValue";
import { BarSegment, DistributionBar, MeterBar } from "./ui/DataBar";
import { CurrencyValue } from "./ui/CurrencyValue";
import { InfoPopover } from "./ui/InfoPopover";
import { LegendItem, LegendList } from "./ui/Legend";
import { formatPercentage, percentageOf, PercentageValue } from "./ui/PercentageValue";
import { Skeleton } from "./ui/Skeleton";
import { TimeValue, useRelativeTimeClock } from "./ui/TimeValue";
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
  updatedAt?: string;
};

export type PortfolioSummarySkeletonProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  "data-slot"?: string;
};

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
  const share = percentageOf(value, total);
  const shareLabel = formatPercentage(share);
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
        label={`${label} ${shareLabel}`}
        value={share}
      >
        <BarSegment className="asset-share-indicator" minimumVisible={share > 0} value={share} />
      </MeterBar>
      <span aria-hidden="true" className="asset-share-value" data-slot="asset-share-value">
        <PercentageValue value={share} />
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
  updatedAt,
  ...props
}, ref) {
  const stableShare = percentageOf(stablecoinUsd, totalUsd);
  const volatileShare = percentageOf(volatileAssetUsd, totalUsd);
  const valuationBufferUsd = Math.max(0, totalUsd - conservativeTotalUsd);
  const hasCoverageGap = walletCount > 0 && coveredWalletCount < walletCount;
  const coverageState = walletCount === 0 ? "empty" : hasCoverageGap ? "partial" : "complete";
  const allocationLegendId = useId();
  const relativeNow = useRelativeTimeClock(Boolean(updatedAt));

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
            最后刷新 <TimeValue mode="hybrid" now={relativeNow} value={updatedAt} />
          </span>
          {hasCoverageGap ? (
            <span className="summary-meta coverage-gap">
              <ShieldAlert size={13} />
              仅计入{" "}
              <CountWithUnit unit="个钱包">
                <CountPair first={coveredWalletCount} second={walletCount} />
              </CountWithUnit>
            </span>
          ) : null}
        </div>
      </div>

      <div className="portfolio-risk-block" data-slot="portfolio-valuation">
        <div className="risk-heading" data-slot="portfolio-valuation-heading">
          <span>
            <ShieldCheck size={16} />
            保守估值
            <InfoPopover
              description="价格接近 1 美元且没有风险标记的稳定币按完整市值计入，其他资产按折价后市值计入。"
              label="查看保守估值计算方式"
              title="保守估值计算"
            >
              <p className="portfolio-estimate-formula">
                稳定币 + 波动资产 × <PercentageValue value={conservativeVolatileFactor * 100} />
              </p>
              <dl className="portfolio-estimate-breakdown">
                <div>
                  <dt>稳定币</dt>
                  <dd>
                    <CurrencyValue value={stablecoinUsd} />
                    <span>× <PercentageValue value={100} /></span>
                  </dd>
                </div>
                <div>
                  <dt>波动资产</dt>
                  <dd>
                    <CurrencyValue value={volatileAssetUsd} />
                    <span>× <PercentageValue value={conservativeVolatileFactor * 100} /></span>
                  </dd>
                </div>
                <div data-total="true">
                  <dt>保守估值</dt>
                  <dd>
                    <span aria-hidden="true">≈</span>
                    <span className="sr-only">约等于</span>
                    <CurrencyValue value={conservativeTotalUsd} />
                  </dd>
                </div>
              </dl>
            </InfoPopover>
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
          <dd><CountValue value={walletCount} /></dd>
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
            ) : walletMeta || <><CountValue value={addressCount} /> 个地址</>}
          </span>
        </div>
        <div data-slot="portfolio-fact">
          <dt><Coins size={15} />币种</dt>
          <dd><CountValue value={tokenCount} /></dd>
          <span>价值不低于 $1</span>
        </div>
        <div data-slot="portfolio-fact">
          <dt><Network size={15} />有效链</dt>
          <dd><CountValue value={activeChainCount} /></dd>
          <span><CountValue value={scannedChainCount} /> 条扫描范围</span>
        </div>
      </dl>
    </section>
  );
});

export default PortfolioSummary;
