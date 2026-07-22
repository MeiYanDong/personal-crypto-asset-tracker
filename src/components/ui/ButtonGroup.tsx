import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";

export type ButtonGroupOrientation = "horizontal" | "vertical";

export type ButtonGroupProps = Omit<HTMLAttributes<HTMLDivElement>, "aria-label" | "children" | "role"> & {
  "aria-label": string;
  "data-slot"?: string;
  attached?: boolean;
  children: ReactNode;
  orientation?: ButtonGroupOrientation;
};

export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(function ButtonGroup({
  "aria-label": ariaLabel,
  attached = true,
  children,
  className,
  "data-slot": inheritedSlot,
  orientation = "horizontal",
  ...props
}, ref) {
  return (
    <div
      {...props}
      ref={ref}
      aria-label={ariaLabel}
      className={cx("ui-button-group", className)}
      data-attached={attached}
      data-orientation={orientation}
      data-slot={inheritedSlot ?? "button-group"}
      role="group"
    >
      {children}
    </div>
  );
});
