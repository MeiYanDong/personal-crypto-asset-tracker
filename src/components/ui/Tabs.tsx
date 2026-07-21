import {
  Children,
  forwardRef,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ElementRef
} from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cx } from "./utils";

export const Tabs = forwardRef<
  ElementRef<typeof TabsPrimitive.Root>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>(function Tabs({ className, ...props }, ref) {
  return <TabsPrimitive.Root ref={ref} className={cx("ui-tabs-root", className)} {...props} />;
});

type TabsListStyle = CSSProperties & {
  "--ui-tabs-count": number;
};

export const TabsList = forwardRef<
  ElementRef<typeof TabsPrimitive.List>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(function TabsList({ children, className, style, ...props }, ref) {
  const listStyle = {
    ...style,
    "--ui-tabs-count": Math.max(1, Children.count(children))
  } as TabsListStyle;

  return (
    <TabsPrimitive.List
      ref={ref}
      className={cx("ui-tabs-list", className)}
      style={listStyle}
      {...props}
    >
      {children}
    </TabsPrimitive.List>
  );
});

export const TabsTrigger = forwardRef<
  ElementRef<typeof TabsPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(function TabsTrigger({ className, ...props }, ref) {
  return <TabsPrimitive.Trigger ref={ref} className={cx("ui-tabs-trigger", className)} {...props} />;
});

export const TabsContent = forwardRef<
  ElementRef<typeof TabsPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(function TabsContent({ className, ...props }, ref) {
  return <TabsPrimitive.Content ref={ref} className={cx("ui-tabs-content", className)} {...props} />;
});
