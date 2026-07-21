import type { HTMLAttributes } from "react";
import { cx } from "./utils";

export function ItemGroup({ className, role = "list", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("ui-item-group", className)} role={role} {...props} />;
}

export function Item({ className, role = "listitem", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("ui-item", className)} role={role} {...props} />;
}

export function ItemMedia({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("ui-item-media", className)} {...props} />;
}

export function ItemContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("ui-item-content", className)} {...props} />;
}

export function ItemTitle({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("ui-item-title", className)} {...props} />;
}

export function ItemDescription({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("ui-item-description", className)} {...props} />;
}

export function ItemActions({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("ui-item-actions", className)} {...props} />;
}

export function ItemFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("ui-item-footer", className)} {...props} />;
}
