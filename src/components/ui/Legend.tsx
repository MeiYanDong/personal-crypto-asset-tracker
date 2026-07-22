import { forwardRef, type HTMLAttributes, type LiHTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";

export type LegendDensity = "default" | "compact";

export type LegendListProps = Omit<HTMLAttributes<HTMLUListElement>, "aria-label"> & {
  "data-slot"?: string;
  density?: LegendDensity;
  label: string;
};

export const LegendList = forwardRef<HTMLUListElement, LegendListProps>(function LegendList({
  className,
  "data-slot": inheritedSlot,
  density = "default",
  label,
  ...props
}, ref) {
  return (
    <ul
      {...props}
      ref={ref}
      aria-label={label}
      className={cx("ui-legend", density === "compact" && "ui-legend-compact", className)}
      data-density={density}
      data-slot={inheritedSlot ?? "legend-list"}
    />
  );
});

export type LegendSwatchVariant = "solid" | "outline";

export type LegendItemProps = Omit<LiHTMLAttributes<HTMLLIElement>, "children"> & {
  "data-slot"?: string;
  label: ReactNode;
  swatchClassName?: string;
  swatchVariant?: LegendSwatchVariant;
  value?: ReactNode;
};

export const LegendItem = forwardRef<HTMLLIElement, LegendItemProps>(function LegendItem({
  className,
  "data-slot": inheritedSlot,
  label,
  swatchClassName,
  swatchVariant = "solid",
  value,
  ...props
}, ref) {
  return (
    <li
      {...props}
      ref={ref}
      className={cx("ui-legend-item", className)}
      data-has-value={value !== undefined || undefined}
      data-slot={inheritedSlot ?? "legend-item"}
    >
      <span
        aria-hidden="true"
        className={cx("ui-legend-swatch", swatchClassName)}
        data-slot="legend-swatch"
        data-variant={swatchVariant}
      />
      <span className="ui-legend-label" data-slot="legend-label">{label}</span>
      {value !== undefined ? (
        <strong className="ui-legend-value" data-slot="legend-value">{value}</strong>
      ) : null}
    </li>
  );
});
