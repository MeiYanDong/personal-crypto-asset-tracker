import {
  forwardRef,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode
} from "react";
import { cx } from "./utils";

function clamp(value: number, minimum: number, maximum: number) {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(maximum, Math.max(minimum, value));
}

export type MeterBarProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "aria-label" | "aria-valuemax" | "aria-valuemin" | "aria-valuenow" | "aria-valuetext" | "role"
> & {
  children: ReactNode;
  label: string;
  max?: number;
  min?: number;
  value: number;
  valueText?: string;
};

export const MeterBar = forwardRef<HTMLDivElement, MeterBarProps>(function MeterBar({
  children,
  className,
  label,
  max = 100,
  min = 0,
  value,
  valueText,
  ...props
}, ref) {
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) && max > safeMin ? max : safeMin + 100;
  const safeValue = clamp(value, safeMin, safeMax);

  return (
    <div
      {...props}
      ref={ref}
      aria-label={label}
      aria-valuemax={safeMax}
      aria-valuemin={safeMin}
      aria-valuenow={safeValue}
      aria-valuetext={valueText}
      className={cx("ui-data-bar", className)}
      data-empty={safeValue === safeMin || undefined}
      data-kind="meter"
      data-max={safeMax}
      data-min={safeMin}
      data-slot="data-bar"
      data-value={safeValue}
      role="meter"
    >
      {children}
    </div>
  );
});

export type DistributionBarProps = Omit<HTMLAttributes<HTMLDivElement>, "aria-label" | "role"> & {
  children: ReactNode;
  label: string;
};

export const DistributionBar = forwardRef<HTMLDivElement, DistributionBarProps>(function DistributionBar({
  children,
  className,
  label,
  ...props
}, ref) {
  return (
    <div
      {...props}
      ref={ref}
      aria-label={label}
      className={cx("ui-data-bar", className)}
      data-kind="distribution"
      data-slot="data-bar"
      role="img"
    >
      {children}
    </div>
  );
});

type BarSegmentStyle = CSSProperties & {
  "--ui-data-bar-value": string;
};

export type BarSegmentProps = Omit<HTMLAttributes<HTMLSpanElement>, "aria-hidden" | "children"> & {
  minimumVisible?: boolean;
  value: number;
};

export const BarSegment = forwardRef<HTMLSpanElement, BarSegmentProps>(function BarSegment({
  className,
  minimumVisible = false,
  style,
  value,
  ...props
}, ref) {
  const safeValue = clamp(value, 0, 100);
  const segmentStyle = {
    ...style,
    "--ui-data-bar-value": `${safeValue}%`
  } as BarSegmentStyle;

  return (
    <span
      {...props}
      ref={ref}
      aria-hidden="true"
      className={cx("ui-data-bar-segment", className)}
      data-empty={safeValue === 0 || undefined}
      data-minimum-visible={minimumVisible || undefined}
      data-slot="data-bar-segment"
      data-value={safeValue}
      style={segmentStyle}
    />
  );
});
