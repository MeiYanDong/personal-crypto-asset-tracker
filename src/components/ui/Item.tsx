import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "./utils";

export type ItemVariant = "default" | "outline" | "muted";
export type ItemSize = "default" | "sm" | "xs";
export type ItemMediaVariant = "default" | "icon" | "image";

export type ItemGroupProps = HTMLAttributes<HTMLUListElement>;

export const ItemGroup = forwardRef<HTMLUListElement, ItemGroupProps>(function ItemGroup(
  { className, ...props },
  ref
) {
  return <ul {...props} ref={ref} className={cx("ui-item-group", className)} data-slot="item-group" />;
});

export type ItemProps = HTMLAttributes<HTMLLIElement> & {
  size?: ItemSize;
  variant?: ItemVariant;
};

export const Item = forwardRef<HTMLLIElement, ItemProps>(function Item(
  { className, size = "default", variant = "default", ...props },
  ref
) {
  return (
    <li
      {...props}
      ref={ref}
      className={cx("ui-item", className)}
      data-size={size}
      data-slot="item"
      data-variant={variant}
    />
  );
});

export type ItemMediaProps = HTMLAttributes<HTMLDivElement> & {
  variant?: ItemMediaVariant;
};

export const ItemMedia = forwardRef<HTMLDivElement, ItemMediaProps>(function ItemMedia(
  { className, variant = "default", ...props },
  ref
) {
  return (
    <div
      {...props}
      ref={ref}
      className={cx("ui-item-media", className)}
      data-slot="item-media"
      data-variant={variant}
    />
  );
});

export const ItemContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function ItemContent(
  { className, ...props },
  ref
) {
  return <div {...props} ref={ref} className={cx("ui-item-content", className)} data-slot="item-content" />;
});

export const ItemTitle = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function ItemTitle(
  { className, ...props },
  ref
) {
  return <div {...props} ref={ref} className={cx("ui-item-title", className)} data-slot="item-title" />;
});

export const ItemDescription = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function ItemDescription({ className, ...props }, ref) {
    return (
      <div
        {...props}
        ref={ref}
        className={cx("ui-item-description", className)}
        data-slot="item-description"
      />
    );
  }
);

export const ItemActions = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function ItemActions(
  { className, ...props },
  ref
) {
  return <div {...props} ref={ref} className={cx("ui-item-actions", className)} data-slot="item-actions" />;
});

export const ItemHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function ItemHeader(
  { className, ...props },
  ref
) {
  return <div {...props} ref={ref} className={cx("ui-item-header", className)} data-slot="item-header" />;
});

export const ItemFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function ItemFooter(
  { className, ...props },
  ref
) {
  return <div {...props} ref={ref} className={cx("ui-item-footer", className)} data-slot="item-footer" />;
});

export const ItemSeparator = forwardRef<HTMLLIElement, HTMLAttributes<HTMLLIElement>>(function ItemSeparator(
  { className, role = "separator", ...props },
  ref
) {
  return (
    <li
      {...props}
      ref={ref}
      aria-hidden="true"
      className={cx("ui-item-separator", className)}
      data-slot="item-separator"
      role={role}
    />
  );
});
