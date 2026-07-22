import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Clock3,
  History
} from "lucide-react";
import { forwardRef, useId, type SVGProps } from "react";
import { Button } from "./ui/Button";
import { BarSegment, MeterBar } from "./ui/DataBar";
import { LegendItem, LegendList } from "./ui/Legend";
import { cx } from "./ui/utils";

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

type RefreshCounts = {
  ok: number;
  stale: number;
  error: number;
  skipped: number;
  missing: number;
};

type RefreshHealthProps = {
  scopeLabel?: string;
  generatedAt?: string;
  totalWallets: number;
  counts: RefreshCounts;
  history: SnapshotHistoryPoint[];
  onInspectIssues: () => void;
};

function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2
  }).format(value || 0);
}

function ageDetails(value?: string) {
  if (!value || !Number.isFinite(Date.parse(value))) {
    return { label: "尚未刷新", tone: "stale" };
  }
  const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 60_000));
  if (minutes < 2) {
    return { label: "刚刚刷新", tone: "fresh" };
  }
  if (minutes < 60) {
    return { label: `${minutes} 分钟前`, tone: "fresh" };
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return { label: `${hours} 小时前`, tone: hours < 8 ? "fresh" : "aging" };
  }
  const days = Math.floor(hours / 24);
  return { label: `${days} 天前`, tone: days < 3 ? "aging" : "stale" };
}

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
      ? `已记录 1 次资产快照，当前总资产 ${currency(latestValue)}；再记录 1 次后显示趋势。`
      : `最低 ${currency(rawMinimum)}，最高 ${currency(rawMaximum)}，最新 ${currency(latestValue)}，${
          change !== null && Math.abs(change) >= 0.005
            ? `较上次${change > 0 ? "增加" : "减少"} ${currency(Math.abs(change))}`
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

export default function RefreshHealth({
  scopeLabel = "刷新质量",
  generatedAt,
  totalWallets,
  counts,
  history,
  onInspectIssues
}: RefreshHealthProps) {
  const usableCount = counts.ok + counts.stale;
  const issueCount = counts.stale + counts.error + counts.skipped + counts.missing;
  const coverageValue = totalWallets ? (usableCount / totalWallets) * 100 : 0;
  const qualityLegendId = useId();
  const coverage = Math.round(coverageValue);
  const age = ageDetails(generatedAt);
  const qualityLabel = !generatedAt
    ? "尚未建立"
    : coverage === 100 && issueCount === 0
      ? "覆盖完整"
      : usableCount > 0
        ? "部分可用"
        : "需要刷新";
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
        : `较上次 ${change > 0 ? "+" : ""}${currency(change)}`;

  const segments = [
    { key: "ok", label: "正常", value: counts.ok },
    { key: "stale", label: "旧数据", value: counts.stale },
    { key: "error", label: "失败", value: counts.error },
    { key: "skipped", label: "跳过", value: counts.skipped },
    { key: "missing", label: "缺失", value: counts.missing }
  ];

  return (
    <section className="refresh-health" aria-labelledby="refresh-health-title">
      <div className="refresh-health-overview">
        <span className="health-kicker" id="refresh-health-title">
          <Activity size={16} />
          {scopeLabel}
        </span>
        <div className="health-verdict">
          <strong>{qualityLabel}</strong>
          <span className={`data-age ${age.tone}`}><Clock3 size={13} />{age.label}</span>
        </div>
        <span className="health-caption">有效覆盖 {usableCount} / {totalWallets} 个钱包</span>
        {issueCount ? (
          <Button className="health-action" variant="quiet" size="xs" onClick={onInspectIssues}>
            <AlertTriangle size={14} />
            查看钱包状态
            <ArrowRight size={14} />
          </Button>
        ) : null}
      </div>

      <div className="refresh-distribution">
        <div className="health-section-heading">
          <span>有效覆盖率</span>
          <strong>{coverage}%</strong>
        </div>
        <MeterBar
          aria-describedby={qualityLegendId}
          className="quality-meter"
          label="有效覆盖率"
          value={coverageValue}
          valueText={`${totalWallets} 个钱包中 ${usableCount} 个有可用资产数据`}
        >
          {segments.map((segment) => (
            <BarSegment
              className={`quality-segment ${segment.key}`}
              key={segment.key}
              value={totalWallets ? (segment.value / totalWallets) * 100 : 0}
            />
          ))}
        </MeterBar>
        <LegendList
          className="quality-legend"
          density="compact"
          id={qualityLegendId}
          label="钱包刷新状态分布"
        >
          {segments.map((segment) => (
            <LegendItem
              key={segment.key}
              label={segment.label}
              swatchClassName={segment.key}
              value={segment.value}
            />
          ))}
        </LegendList>
      </div>

      <div className="snapshot-trend">
        <div className="health-section-heading">
          <span><History size={15} />总资产历史</span>
          <small>{historyPoints.length} / 30 次</small>
        </div>
        <div className="trend-visual" data-state={trendState}>
          <div>
            <strong>{latest ? currency(latest.totalUsd) : "--"}</strong>
            <span className={change === null ? "" : change > 0 ? "positive" : change < 0 ? "negative" : ""}>
              {trendLabel}
            </span>
          </div>
          <SnapshotSparkline history={historyPoints} />
        </div>
      </div>
    </section>
  );
}
