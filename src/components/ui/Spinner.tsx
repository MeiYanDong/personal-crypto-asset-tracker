import type { ComponentProps } from "react";
import { Loader2 } from "lucide-react";
import { cx } from "./utils";

type SpinnerProps = ComponentProps<typeof Loader2> & {
  decorative?: boolean;
  label?: string;
};

export function Spinner({
  className,
  decorative = false,
  label = "加载中",
  ...props
}: SpinnerProps) {
  return (
    <Loader2
      {...props}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : label}
      className={cx("ui-spinner", "spin", className)}
      role={decorative ? undefined : "status"}
    />
  );
}
