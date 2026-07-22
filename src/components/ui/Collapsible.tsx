import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes
} from "react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { IconButton, type IconButtonProps } from "./Button";
import { cx } from "./utils";

type CollapsibleDataSlot = {
  "data-slot"?: string;
};

export type CollapsibleProps = ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Root> & CollapsibleDataSlot;

export const Collapsible = forwardRef<
  ElementRef<typeof CollapsiblePrimitive.Root>,
  CollapsibleProps
>(function Collapsible({ className, "data-slot": inheritedSlot, ...props }, ref) {
  return (
    <CollapsiblePrimitive.Root
      {...props}
      ref={ref}
      className={cx("ui-collapsible", className)}
      data-collapsible-part="root"
      data-slot={inheritedSlot ?? "collapsible"}
    />
  );
});

export type CollapsibleTriggerProps = ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Trigger> & CollapsibleDataSlot;

export const CollapsibleTrigger = forwardRef<
  ElementRef<typeof CollapsiblePrimitive.Trigger>,
  CollapsibleTriggerProps
>(function CollapsibleTrigger({ className, "data-slot": inheritedSlot, ...props }, ref) {
  return (
    <CollapsiblePrimitive.Trigger
      {...props}
      ref={ref}
      className={cx("ui-collapsible-trigger", className)}
      data-collapsible-part="trigger"
      data-slot={inheritedSlot ?? "collapsible-trigger"}
    />
  );
});

export type CollapsibleContentProps = ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content> & CollapsibleDataSlot;

export const CollapsibleContent = forwardRef<
  ElementRef<typeof CollapsiblePrimitive.Content>,
  CollapsibleContentProps
>(function CollapsibleContent({ className, "data-slot": inheritedSlot, ...props }, ref) {
  return (
    <CollapsiblePrimitive.Content
      {...props}
      ref={ref}
      className={cx("ui-collapsible-content", className)}
      data-collapsible-part="content"
      data-slot={inheritedSlot ?? "collapsible-content"}
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

export type DisclosureIconButtonProps = Omit<
  IconButtonProps,
  "aria-controls" | "aria-expanded" | "children" | "label"
> & {
  collapsedLabel: string;
  controls: string;
  direction?: CollapsibleChevronDirection;
  expanded: boolean;
  expandedLabel: string;
};

export const DisclosureIconButton = forwardRef<HTMLButtonElement, DisclosureIconButtonProps>(
  function DisclosureIconButton({
    className,
    collapsedLabel,
    controls,
    direction = "right",
    expanded,
    expandedLabel,
    "data-slot": inheritedSlot,
    ...props
  }, ref) {
    return (
      <IconButton
        {...props}
        ref={ref}
        aria-controls={controls}
        aria-expanded={expanded}
        className={cx("ui-disclosure-icon-button", className)}
        data-slot={inheritedSlot ?? "disclosure-icon-button"}
        data-state={expanded ? "open" : "closed"}
        label={expanded ? expandedLabel : collapsedLabel}
      >
        <CollapsibleChevron direction={direction} />
      </IconButton>
    );
  }
);
