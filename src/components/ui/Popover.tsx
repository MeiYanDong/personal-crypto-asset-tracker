import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef
} from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cx } from "./utils";

type PopoverDataSlot = {
  "data-slot"?: string;
};

export const Popover = PopoverPrimitive.Root;

export type PopoverTriggerProps =
  ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger> &
  PopoverDataSlot;

export const PopoverTrigger = forwardRef<
  ElementRef<typeof PopoverPrimitive.Trigger>,
  PopoverTriggerProps
>(function PopoverTrigger({ "data-slot": inheritedSlot, ...props }, ref) {
  return (
    <PopoverPrimitive.Trigger
      {...props}
      ref={ref}
      data-slot={inheritedSlot ?? "popover-trigger"}
    />
  );
});

export type PopoverCloseProps =
  ComponentPropsWithoutRef<typeof PopoverPrimitive.Close> &
  PopoverDataSlot;

export const PopoverClose = forwardRef<
  ElementRef<typeof PopoverPrimitive.Close>,
  PopoverCloseProps
>(function PopoverClose({ "data-slot": inheritedSlot, ...props }, ref) {
  return (
    <PopoverPrimitive.Close
      {...props}
      ref={ref}
      data-slot={inheritedSlot ?? "popover-close"}
    />
  );
});

export type PopoverContentProps =
  ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> &
  PopoverDataSlot & {
    portalContainer?: HTMLElement | null;
  };

export const PopoverContent = forwardRef<
  ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(function PopoverContent({
  align = "center",
  children,
  className,
  collisionPadding = 12,
  portalContainer,
  sideOffset = 8,
  "data-slot": inheritedSlot,
  ...props
}, ref) {
  return (
    <PopoverPrimitive.Portal container={portalContainer ?? undefined}>
      <PopoverPrimitive.Content
        {...props}
        ref={ref}
        align={align}
        className={cx("ui-popover-content", className)}
        collisionPadding={collisionPadding}
        data-slot={inheritedSlot ?? "popover-content"}
        sideOffset={sideOffset}
      >
        {children}
        <PopoverPrimitive.Arrow
          className="ui-popover-arrow"
          data-slot="popover-arrow"
          height={5}
          width={10}
        />
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
});
