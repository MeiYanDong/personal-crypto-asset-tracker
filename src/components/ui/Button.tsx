import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Spinner } from "./Spinner";
import { Tooltip } from "./Tooltip";
import { cx } from "./utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "quiet" | "danger" | "destructive";
export type ButtonSize = "md" | "sm" | "xs";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  "data-slot"?: string;
  "data-state"?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingLabel?: string;
  preserveFocusOnLoading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  loadingLabel,
  preserveFocusOnLoading = false,
  type = "button",
  "aria-busy": ariaBusy,
  "aria-disabled": ariaDisabled,
  "aria-label": ariaLabel,
  "data-slot": inheritedSlot,
  "data-state": inheritedState,
  ...props
}, ref) {
  const isExplicitlyAriaDisabled = ariaDisabled === true || ariaDisabled === "true";
  const isLoadingAriaDisabled = loading && preserveFocusOnLoading;
  const isAriaDisabled = isExplicitlyAriaDisabled || isLoadingAriaDisabled;
  const isDisabled = Boolean(disabled || loading || isAriaDisabled);
  const isNativeDisabled = Boolean(disabled || (loading && !preserveFocusOnLoading));
  const status = loading ? "loading" : isDisabled ? "disabled" : "idle";

  return (
    <button
      {...props}
      ref={ref}
      aria-busy={loading ? true : ariaBusy}
      aria-disabled={isAriaDisabled ? true : ariaDisabled}
      aria-label={loading && loadingLabel ? loadingLabel : ariaLabel}
      className={cx("ui-button", `ui-button-${variant}`, `ui-button-${size}`, className)}
      data-slot={inheritedSlot ?? "button"}
      data-disabled={isDisabled || undefined}
      data-loading={loading || undefined}
      data-size={size}
      data-state={inheritedState ?? status}
      data-status={status}
      data-variant={variant}
      disabled={isNativeDisabled}
      onClick={(event) => {
        if (isAriaDisabled) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        props.onClick?.(event);
      }}
      type={type}
    >
      {loading ? <Spinner data-icon="inline-start" decorative /> : null}
      {children}
    </button>
  );
});

export type IconButtonVariant = "secondary" | "ghost" | "danger" | "primary";

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "aria-label"> & {
  "data-slot"?: string;
  "data-state"?: string;
  label: string;
  children: ReactNode;
  disabledReason?: ReactNode;
  loading?: boolean;
  loadingLabel?: string;
  tooltip?: boolean;
  variant?: IconButtonVariant;
  size?: ButtonSize;
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton({
  label,
  variant = "secondary",
  size = "md",
  tooltip = true,
  className,
  children,
  disabled,
  disabledReason,
  loading = false,
  loadingLabel,
  title,
  type = "button",
  "aria-busy": ariaBusy,
  "aria-disabled": ariaDisabled,
  "data-slot": inheritedSlot,
  "data-state": inheritedState,
  onClick,
  ...props
}, ref) {
  const hasDisabledReason = disabledReason !== undefined && disabledReason !== null;
  const isDiscoverableDisabled = Boolean(disabled && tooltip && hasDisabledReason && !loading);
  const isExplicitlyAriaDisabled = ariaDisabled === true || ariaDisabled === "true";
  const isAriaDisabled = isDiscoverableDisabled || isExplicitlyAriaDisabled;
  const isDisabled = Boolean(disabled || loading || isAriaDisabled);
  const isNativeDisabled = Boolean((disabled || loading) && !isDiscoverableDisabled);
  const status = loading ? "loading" : isDisabled ? "disabled" : "idle";
  const resolvedLoadingLabel = loadingLabel || `${label}，处理中`;
  const tooltipContent = isDiscoverableDisabled
    ? disabledReason
    : loading
      ? resolvedLoadingLabel
      : title || label;
  const button = (
    <button
      {...props}
      ref={ref}
      aria-busy={loading ? true : ariaBusy}
      aria-disabled={isAriaDisabled ? true : ariaDisabled}
      aria-label={loading ? resolvedLoadingLabel : label}
      className={cx("ui-icon-button", `ui-icon-button-${variant}`, `ui-icon-button-${size}`, className)}
      data-slot={inheritedSlot ?? "icon-button"}
      data-disabled={isDisabled || undefined}
      data-loading={loading || undefined}
      data-size={size}
      data-state={inheritedState ?? status}
      data-status={status}
      data-variant={variant}
      disabled={isNativeDisabled}
      onClick={(event) => {
        if (isAriaDisabled) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        onClick?.(event);
      }}
      title={tooltip ? undefined : title}
      type={type}
    >
      {loading ? <Spinner decorative /> : children}
    </button>
  );

  if (!tooltip) {
    return button;
  }

  return (
    <Tooltip content={tooltipContent}>
      {isNativeDisabled ? <span className="ui-tooltip-disabled-trigger">{button}</span> : button}
    </Tooltip>
  );
});
