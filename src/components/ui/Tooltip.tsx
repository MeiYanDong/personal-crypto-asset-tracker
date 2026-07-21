import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cx } from "./utils";

type TooltipProviderProps = ComponentPropsWithoutRef<typeof TooltipPrimitive.Provider>;

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

type TooltipProps = {
  align?: ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>["align"];
  children: ReactElement;
  className?: string;
  content: ReactNode;
  side?: ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>["side"];
  sideOffset?: number;
};

export function Tooltip({
  align = "center",
  children,
  className,
  content,
  side = "top",
  sideOffset = 7
}: TooltipProps) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          align={align}
          className={cx("ui-tooltip-content", className)}
          collisionPadding={8}
          side={side}
          sideOffset={sideOffset}
        >
          {content}
          <TooltipPrimitive.Arrow className="ui-tooltip-arrow" height={5} width={9} />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
