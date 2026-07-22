import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Clock3,
  History
} from "lucide-react";
import { forwardRef, useId, type HTMLAttributes, type SVGProps } from "react";
import { Button } from "./ui/Button";
import { CountPair, CountValue, CountWithUnit } from "./ui/CountValue";
import { CurrencyValue, formatCurrency } from "./ui/CurrencyValue";
import { BarSegment, MeterBar } from "./ui/DataBar";
import { LegendItem, LegendList } from "./ui/Legend";
import { percentageOf, PercentageValue } from "./ui/PercentageValue";
import { relativeTimeDetails, TimeValue, useRelativeTimeClock } from "./ui/TimeValue";
import { cx } from "./ui/utils";
import { ValuePlaceholder } from "./ui/ValuePlaceholder";

export type SnapshotHistoryPoint = {
  generatedAt: string;
  walletCount: number;
  totalUsd: number;
  stablecoinUsd: number;
  volatileAssetUsd: number;
  conservativeTotalUsd: number;
  okCount: number;
  staleCount: number;
  errorCount: number;
  skippedCount: number;
};

export type RefreshCounts = {
  ok: number;
  stale: number;
  error: number;
  skipped: number;
  missing: number;
};

export type RefreshHealthProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  scopeLabel?: string;
  generatedAt?: string;
  totalWallets: number;
  counts: RefreshCounts;
  history: SnapshotHistoryPoint[];
  onInspectIssues: () => void;
};

export type SnapshotSparklineProps = Omit<SVGProps<SVGSVGElement>, "children" | "role"> & {
  accessibleDescription?: string;
  accessibleTitle?: string;
  history: SnapshotHistoryPoint[];
};

export const SnapshotSparkline = forwardRef<SVGSVGElement, SnapshotSparklineProps>(function SnapshotSparkline({
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  accessibleDescription,
  accessibleTitle,
  className,
  history,
  ...props
}, ref) {
  const width = 168;
  const height = 44;
  const padding = 4;
  const values = history.map((point) => point.totalUsd).filter(Number.isFinite);
  const state = values.length === 0 ? "empty" : values.length === 1 ? "single" : "trend";
  const rawMinimum = values.length ? Math.min(...values) : 0;
  const rawMaximum = values.length ? Math.max(...values) : 0;
  const latestValue = values.at(-1) ?? 0;
  const rawRange = rawMaximum - rawMinimum;
  const rangeFloor = Math.max(Math.abs(latestValue) * 0.02, 1);
  const range = Math.max(rawRange * 1.2, rangeFloor);
  const midpoint = (rawMinimum + rawMaximum) / 2;
  const minimum = midpoint - range / 2;
  const maximum = midpoint + range / 2;
  const points = values.map((value, index) => {
    const x = values.length === 1
      ? width / 2
      : padding + (index / (values.length - 1)) * (width - padding * 2);
    const y = values.length === 1
      ? height / 2
      : height - padding - ((value - minimum) / (maximum - minimum)) * (height - padding * 2);
    return { x, y };
  });
  const lastPoint = points.at(-1);
  const previousValue = values.at(-2);
  const change = previousValue === undefined ? null : latestValue - previousValue;
  const direction = change === null
    ? "unknown"
    : Math.abs(change) < 0.005
      ? "flat"
      : change > 0
        ? "up"
        : "down";
  const titleId = useId();
  const descriptionId = useId();
  const title = accessibleTitle ?? (state === "empty"
    ? "尚无总资产历史"
    : state === "single"
      ? "总资产历史起点"
      : `最近 ${values.length} 次总资产趋势`);
  const description = accessibleDescription ?? (state === "empty"
    ? "刷新资产后开始记录总资产趋势。"
    : state === "single"
      ? `已记录 1 次资产快照，当前总资产 ${formatCurrency(latestValue)}；再记录 1 次后显示趋势。`
      : `最低 ${formatCurrency(rawMinimum)}，最高 ${formatCurrency(rawMaximum)}，最新 ${formatCurrency(latestValue)}，${
          change !== null && Math.abs(change) >= 0.005
            ? `较上次${change > 0 ? "增加" : "减少"} ${formatCurrency(Math.abs(change))}`
            : "与上次持平"
        }。`);
  const usesInternalLabel = !ariaLabel && !ariaLabelledBy;
  const areaPath = points.length > 1
    ? `M ${points[0].x},${height - padding} L ${points.map((point) => `${point.x},${point.y}`).join(" L ")} L ${points.at(-1)?.x ?? width - padding},${height - padding} Z`
    : null;

  return (
    <svg
      {...props}
      ref={ref}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy ?? (usesInternalLabel ? `${titleId} ${descriptionId}` : undefined)}
      className={cx("history-sparkline", className)}
      data-direction={direction}
      data-point-count={values.length}
      data-slot="snapshot-sparkline"
      data-state={state}
      focusable="false"
      preserveAspectRatio="none"
      role="img"
      viewBox={`0 0 ${width} ${height}`}
    >
      {usesInternalLabel ? <title id={titleId}>{title}</title> : null}
      {usesInternalLabel ? <desc id={descriptionId}>{description}</desc> : null}
      <line
        className="sparkline-guide"
        data-slot="snapshot-sparkline-guide"
        x1={padding}
        x2={width - padding}
        y1={height / 2}
        y2={height / 2}
      />
      {areaPath ? (
        <path className="sparkline-area" d={areaPath} data-slot="snapshot-sparkline-area" />
      ) : null}
      {points.length > 1 ? (
        <polyline
          className="sparkline-line"
          data-slot="snapshot-sparkline-line"
          points={points.map((point) => `${point.x},${point.y}`).join(" ")}
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {lastPoint ? (
        <circle
          className="sparkline-endpoint"
          cx={lastPoint.x}
          cy={lastPoint.y}
          data-slot="snapshot-sparkline-endpoint"
          r="3"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
    </svg>
  );
});

export const RefreshHealth = forwardRef<HTMLElement, RefreshHealthProps>(function RefreshHealth({
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  className,
  scopeLabel = "刷新质量",
  generatedAt,
  totalWallets,
  counts,
  history,
  onInspectIssues,
  ...props
}, ref) {
  const usableCount = counts.ok + counts.stale;
  const issueCount = counts.stale + counts.error + counts.skipped + counts.missing;
  const coverageValue = percentageOf(usableCount, totalWallets);
  const titleId = useId();
  const qualityLegendId = useId();
  const coverageComplete = coverageValue >= 100;
  const relativeNow = useRelativeTimeClock(Boolean(generatedAt));
  const age = relativeTimeDetails(generatedAt, relativeNow);
  const qualityLabel = !generatedAt
    ? "尚未建立"
    : coverageComplete && issueCount === 0
      ? "覆盖完整"
      : usableCount > 0
        ? "部分可用"
        : "需要刷新";
  const qualityState = !generatedAt
    ? "missing"
    : coverageComplete && issueCount === 0
      ? "complete"
      : usableCount > 0
        ? "partial"
        : "unavailable";
  const historyPoints = [...history]
    .filter((point) => Number.isFinite(Date.parse(point.generatedAt)) && Number.isFinite(point.totalUsd))
    .sort((left, right) => Date.parse(left.generatedAt) - Date.parse(right.generatedAt))
    .slice(-30);
  const latest = historyPoints.at(-1);
  const previous = historyPoints.at(-2);
  const change = latest && previous ? latest.totalUsd - previous.totalUsd : null;
  const trendState = historyPoints.length === 0 ? "empty" : historyPoints.length === 1 ? "single" : "trend";
  const trendLabel = trendState === "empty"
    ? "刷新后开始记录"
    : trendState === "single"
      ? "再刷新 1 次生成趋势"
      : change === null || Math.abs(change) < 0.005
        ? "与上次持平"
        : `较上次 ${change > 0 ? "+" : ""}${formatCurrency(change)}`;

  const segments = [
    { key: "ok", label: "正常", value: counts.ok },
    { key: "stale", label: "旧数据", value: counts.stale },
    { key: "error", label: "失败", value: counts.error },
    { key: "skipped", label: "跳过", value: counts.skipped },
    { key: "missing", label: "缺失", value: counts.missing }
  ];

  return (
    <section
      {...props}
      ref={ref}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy ?? (ariaLabel ? undefined : titleId)}
      className={cx("refresh-health", className)}
      data-quality={qualityState}
      data-slot="refresh-health"
    >
      <div className="refresh-health-overview" data-slot="refresh-health-overview">
        <span className="health-kicker" id={ariaLabel || ariaLabelledBy ? undefined : titleId}>
          <Activity size={16} />
          {scopeLabel}
        </span>
        <div className="health-verdict">
          <strong>{qualityLabel}</strong>
          <span className={`data-age ${age.tone}`}>
            <Clock3 size={13} />
            <TimeValue mode="relative" now={relativeNow} value={generatedAt} />
          </span>
        </div>
        <span className="health-caption">
          有效覆盖{" "}
          <CountWithUnit unit="个钱包">
            <CountPair first={usableCount} second={totalWallets} />
          </CountWithUnit>
        </span>
        {issueCount ? (
          <Button className="health-action" variant="quiet" size="xs" onClick={onInspectIssues}>
            <AlertTriangle size={14} />
            查看钱包状态
            <ArrowRight size={14} />
          </Button>
        ) : null}
      </div>

      <div className="refresh-distribution" data-slot="refresh-health-distribution">
        <div className="health-section-heading">
          <span>有效覆盖率</span>
          <strong><PercentageValue maximumFractionDigits={0} value={coverageValue} /></strong>
        </div>
        <MeterBar
          aria-describedby={qualityLegendId}
          className="quality-meter"
          data-slot="refresh-health-meter"
          label="有效覆盖率"
          value={coverageValue}
          valueText={`${totalWallets} 个钱包中 ${usableCount} 个有可用资产数据`}
        >
          {segments.map((segment) => (
            <BarSegment
              className={`quality-segment ${segment.key}`}
              key={segment.key}
              value={percentageOf(segment.value, totalWallets)}
            />
          ))}
        </MeterBar>
        <LegendList
          className="quality-legend"
          density="compact"
          data-slot="refresh-health-legend"
          id={qualityLegendId}
          label="钱包刷新状态分布"
        >
          {segments.map((segment) => (
            <LegendItem
              key={segment.key}
              label={segment.label}
              swatchClassName={segment.key}
              value={<CountValue value={segment.value} />}
            />
          ))}
        </LegendList>
      </div>

      <div className="snapshot-trend" data-slot="refresh-health-trend">
        <div className="health-section-heading">
          <span><History size={15} />总资产历史</span>
          <small>
            <CountWithUnit unit="次">
              <CountPair first={historyPoints.length} second={30} />
            </CountWithUnit>
          </small>
        </div>
        <div className="trend-visual" data-state={trendState}>
          <div>
            <strong>
              {latest ? <CurrencyValue value={latest.totalUsd} /> : <ValuePlaceholder label="暂无资产快照" />}
            </strong>
            <span className={change === null ? "" : change > 0 ? "positive" : change < 0 ? "negative" : ""}>
              {trendLabel}
            </span>
          </div>
          <SnapshotSparkline history={historyPoints} />
        </div>
      </div>
    </section>
  );
});

export default RefreshHealth;
