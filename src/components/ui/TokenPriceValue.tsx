import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "./utils";

const highPriceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const standardPriceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 4
});

const fractionalPriceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 6
});

const microPriceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumSignificantDigits: 1,
  maximumSignificantDigits: 6
});

const exactPriceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 18
});

const minimumDisplayPrice = 0.0000000001;

function finiteTokenPrice(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function displayFormatter(value: number) {
  if (value >= 1_000) {
    return highPriceFormatter;
  }
  if (value >= 1) {
    return standardPriceFormatter;
  }
  if (value >= 0.01 || value === 0) {
    return fractionalPriceFormatter;
  }
  return microPriceFormatter;
}

function tokenPriceDetails(value: number) {
  const safeValue = finiteTokenPrice(value);
  const threshold = safeValue > 0 && safeValue < minimumDisplayPrice;
  const displayedValue = threshold ? minimumDisplayPrice : safeValue;
  const formatter = displayFormatter(displayedValue);

  return {
    displayValue: `${threshold ? "<" : ""}${formatter.format(displayedValue)}`,
    displayedValue,
    formatter,
    safeValue,
    threshold
  };
}

export function formatTokenPrice(value: number) {
  return tokenPriceDetails(value).displayValue;
}

export function formatExactTokenPrice(value: number) {
  return exactPriceFormatter.format(finiteTokenPrice(value));
}

export type TokenPriceValueProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  "data-slot"?: string;
  value: number;
};

export const TokenPriceValue = forwardRef<HTMLSpanElement, TokenPriceValueProps>(
  function TokenPriceValue({
    "aria-label": ariaLabel,
    className,
    "data-slot": inheritedSlot,
    title,
    value,
    ...props
  }, ref) {
    const details = tokenPriceDetails(value);
    const exactValue = formatExactTokenPrice(details.safeValue);
    const isRounded = details.displayValue !== exactValue;

    return (
      <span
        {...props}
        ref={ref}
        className={cx("ui-currency-value", "ui-token-price-value", className)}
        data-rounded={isRounded || undefined}
        data-slot={inheritedSlot ?? "token-price-value"}
        data-threshold={details.threshold || undefined}
        title={title ?? (isRounded ? `完整单价：${exactValue}` : undefined)}
      >
        <span aria-hidden="true" data-slot="token-price-display">
          {details.threshold ? (
            <span className="ui-currency-value-part" data-part="threshold">&lt;</span>
          ) : null}
          {details.formatter.formatToParts(details.displayedValue).map((part, index) => (
            <span
              className="ui-currency-value-part"
              data-part={part.type}
              key={`${part.type}-${index}`}
            >
              {part.value}
            </span>
          ))}
        </span>
        <span className="sr-only" data-slot="token-price-exact">
          {ariaLabel ? `${ariaLabel}：${exactValue}` : exactValue}
        </span>
      </span>
    );
  }
);
