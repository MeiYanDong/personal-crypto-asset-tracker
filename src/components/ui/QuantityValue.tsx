import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "./utils";

const wholeQuantityFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 3
});

const fractionalQuantityFormatter = new Intl.NumberFormat("en-US", {
  maximumSignificantDigits: 6
});

const compactQuantityFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 3
});

const exactQuantityFormatter = new Intl.NumberFormat("en-US", {
  maximumSignificantDigits: 15
});

function finiteQuantity(value: number) {
  return Number.isFinite(value) ? value : 0;
}

export function formatQuantity(value: number) {
  const safeValue = finiteQuantity(value);
  const magnitude = Math.abs(safeValue);

  if (magnitude >= 1_000_000) {
    return compactQuantityFormatter.format(safeValue);
  }
  if (magnitude >= 1) {
    return wholeQuantityFormatter.format(safeValue);
  }
  return fractionalQuantityFormatter.format(safeValue);
}

export function formatExactQuantity(value: number) {
  return exactQuantityFormatter.format(finiteQuantity(value));
}

export type QuantityValueProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  "data-slot"?: string;
  value: number;
};

export const QuantityValue = forwardRef<HTMLSpanElement, QuantityValueProps>(function QuantityValue({
  "aria-label": ariaLabel,
  className,
  "data-slot": inheritedSlot,
  title,
  value,
  ...props
}, ref) {
  const displayValue = formatQuantity(value);
  const exactValue = formatExactQuantity(value);
  const isRounded = displayValue !== exactValue;

  return (
    <span
      {...props}
      ref={ref}
      className={cx("ui-quantity-value", className)}
      data-rounded={isRounded || undefined}
      data-slot={inheritedSlot ?? "quantity-value"}
      title={title ?? (isRounded ? `完整数量：${exactValue}` : undefined)}
    >
      <span aria-hidden="true" data-slot="quantity-display">{displayValue}</span>
      <span className="sr-only" data-slot="quantity-exact">
        {ariaLabel ? `${ariaLabel}：${exactValue}` : exactValue}
      </span>
    </span>
  );
});
