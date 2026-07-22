import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "./utils";

export type SkeletonProps = Omit<HTMLAttributes<HTMLDivElement>, "aria-hidden" | "children"> & {
  "data-slot"?: string;
};

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton({
  className,
  "data-slot": inheritedSlot,
  ...props
}, ref) {
  return (
    <div
      {...props}
      ref={ref}
      aria-hidden="true"
      className={cx("ui-skeleton", className)}
      data-slot={inheritedSlot ?? "skeleton"}
      data-state="loading"
    />
  );
});
