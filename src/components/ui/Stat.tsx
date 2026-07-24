import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "./utils";

export type StatListProps = HTMLAttributes<HTMLDListElement> & {
  "data-slot"?: string;
};

export const StatList = forwardRef<HTMLDListElement, StatListProps>(function StatList({
  className,
  "data-slot": inheritedSlot,
  ...props
}, ref) {
  return (
    <dl
      {...props}
      ref={ref}
      className={cx("ui-stat-list", className)}
      data-slot={inheritedSlot ?? "stat-list"}
    />
  );
});

export type StatItemProps = HTMLAttributes<HTMLDivElement> & {
  "data-slot"?: string;
};

export const StatItem = forwardRef<HTMLDivElement, StatItemProps>(function StatItem({
  className,
  "data-slot": inheritedSlot,
  ...props
}, ref) {
  return (
    <div
      {...props}
      ref={ref}
      className={cx("ui-stat-item", className)}
      data-slot={inheritedSlot ?? "stat-item"}
    />
  );
});

export type StatLabelProps = HTMLAttributes<HTMLElement> & {
  "data-slot"?: string;
};

export const StatLabel = forwardRef<HTMLElement, StatLabelProps>(function StatLabel({
  className,
  "data-slot": inheritedSlot,
  ...props
}, ref) {
  return (
    <dt
      {...props}
      ref={ref}
      className={cx("ui-stat-label", className)}
      data-slot={inheritedSlot ?? "stat-label"}
    />
  );
});

export type StatContentProps = HTMLAttributes<HTMLElement> & {
  "data-slot"?: string;
};

export const StatContent = forwardRef<HTMLElement, StatContentProps>(function StatContent({
  className,
  "data-slot": inheritedSlot,
  ...props
}, ref) {
  return (
    <dd
      {...props}
      ref={ref}
      className={cx("ui-stat-content", className)}
      data-slot={inheritedSlot ?? "stat-content"}
    />
  );
});

export type StatValueProps = HTMLAttributes<HTMLSpanElement> & {
  "data-slot"?: string;
};

export const StatValue = forwardRef<HTMLSpanElement, StatValueProps>(function StatValue({
  className,
  "data-slot": inheritedSlot,
  ...props
}, ref) {
  return (
    <span
      {...props}
      ref={ref}
      className={cx("ui-stat-value", className)}
      data-slot={inheritedSlot ?? "stat-value"}
    />
  );
});

export type StatDescriptionProps = HTMLAttributes<HTMLSpanElement> & {
  "data-slot"?: string;
};

export const StatDescription = forwardRef<HTMLSpanElement, StatDescriptionProps>(
  function StatDescription({
    className,
    "data-slot": inheritedSlot,
    ...props
  }, ref) {
    return (
      <span
        {...props}
        ref={ref}
        className={cx("ui-stat-description", className)}
        data-slot={inheritedSlot ?? "stat-description"}
      />
    );
  }
);
