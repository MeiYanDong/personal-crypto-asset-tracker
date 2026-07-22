import {
  forwardRef,
  type DataHTMLAttributes,
  type HTMLAttributes,
  type ReactNode
} from "react";
import { cx } from "./utils";

const countFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
  useGrouping: true
});

export function normalizeCount(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

export function formatCount(value: number) {
  return countFormatter.format(normalizeCount(value));
}

export type CountValueProps = Omit<DataHTMLAttributes<HTMLDataElement>, "children" | "value"> & {
  "data-slot"?: string;
  value: number;
};

export const CountValue = forwardRef<HTMLDataElement, CountValueProps>(function CountValue({
  className,
  "data-slot": inheritedSlot,
  value,
  ...props
}, ref) {
  const safeValue = normalizeCount(value);

  return (
    <data
      {...props}
      ref={ref}
      className={cx("ui-count-value", className)}
      data-slot={inheritedSlot ?? "count-value"}
      data-state={safeValue === 0 ? "zero" : "positive"}
      value={safeValue}
    >
      {countFormatter.format(safeValue)}
    </data>
  );
});

export type CountPairProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  "data-slot"?: string;
  first: number;
  second: number;
  separator?: ReactNode;
};

export const CountPair = forwardRef<HTMLSpanElement, CountPairProps>(function CountPair({
  className,
  "data-slot": inheritedSlot,
  first,
  second,
  separator = "/",
  ...props
}, ref) {
  const safeFirst = normalizeCount(first);
  const safeSecond = normalizeCount(second);

  return (
    <span
      {...props}
      ref={ref}
      className={cx("ui-count-pair", className)}
      data-first={safeFirst}
      data-second={safeSecond}
      data-slot={inheritedSlot ?? "count-pair"}
    >
      <CountValue data-slot="count-pair-first" value={safeFirst} />
      <span className="ui-count-pair-separator" data-slot="count-pair-separator">{separator}</span>
      <CountValue data-slot="count-pair-second" value={safeSecond} />
    </span>
  );
});

export type CountWithUnitProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  "data-slot"?: string;
  children: ReactNode;
  unit: ReactNode;
};

export const CountWithUnit = forwardRef<HTMLSpanElement, CountWithUnitProps>(function CountWithUnit({
  children,
  className,
  "data-slot": inheritedSlot,
  unit,
  ...props
}, ref) {
  return (
    <span
      {...props}
      ref={ref}
      className={cx("ui-count-with-unit", className)}
      data-slot={inheritedSlot ?? "count-with-unit"}
    >
      <span data-slot="count-with-unit-value">{children}</span>
      <span data-slot="count-with-unit-label">{unit}</span>
    </span>
  );
});
