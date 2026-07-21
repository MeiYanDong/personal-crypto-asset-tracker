import {
  CircleDollarSign,
  Clock3,
  Coins,
  Network,
  ShieldCheck,
  WalletCards
} from "lucide-react";

type PortfolioSummaryProps = {
  scopeLabel: string;
  totalUsd: number;
  conservativeTotalUsd: number;
  stablecoinUsd: number;
  volatileAssetUsd: number;
  walletCount: number;
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
  if (total <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, (value / total) * 100));
}

export function AssetShareBar({ value, total }: { value: number; total: number }) {
  const share = percentage(value, total);
  return (
    <div className="asset-share" aria-label={`占总资产 ${share.toFixed(1)}%`}>
      <span className="asset-share-track" aria-hidden="true">
        <span style={{ width: `${share}%` }} />
      </span>
      <span>{share < 0.1 && share > 0 ? "<0.1" : share.toFixed(1)}%</span>
    </div>
  );
}

export default function PortfolioSummary({
  scopeLabel,
  totalUsd,
  conservativeTotalUsd,
  stablecoinUsd,
  volatileAssetUsd,
  walletCount,
  addressCount,
  tokenCount,
  activeChainCount,
  scannedChainCount,
  updatedAtLabel
}: PortfolioSummaryProps) {
  const stableShare = percentage(stablecoinUsd, totalUsd);
  const volatileShare = percentage(volatileAssetUsd, totalUsd);
  const valuationBufferUsd = Math.max(0, totalUsd - conservativeTotalUsd);

  return (
    <section className="portfolio-summary" aria-label="资产摘要">
      <div className="portfolio-total-block">
        <div className="summary-kicker">
          <CircleDollarSign size={16} />
          <span>{scopeLabel}</span>
        </div>
        <strong className="portfolio-total-value">{currency(totalUsd)}</strong>
        <span className="summary-meta">
          <Clock3 size={13} />
          最后刷新 {updatedAtLabel}
        </span>
      </div>

      <div className="portfolio-risk-block">
        <div className="risk-heading">
          <span>
            <ShieldCheck size={16} />
            保守估值
          </span>
          <strong>{currency(conservativeTotalUsd)}</strong>
        </div>

        <div className="allocation-track" aria-label="资产构成">
          <span className="stable-allocation" style={{ width: `${stableShare}%` }} />
          <span className="volatile-allocation" style={{ width: `${volatileShare}%` }} />
        </div>

        <div className="allocation-legend">
          <span><i className="stable" />稳定币 {currency(stablecoinUsd)}</span>
          <span><i className="volatile" />波动资产 {currency(volatileAssetUsd)}</span>
          <span><i className="buffer" />折价缓冲 {currency(valuationBufferUsd)}</span>
        </div>
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
