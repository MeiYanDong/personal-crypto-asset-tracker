import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "./utils";

const formatterCache = new Map<number, Intl.NumberFormat>();
const exactPercentageFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 9,
  useGrouping: false
});

function fractionDigits(value: number) {
  const [, fraction = ""] = value.toFixed(6).replace(/0+$/, "").split(".");
  return fraction.length;
}

function safeFractionDigits(value?: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(6, Math.max(0, Math.floor(value as number)));
}

function safeMinimumDisplayValue(value: number | undefined, maximumFractionDigits: number) {
  if (!Number.isFinite(value)) return 10 ** -maximumFractionDigits;
  return Math.min(100, Math.max(0, value as number));
}

function percentageFormatter(maximumFractionDigits: number) {
  const cached = formatterCache.get(maximumFractionDigits);
  if (cached) return cached;
  const formatter = new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits,
    useGrouping: false
  });
  formatterCache.set(maximumFractionDigits, formatter);
  return formatter;
}

export function clampPercentage(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export function percentageOf(value: number, total: number) {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) {
    return 0;
  }
  return clampPercentage((value / total) * 100);
}

export type PercentageFormatOptions = {
  maximumFractionDigits?: number;
  minimumDisplayValue?: number;
};

function percentageDetails(value: number, options: PercentageFormatOptions = {}) {
  const safeValue = clampPercentage(value);
  const maximumFractionDigits = safeFractionDigits(options.maximumFractionDigits);
  const minimumDisplayValue = safeMinimumDisplayValue(options.minimumDisplayValue, maximumFractionDigits);
  const threshold = safeValue > 0 && minimumDisplayValue > 0 && safeValue < minimumDisplayValue;
  const displayedValue = threshold ? minimumDisplayValue : safeValue;
  const displayFractionDigits = threshold
    ? Math.max(maximumFractionDigits, fractionDigits(minimumDisplayValue))
    : maximumFractionDigits;
  const formatter = percentageFormatter(displayFractionDigits);
  const formattedValue = formatter.format(displayedValue / 100);

  return {
    displayValue: `${threshold ? "<" : ""}${formattedValue}`,
    formatter,
    maximumFractionDigits,
    minimumDisplayValue,
    safeValue,
    threshold
  };
}

export function formatPercentage(value: number, options: PercentageFormatOptions = {}) {
  return percentageDetails(value, options).displayValue;
}

export function formatExactPercentage(value: number) {
  return exactPercentageFormatter.format(clampPercentage(value) / 100);
}

export type PercentageValueProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> &
  PercentageFormatOptions & {
    "data-slot"?: string;
    value: number;
  };

export const PercentageValue = forwardRef<HTMLSpanElement, PercentageValueProps>(function PercentageValue({
  className,
  "data-slot": inheritedSlot,
  maximumFractionDigits,
  minimumDisplayValue,
  title,
  value,
  ...props
}, ref) {
  const details = percentageDetails(value, { maximumFractionDigits, minimumDisplayValue });
  const exactValue = formatExactPercentage(details.safeValue);
  const isRounded = details.displayValue !== exactValue;

  return (
    <span
      {...props}
      ref={ref}
      className={cx("ui-percentage-value", className)}
      data-precision={details.maximumFractionDigits}
      data-rounded={isRounded || undefined}
      data-sign={details.safeValue === 0 ? "zero" : "positive"}
      data-slot={inheritedSlot ?? "percentage-value"}
      data-threshold={details.threshold || undefined}
      title={title ?? (isRounded ? `完整比例：${exactValue}` : undefined)}
    >
      <span data-slot="percentage-display">
        {details.threshold ? (
          <span className="ui-percentage-value-part" data-part="threshold">&lt;</span>
        ) : null}
        {details.formatter.formatToParts((details.threshold ? details.minimumDisplayValue : details.safeValue) / 100)
          .map((part, index) => (
            <span
              className="ui-percentage-value-part"
              data-part={part.type}
              key={`${part.type}-${index}`}
            >
              {part.value}
            </span>
          ))}
      </span>
    </span>
  );
});
