import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ReactNode
} from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Spinner } from "./Spinner";
import { cx } from "./utils";

export const DropdownMenu = DropdownMenuPrimitive.Root;

export const DropdownMenuTrigger = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger>
>(function DropdownMenuTrigger({ ...props }, ref) {
  return <DropdownMenuPrimitive.Trigger ref={ref} data-slot="dropdown-menu-trigger" {...props} />;
});

export type DropdownMenuContentProps = ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>;

export const DropdownMenuContent = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Content>,
  DropdownMenuContentProps
>(function DropdownMenuContent({ align = "end", className, collisionPadding = 8, loop = true, sideOffset = 6, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        align={align}
        className={cx("ui-dropdown-menu-content", className)}
        collisionPadding={collisionPadding}
        data-slot="dropdown-menu-content"
        loop={loop}
        sideOffset={sideOffset}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
});

export type DropdownMenuItemProps = ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
  icon?: ReactNode;
  loading?: boolean;
  loadingLabel?: ReactNode;
  variant?: "default" | "destructive";
};

export const DropdownMenuItem = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Item>,
  DropdownMenuItemProps
>(function DropdownMenuItem({
  children,
  className,
  disabled,
  icon,
  loading = false,
  loadingLabel,
  variant = "default",
  ...props
}, ref) {
  return (
    <DropdownMenuPrimitive.Item
      {...props}
      ref={ref}
      aria-busy={loading || undefined}
      className={cx("ui-dropdown-menu-item", className)}
      data-has-icon={Boolean(icon || loading) || undefined}
      data-loading={loading || undefined}
      data-slot="dropdown-menu-item"
      data-variant={variant}
      disabled={disabled || loading}
    >
      {icon || loading ? (
        <span className="ui-dropdown-menu-item-icon" data-slot="dropdown-menu-item-icon" aria-hidden="true">
          {loading ? <Spinner decorative /> : icon}
        </span>
      ) : null}
      <span className="ui-dropdown-menu-item-label" data-slot="dropdown-menu-item-label">
        {loading ? loadingLabel || children : children}
      </span>
    </DropdownMenuPrimitive.Item>
  );
});

export const DropdownMenuLabel = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Label>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>
>(function DropdownMenuLabel({ className, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Label
      ref={ref}
      className={cx("ui-dropdown-menu-label", className)}
      data-slot="dropdown-menu-label"
      {...props}
    />
  );
});

export const DropdownMenuSeparator = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(function DropdownMenuSeparator({ className, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      className={cx("ui-dropdown-menu-separator", className)}
      data-slot="dropdown-menu-separator"
      {...props}
    />
  );
});
