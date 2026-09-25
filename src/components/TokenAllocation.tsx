import { useId } from "react";
import { calculateTokenAllocation, type AllocationToken } from "../../shared/token-allocation";
import { CurrencyValue } from "./ui/CurrencyValue";
import { PercentageValue } from "./ui/PercentageValue";

type TokenAllocationProps = {
  tokens: AllocationToken[];
  defiTotalUsd: number;
};

const radius = 76;
const circumference = 2 * Math.PI * radius;

export default function TokenAllocation({ tokens, defiTotalUsd }: TokenAllocationProps) {
  const headingId = useId();
  const { totalUsd, tokenCount, slices } = calculateTokenAllocation(tokens);
  if (totalUsd <= 0) return null;

  let offset = 0;
  return (
    <section aria-labelledby={headingId} className="token-allocation" data-slot="token-allocation">
      <div className="token-allocation-heading">
        <div>
          <h3 id={headingId}>代币占比</h3>
          <span>现货市值 · {tokenCount} 个币种</span>
        </div>
        {defiTotalUsd > 0 ? (
          <span className="token-allocation-defi">DeFi 另计 <CurrencyValue value={defiTotalUsd} /></span>
        ) : null}
      </div>
      <div className="token-allocation-body">
        <div className="token-allocation-visual">
          <svg
            aria-label={`已覆盖现货资产总值，${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totalUsd)}`}
            className="token-allocation-chart"
            role="img"
            viewBox="0 0 200 200"
          >
            <circle className="token-allocation-track" cx="100" cy="100" r={radius} />
            {slices.map((slice, index) => {
              const dashOffset = offset;
              offset += slice.share * circumference;
              return (
                <circle
                  className="token-allocation-arc"
                  cx="100"
                  cy="100"
                  key={slice.symbol}
                  r={radius}
                  style={{
                    stroke: `var(--token-color-${Math.min(index + 1, 6)})`,
                    strokeDasharray: `${slice.share * circumference} ${circumference}`,
                    strokeDashoffset: -dashOffset
                  }}
                  transform="rotate(-90 100 100)"
                >
                  <title>{slice.symbol}: {(slice.share * 100).toFixed(2)}%</title>
                </circle>
              );
            })}
          </svg>
          <div aria-hidden="true" className="token-allocation-center">
            <span>现货总值</span>
            <strong><CurrencyValue value={totalUsd} /></strong>
          </div>
        </div>
        <ol aria-label="代币市值占比" className="token-allocation-legend">
          {slices.map((slice, index) => (
            <li key={slice.symbol}>
              <span aria-hidden="true" className="token-allocation-swatch" style={{ background: `var(--token-color-${Math.min(index + 1, 6)})` }} />
              <strong title={slice.symbol}>{slice.symbol}</strong>
              <CurrencyValue value={slice.totalUsd} />
              <PercentageValue value={slice.share * 100} minimumDisplayValue={0.1} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
