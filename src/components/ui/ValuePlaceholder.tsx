import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "./utils";

export type ValuePlaceholderProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  "data-slot"?: string;
  label: string;
  symbol?: string;
};

export const ValuePlaceholder = forwardRef<HTMLSpanElement, ValuePlaceholderProps>(function ValuePlaceholder({
  className,
  "data-slot": inheritedSlot,
  label,
  symbol = "—",
  title,
  ...props
}, ref) {
  return (
    <span
      {...props}
      ref={ref}
      className={cx("ui-value-placeholder", className)}
      data-slot={inheritedSlot ?? "value-placeholder"}
      title={title ?? label}
    >
      <span aria-hidden="true" data-slot="value-placeholder-symbol">{symbol}</span>
      <span className="sr-only" data-slot="value-placeholder-label">{label}</span>
    </span>
  );
});
