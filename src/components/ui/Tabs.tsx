import {
  Children,
  forwardRef,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ElementRef,
  type ReactNode
} from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cx } from "./utils";

export type TabsProps = ComponentPropsWithoutRef<typeof TabsPrimitive.Root>;

export const Tabs = forwardRef<
  ElementRef<typeof TabsPrimitive.Root>,
  TabsProps
>(function Tabs({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Root
      {...props}
      ref={ref}
      className={cx("ui-tabs-root", className)}
      data-slot="tabs"
    />
  );
});

type TabsListStyle = CSSProperties & {
  "--ui-tabs-count": number;
};

export type TabsListLayout = "equal" | "content" | "adaptive";

export type TabsListProps = ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
  layout?: TabsListLayout;
};

export const TabsList = forwardRef<
  ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(function TabsList({ children, className, layout = "equal", style, ...props }, ref) {
  const listStyle = {
    ...style,
    "--ui-tabs-count": Math.max(1, Children.count(children))
  } as TabsListStyle;

  return (
    <TabsPrimitive.List
      {...props}
      ref={ref}
      className={cx("ui-tabs-list", className)}
      data-layout={layout}
      data-slot="tabs-list"
      style={listStyle}
    >
      {children}
    </TabsPrimitive.List>
  );
});

export type TabsTriggerProps = ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
  icon?: ReactNode;
};

export const TabsTrigger = forwardRef<
  ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(function TabsTrigger({ children, className, icon, ...props }, ref) {
  return (
    <TabsPrimitive.Trigger
      {...props}
      ref={ref}
      className={cx("ui-tabs-trigger", className)}
      data-has-icon={Boolean(icon) || undefined}
      data-slot="tabs-trigger"
    >
      {icon ? (
        <span aria-hidden="true" data-slot="tabs-trigger-icon">
          {icon}
        </span>
      ) : null}
      <span data-slot="tabs-trigger-label">{children}</span>
    </TabsPrimitive.Trigger>
  );
});

export type TabsContentProps = ComponentPropsWithoutRef<typeof TabsPrimitive.Content>;

export const TabsContent = forwardRef<
  ElementRef<typeof TabsPrimitive.Content>,
  TabsContentProps
>(function TabsContent({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Content
      {...props}
      ref={ref}
      className={cx("ui-tabs-content", className)}
      data-slot="tabs-content"
    />
  );
});
