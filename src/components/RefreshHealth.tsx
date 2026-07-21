import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Clock3,
  History
} from "lucide-react";

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

function Sparkline({ history }: { history: SnapshotHistoryPoint[] }) {
  const width = 168;
  const height = 44;
  const padding = 4;
  const values = history.map((point) => point.totalUsd);
  const minimum = Math.min(...values, 0);
  const maximum = Math.max(...values, 0);
  const range = Math.max(maximum - minimum, 1);
  const points = values.map((value, index) => {
    const x = values.length === 1
      ? width / 2
      : padding + (index / (values.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - minimum) / range) * (height - padding * 2);
    return { x, y };
  });
  const lastPoint = points.at(-1);

  return (
    <svg
      className="history-sparkline"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={history.length > 1 ? `最近 ${history.length} 次总资产变化` : "当前总资产历史起点"}
    >
      <line className="sparkline-baseline" x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} />
      {points.length > 1 ? (
        <polyline
          points={points.map((point) => `${point.x},${point.y}`).join(" ")}
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {lastPoint ? <circle cx={lastPoint.x} cy={lastPoint.y} r="3" vectorEffect="non-scaling-stroke" /> : null}
    </svg>
  );
}

export default function RefreshHealth({
  generatedAt,
  totalWallets,
  counts,
  history,
  onInspectIssues
}: RefreshHealthProps) {
  const usableCount = counts.ok + counts.stale;
  const issueCount = counts.stale + counts.error + counts.skipped + counts.missing;
  const coverage = totalWallets ? Math.round((usableCount / totalWallets) * 100) : 0;
  const age = ageDetails(generatedAt);
  const qualityLabel = !generatedAt
    ? "尚未建立"
    : coverage === 100 && issueCount === 0
      ? "覆盖完整"
      : usableCount > 0
        ? "部分可用"
        : "需要刷新";
  const historyPoints = [...history]
    .filter((point) => Number.isFinite(Date.parse(point.generatedAt)))
    .sort((left, right) => Date.parse(left.generatedAt) - Date.parse(right.generatedAt))
    .slice(-30);
  const latest = historyPoints.at(-1);
  const previous = historyPoints.at(-2);
  const change = latest && previous ? latest.totalUsd - previous.totalUsd : null;

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
          刷新质量
        </span>
        <div className="health-verdict">
          <strong>{qualityLabel}</strong>
          <span className={`data-age ${age.tone}`}><Clock3 size={13} />{age.label}</span>
        </div>
        <span className="health-caption">有效覆盖 {usableCount} / {totalWallets} 个钱包</span>
        {issueCount ? (
          <button className="health-action" type="button" onClick={onInspectIssues}>
            <AlertTriangle size={14} />
            查看钱包状态
            <ArrowRight size={14} />
          </button>
        ) : null}
      </div>

      <div className="refresh-distribution">
        <div className="health-section-heading">
          <span>有效覆盖率</span>
          <strong>{coverage}%</strong>
        </div>
        <div
          className="quality-meter"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={coverage}
          aria-valuetext={`${totalWallets} 个钱包中 ${usableCount} 个有可用资产数据`}
        >
          {segments.map((segment) => (
            <span
              className={`quality-segment ${segment.key}`}
              key={segment.key}
              style={{ width: `${totalWallets ? (segment.value / totalWallets) * 100 : 0}%` }}
            />
          ))}
        </div>
        <div className="quality-legend" aria-label="钱包刷新状态分布">
          {segments.map((segment) => (
            <span key={segment.key}>
              <i className={segment.key} />
              {segment.label} {segment.value}
            </span>
          ))}
        </div>
      </div>

      <div className="snapshot-trend">
        <div className="health-section-heading">
          <span><History size={15} />总资产历史</span>
          <small>{historyPoints.length} / 30 次</small>
        </div>
        <div className="trend-visual">
          <div>
            <strong>{currency(latest?.totalUsd || 0)}</strong>
            <span className={change === null ? "" : change > 0 ? "positive" : change < 0 ? "negative" : ""}>
              {change === null
                ? "建立历史中"
                : Math.abs(change) < 0.005
                  ? "与上次持平"
                  : `较上次 ${change > 0 ? "+" : ""}${currency(change)}`}
            </span>
          </div>
          <Sparkline history={historyPoints} />
        </div>
      </div>
    </section>
  );
}
