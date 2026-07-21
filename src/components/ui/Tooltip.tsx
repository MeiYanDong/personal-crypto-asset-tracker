import { forwardRef, type ComponentPropsWithoutRef, type ComponentRef, type ReactElement, type ReactNode } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cx } from "./utils";

export type TooltipProviderProps = ComponentPropsWithoutRef<typeof TooltipPrimitive.Provider>;

export function TooltipProvider({
  children,
  delayDuration = 450,
  skipDelayDuration = 120,
  ...props
}: TooltipProviderProps) {
  return (
    <TooltipPrimitive.Provider
      delayDuration={delayDuration}
      skipDelayDuration={skipDelayDuration}
      {...props}
    >
      {children}
    </TooltipPrimitive.Provider>
  );
}

type TooltipContentProps = ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>;

export type TooltipProps = Omit<
  ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>,
  "children"
> & {
  align?: TooltipContentProps["align"];
  children: ReactElement;
  className?: string;
  collisionPadding?: TooltipContentProps["collisionPadding"];
  content: ReactNode;
  side?: TooltipContentProps["side"];
  sideOffset?: number;
};

export const Tooltip = forwardRef<ComponentRef<typeof TooltipPrimitive.Content>, TooltipProps>(function Tooltip({
  align = "center",
  children,
  className,
  collisionPadding = 8,
  content,
  side = "top",
  sideOffset = 7,
  ...rootProps
}, ref) {
  return (
    <TooltipPrimitive.Root {...rootProps}>
      <TooltipPrimitive.Trigger asChild data-slot="tooltip-trigger">
        {children}
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          ref={ref}
          align={align}
          className={cx("ui-tooltip-content", className)}
          collisionPadding={collisionPadding}
          data-slot="tooltip-content"
          side={side}
          sideOffset={sideOffset}
        >
          {content}
          <TooltipPrimitive.Arrow
            className="ui-tooltip-arrow"
            data-slot="tooltip-arrow"
            height={5}
            width={9}
          />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
});
