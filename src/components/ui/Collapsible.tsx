import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { cx } from "./utils";

export const Collapsible = forwardRef<
  ElementRef<typeof CollapsiblePrimitive.Root>,
  ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Root>
>(function Collapsible({ className, ...props }, ref) {
  return (
    <CollapsiblePrimitive.Root
      ref={ref}
      className={cx("ui-collapsible", className)}
      {...props}
    />
  );
});

export const CollapsibleTrigger = forwardRef<
  ElementRef<typeof CollapsiblePrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Trigger>
>(function CollapsibleTrigger({ className, ...props }, ref) {
  return (
    <CollapsiblePrimitive.Trigger
      ref={ref}
      className={cx("ui-collapsible-trigger", className)}
      {...props}
    />
  );
});

export const CollapsibleContent = forwardRef<
  ElementRef<typeof CollapsiblePrimitive.Content>,
  ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>
>(function CollapsibleContent({ className, ...props }, ref) {
  return (
    <CollapsiblePrimitive.Content
      ref={ref}
      className={cx("ui-collapsible-content", className)}
      {...props}
    />
  );
});
