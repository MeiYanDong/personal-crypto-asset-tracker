import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { Loader2 } from "lucide-react";
import { cx } from "./utils";

export type SpinnerProps = ComponentPropsWithoutRef<typeof Loader2> & {
  decorative?: boolean;
  label?: string;
};

export const Spinner = forwardRef<ElementRef<typeof Loader2>, SpinnerProps>(function Spinner({
  "aria-label": ariaLabel,
  className,
  decorative = false,
  focusable,
  label = "加载中",
  role,
  ...props
}, ref) {
  return (
    <Loader2
      {...props}
      ref={ref}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : ariaLabel || label}
      className={cx("ui-spinner", "spin", className)}
      data-decorative={decorative || undefined}
      data-slot="spinner"
      data-state="loading"
      focusable={focusable ?? "false"}
      role={decorative ? undefined : role || "status"}
    />
  );
});
