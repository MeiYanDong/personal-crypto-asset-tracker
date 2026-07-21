import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes
} from "react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cx } from "./utils";

export type CollapsibleProps = ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Root>;

export const Collapsible = forwardRef<
  ElementRef<typeof CollapsiblePrimitive.Root>,
  CollapsibleProps
>(function Collapsible({ className, ...props }, ref) {
  return (
    <CollapsiblePrimitive.Root
      {...props}
      ref={ref}
      className={cx("ui-collapsible", className)}
      data-collapsible-part="root"
      data-slot="collapsible"
    />
  );
});

export type CollapsibleTriggerProps = ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Trigger>;

export const CollapsibleTrigger = forwardRef<
  ElementRef<typeof CollapsiblePrimitive.Trigger>,
  CollapsibleTriggerProps
>(function CollapsibleTrigger({ className, ...props }, ref) {
  return (
    <CollapsiblePrimitive.Trigger
      {...props}
      ref={ref}
      className={cx("ui-collapsible-trigger", className)}
      data-collapsible-part="trigger"
      data-slot="collapsible-trigger"
    />
  );
});

export type CollapsibleContentProps = ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>;

export const CollapsibleContent = forwardRef<
  ElementRef<typeof CollapsiblePrimitive.Content>,
  CollapsibleContentProps
>(function CollapsibleContent({ className, ...props }, ref) {
  return (
    <CollapsiblePrimitive.Content
      {...props}
      ref={ref}
      className={cx("ui-collapsible-content", className)}
      data-collapsible-part="content"
      data-slot="collapsible-content"
    />
  );
});

export type CollapsibleChevronDirection = "down" | "right";

export type CollapsibleChevronProps = Omit<HTMLAttributes<HTMLSpanElement>, "aria-hidden" | "children"> & {
  direction?: CollapsibleChevronDirection;
  size?: number;
};

export const CollapsibleChevron = forwardRef<HTMLSpanElement, CollapsibleChevronProps>(
  function CollapsibleChevron({ className, direction = "right", size = 16, ...props }, ref) {
    const Icon = direction === "down" ? ChevronDown : ChevronRight;

    return (
      <span
        {...props}
        ref={ref}
        aria-hidden="true"
        className={cx("ui-collapsible-chevron", className)}
        data-direction={direction}
        data-slot="collapsible-chevron"
      >
        <Icon size={size} />
      </span>
    );
  }
);
