import type { HTMLAttributes, LiHTMLAttributes, ReactNode } from "react";
import { cx } from "./utils";

type LegendListProps = HTMLAttributes<HTMLUListElement> & {
  density?: "default" | "compact";
  label: string;
};

export function LegendList({
  className,
  density = "default",
  label,
  ...props
}: LegendListProps) {
  return (
    <ul
      aria-label={label}
      className={cx("ui-legend", density === "compact" && "ui-legend-compact", className)}
      {...props}
    />
  );
}

type LegendItemProps = Omit<LiHTMLAttributes<HTMLLIElement>, "children"> & {
  label: ReactNode;
  swatchClassName?: string;
  swatchVariant?: "solid" | "outline";
  value?: ReactNode;
};

export function LegendItem({
  className,
  label,
  swatchClassName,
  swatchVariant = "solid",
  value,
  ...props
}: LegendItemProps) {
  return (
    <li className={cx("ui-legend-item", className)} {...props}>
      <span
        aria-hidden="true"
        className={cx("ui-legend-swatch", swatchClassName)}
        data-variant={swatchVariant}
      />
      <span className="ui-legend-label">{label}</span>
      {value !== undefined ? <strong className="ui-legend-value">{value}</strong> : null}
    </li>
  );
}
