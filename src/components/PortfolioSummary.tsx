import {
  CircleDollarSign,
  Clock3,
  Coins,
  Landmark,
  Network,
  ShieldAlert,
  ShieldCheck,
  WalletCards
} from "lucide-react";
import { forwardRef, useId, type HTMLAttributes, type ReactNode } from "react";
import { conservativeVolatileFactor } from "../../shared/asset-estimate";
import { CountPair, CountValue, CountWithUnit } from "./ui/CountValue";
import { BarSegment, DistributionBar } from "./ui/DataBar";
import { CurrencyValue, formatExactCurrency } from "./ui/CurrencyValue";
import { InfoPopover } from "./ui/InfoPopover";
import { formatPercentage, percentageOf, PercentageValue } from "./ui/PercentageValue";
import { Skeleton } from "./ui/Skeleton";
import {
  StatContent,
  StatDescription,
  StatItem,
  StatLabel,
  StatList,
  StatValue
} from "./ui/Stat";
import { TimeValue, useRelativeTimeClock } from "./ui/TimeValue";
import { cx } from "./ui/utils";
import { ValuePlaceholder } from "./ui/ValuePlaceholder";

export type PortfolioSummaryProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  "data-slot"?: string;
  assetDataAvailable: boolean;
  scopeLabel: string;
  totalUsd: number;
  conservativeTotalUsd: number;
  stableAssetUsd: number;
  volatileAssetUsd: number;
  defiTotalUsd: number;
  defiProtocolCount: number;
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

type PortfolioEstimateItemProps = {
  approximate?: boolean;
  label: string;
  note?: ReactNode;
  total?: boolean;
  value: ReactNode;
};

function PortfolioEstimateItem({
  approximate = false,
  label,
  note,
  total = false,
  value
}: PortfolioEstimateItemProps) {
  return (
    <div data-slot="portfolio-estimate-item" data-total={total || undefined}>
      <dt>{label}</dt>
      <dd>
        {approximate ? (
          <>
            <span
              aria-hidden="true"
              className="portfolio-estimate-operator"
              data-slot="portfolio-estimate-operator"
            >
              ≈
            </span>
            <span className="sr-only">约等于</span>
          </>
        ) : null}
        <span className="portfolio-estimate-value" data-slot="portfolio-estimate-value">
          {value}
        </span>
        {note ? (
          <span className="portfolio-estimate-note" data-slot="portfolio-estimate-note">
            {note}
          </span>
        ) : null}
      </dd>
    </div>
  );
}

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

        <StatList className="portfolio-facts" data-slot="portfolio-skeleton-facts">
          {[0, 1, 2].map((index) => (
            <StatItem data-slot="portfolio-skeleton-fact" key={index}>
              <StatLabel><Skeleton className="portfolio-skeleton-fact-label" /></StatLabel>
              <StatContent>
                <StatValue><Skeleton className="portfolio-skeleton-fact-value" /></StatValue>
                <StatDescription><Skeleton className="portfolio-skeleton-fact-meta" /></StatDescription>
              </StatContent>
            </StatItem>
          ))}
        </StatList>
      </section>
    );
  }
);

export const PortfolioSummary = forwardRef<HTMLElement, PortfolioSummaryProps>(function PortfolioSummary({
  "aria-label": ariaLabel = "资产摘要",
  assetDataAvailable,
  className,
  "data-slot": inheritedSlot,
  scopeLabel,
  totalUsd,
  conservativeTotalUsd,
  stableAssetUsd,
  volatileAssetUsd,
  defiTotalUsd,
  defiProtocolCount,
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
  const stableShare = percentageOf(stableAssetUsd, totalUsd);
  const adjustedVolatileUsd = Math.max(0, volatileAssetUsd * conservativeVolatileFactor);
  const valuationBufferUsd = Math.max(0, volatileAssetUsd - adjustedVolatileUsd);
  const adjustedVolatileShare = percentageOf(adjustedVolatileUsd, totalUsd);
  const valuationBufferShare = percentageOf(valuationBufferUsd, totalUsd);
  const hasCoverageGap = walletCount > 0 && coveredWalletCount < walletCount;
  const coverageState = walletCount === 0
    ? "empty"
    : !assetDataAvailable
      ? "missing"
      : hasCoverageGap
        ? "partial"
        : "complete";
  const valuationBridgeId = useId();
  const relativeNow = useRelativeTimeClock(Boolean(updatedAt));
  const assetValue = (value: number, exact = false) => assetDataAvailable
    ? <CurrencyValue precision={exact ? "exact" : undefined} value={value} />
    : <ValuePlaceholder label="暂无资产数据" />;
  const valuationBridgeLabel = assetDataAvailable
    ? [
        `保守估值构成`,
        `稳定资产全额计入 ${formatExactCurrency(stableAssetUsd)}`,
        `波动资产按 ${formatPercentage(conservativeVolatileFactor * 100)} 计入 ${formatExactCurrency(adjustedVolatileUsd)}`,
        `折价缓冲 ${formatExactCurrency(valuationBufferUsd)} 不计入`,
        `保守估值 ${formatExactCurrency(conservativeTotalUsd)}`
      ].join("；")
    : "保守估值构成；暂无资产数据";

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
          {assetValue(totalUsd)}
        </strong>
        <div className="summary-meta-stack" data-slot="portfolio-total-meta">
          <span className="summary-meta">
            <Clock3 size={13} />
            最后刷新 <TimeValue mode="hybrid" now={relativeNow} value={updatedAt} />
          </span>
          {assetDataAvailable && defiTotalUsd >= 1 ? (
            <span className="summary-meta">
              <Landmark size={13} />
              DeFi <CurrencyValue value={defiTotalUsd} /> · <CountValue value={defiProtocolCount} /> 个协议
            </span>
          ) : null}
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
              description="SPY 与价格接近 1 美元且没有风险标记的稳定币按完整市值计入；其他资产按折价后市值计入。"
              label="查看保守估值计算方式"
              title="保守估值计算"
            >
              <p className="portfolio-estimate-formula">
                稳定资产 + 波动资产 × <PercentageValue value={conservativeVolatileFactor * 100} />
              </p>
              <dl className="portfolio-estimate-breakdown">
                <PortfolioEstimateItem
                  label="稳定资产"
                  note={assetDataAvailable ? <>× <PercentageValue value={100} /></> : "等待刷新"}
                  value={assetValue(stableAssetUsd, true)}
                />
                <PortfolioEstimateItem
                  label="波动资产计入"
                  note={assetDataAvailable ? (
                    <>
                      由 {formatExactCurrency(volatileAssetUsd)} ×{" "}
                      <PercentageValue value={conservativeVolatileFactor * 100} />
                    </>
                  ) : "等待刷新"}
                  value={assetValue(adjustedVolatileUsd, true)}
                />
                <PortfolioEstimateItem
                  label="折价缓冲"
                  note={assetDataAvailable ? "不计入" : "等待刷新"}
                  value={assetValue(-valuationBufferUsd, true)}
                />
                <PortfolioEstimateItem
                  approximate
                  label="保守估值"
                  total
                  value={assetValue(conservativeTotalUsd, true)}
                />
              </dl>
            </InfoPopover>
          </span>
          <strong data-slot="portfolio-valuation-value">
            {assetValue(conservativeTotalUsd)}
          </strong>
        </div>

        <DistributionBar
          aria-describedby={valuationBridgeId}
          className="allocation-track"
          data-slot="portfolio-valuation-bridge"
          label={valuationBridgeLabel}
        >
          <BarSegment className="stable-allocation" value={stableShare} />
          <BarSegment className="volatile-allocation" value={adjustedVolatileShare} />
          <BarSegment
            className="valuation-buffer-allocation"
            minimumVisible={valuationBufferShare > 0}
            value={valuationBufferShare}
          />
        </DistributionBar>

        <dl
          className="valuation-bridge"
          data-slot="portfolio-valuation-breakdown"
          id={valuationBridgeId}
        >
          <div data-tone="stable">
            <dt><span aria-hidden="true" />稳定资产</dt>
            <dd>
              {assetValue(stableAssetUsd)}
              <span>{assetDataAvailable ? "全额计入" : "等待刷新"}</span>
            </dd>
          </div>
          <div data-tone="volatile">
            <dt><span aria-hidden="true" />波动资产</dt>
            <dd>
              {assetValue(adjustedVolatileUsd)}
              <span>
                {assetDataAvailable
                  ? <>计入 <PercentageValue value={conservativeVolatileFactor * 100} /></>
                  : "等待刷新"}
              </span>
            </dd>
          </div>
          <div data-tone="buffer">
            <dt><span aria-hidden="true" />折价缓冲</dt>
            <dd>
              {assetValue(-valuationBufferUsd)}
              <span>{assetDataAvailable ? "未计入" : "等待刷新"}</span>
            </dd>
          </div>
        </dl>
      </div>

      <StatList className="portfolio-facts" data-slot="portfolio-facts">
        <StatItem data-slot="portfolio-fact">
          <StatLabel><WalletCards size={15} />钱包</StatLabel>
          <StatContent>
            <StatValue><CountValue value={walletCount} /></StatValue>
            <StatDescription
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
            </StatDescription>
          </StatContent>
        </StatItem>
        <StatItem data-slot="portfolio-fact">
          <StatLabel><Coins size={15} />币种</StatLabel>
          <StatContent>
            <StatValue>
              {assetDataAvailable
                ? <CountValue value={tokenCount} />
                : <ValuePlaceholder label="暂无资产数据" />}
            </StatValue>
            <StatDescription>价值不低于 $1</StatDescription>
          </StatContent>
        </StatItem>
        <StatItem data-slot="portfolio-fact">
          <StatLabel><Network size={15} />有效链</StatLabel>
          <StatContent>
            <StatValue>
              {assetDataAvailable
                ? <CountValue value={activeChainCount} />
                : <ValuePlaceholder label="暂无资产数据" />}
            </StatValue>
            <StatDescription><CountValue value={scannedChainCount} /> 条扫描范围</StatDescription>
          </StatContent>
        </StatItem>
      </StatList>
    </section>
  );
});

export default PortfolioSummary;
