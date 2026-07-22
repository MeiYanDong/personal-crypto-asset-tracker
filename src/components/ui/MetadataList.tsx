import {
  Children,
  forwardRef,
  type HTMLAttributes,
  type ReactNode
} from "react";
import { cx } from "./utils";

export type MetadataListProps = Omit<HTMLAttributes<HTMLUListElement>, "children"> & {
  children?: ReactNode;
  emptyText?: ReactNode;
};

export const MetadataList = forwardRef<HTMLUListElement, MetadataListProps>(
  function MetadataList({ children, className, emptyText, ...props }, ref) {
    const items = Children.toArray(children);
    return (
      <ul
        {...props}
        ref={ref}
        className={cx("ui-metadata-list", className)}
        data-empty={items.length === 0 || undefined}
        data-slot="metadata-list"
        data-visible-count={items.length}
      >
        {items.length ? items : emptyText ? (
          <li className="ui-metadata-empty" data-slot="metadata-empty">
            {emptyText}
          </li>
        ) : null}
      </ul>
    );
  }
);

export type MetadataItemVariant = "default" | "code" | "overflow" | "warning";

export type MetadataItemProps = Omit<HTMLAttributes<HTMLLIElement>, "children"> & {
  fullLabel?: string;
  icon?: ReactNode;
  label: ReactNode;
  value?: ReactNode;
  variant?: MetadataItemVariant;
};

export const MetadataItem = forwardRef<HTMLLIElement, MetadataItemProps>(
  function MetadataItem({ className, fullLabel, icon, label, value, variant = "default", ...props }, ref) {
    const labelContent = variant === "code" ? (
      <code aria-label={fullLabel} data-slot="metadata-label">{label}</code>
    ) : (
      <span data-slot="metadata-label">{label}</span>
    );

    return (
      <li
        {...props}
        ref={ref}
        className={cx("ui-metadata-item", className)}
        data-has-icon={Boolean(icon) || undefined}
        data-has-value={value !== undefined || undefined}
        data-slot="metadata-item"
        data-variant={variant}
      >
        {icon ? (
          <span aria-hidden="true" className="ui-metadata-icon" data-slot="metadata-icon">
            {icon}
          </span>
        ) : null}
        {labelContent}
        {value !== undefined ? <span data-slot="metadata-value">{value}</span> : null}
      </li>
    );
  }
);
