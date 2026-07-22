import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "./utils";

const wholeDollarFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

const centFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function finiteCurrency(value: number) {
  if (!Number.isFinite(value) || Object.is(value, -0)) {
    return 0;
  }
  return value;
}

function displayFormatter(value: number) {
  return Math.abs(value) >= 1000 ? wholeDollarFormatter : centFormatter;
}

export function formatCurrency(value: number) {
  const safeValue = finiteCurrency(value);
  return displayFormatter(safeValue).format(safeValue);
}

export function formatExactCurrency(value: number) {
  return centFormatter.format(finiteCurrency(value));
}

export type CurrencyValueProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  "data-slot"?: string;
  value: number;
};

export const CurrencyValue = forwardRef<HTMLSpanElement, CurrencyValueProps>(function CurrencyValue({
  "aria-label": ariaLabel,
  className,
  "data-slot": inheritedSlot,
  title,
  value,
  ...props
}, ref) {
  const safeValue = finiteCurrency(value);
  const formatter = displayFormatter(safeValue);
  const displayValue = formatter.format(safeValue);
  const exactValue = formatExactCurrency(safeValue);
  const isRounded = displayValue !== exactValue;
  const sign = safeValue === 0 ? "zero" : safeValue > 0 ? "positive" : "negative";

  return (
    <span
      {...props}
      ref={ref}
      className={cx("ui-currency-value", className)}
      data-rounded={isRounded || undefined}
      data-sign={sign}
      data-slot={inheritedSlot ?? "currency-value"}
      title={title ?? (isRounded ? `完整金额：${exactValue}` : undefined)}
    >
      <span aria-hidden="true" data-slot="currency-display">
        {formatter.formatToParts(safeValue).map((part, index) => (
          <span
            className="ui-currency-value-part"
            data-part={part.type}
            key={`${part.type}-${index}`}
          >
            {part.value}
          </span>
        ))}
      </span>
      <span className="sr-only" data-slot="currency-exact">
        {ariaLabel ? `${ariaLabel}：${exactValue}` : exactValue}
      </span>
    </span>
  );
});
