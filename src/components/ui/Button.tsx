import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Spinner } from "./Spinner";
import { Tooltip } from "./Tooltip";
import { cx } from "./utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "quiet" | "danger" | "destructive";
export type ButtonSize = "md" | "sm" | "xs";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingLabel?: string;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  loadingLabel,
  type = "button",
  "aria-busy": ariaBusy,
  "aria-label": ariaLabel,
  ...props
}, ref) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      ref={ref}
      aria-busy={loading ? true : ariaBusy}
      aria-label={loading && loadingLabel ? loadingLabel : ariaLabel}
      className={cx("ui-button", `ui-button-${variant}`, `ui-button-${size}`, className)}
      data-disabled={isDisabled || undefined}
      data-loading={loading || undefined}
      data-size={size}
      data-state={loading ? "loading" : disabled ? "disabled" : "idle"}
      data-variant={variant}
      disabled={isDisabled}
      type={type}
    >
      {loading ? <Spinner data-icon="inline-start" decorative /> : null}
      {children}
    </button>
  );
});

export type IconButtonVariant = "secondary" | "ghost" | "danger" | "primary";

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "aria-label"> & {
  label: string;
  children: ReactNode;
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
  loading = false,
  loadingLabel,
  title,
  type = "button",
  "aria-busy": ariaBusy,
  ...props
}, ref) {
  const isDisabled = disabled || loading;
  const resolvedLoadingLabel = loadingLabel || `${label}，处理中`;
  const button = (
    <button
      {...props}
      ref={ref}
      aria-busy={loading ? true : ariaBusy}
      aria-label={loading ? resolvedLoadingLabel : label}
      className={cx("ui-icon-button", `ui-icon-button-${variant}`, `ui-icon-button-${size}`, className)}
      data-disabled={isDisabled || undefined}
      data-loading={loading || undefined}
      data-size={size}
      data-state={loading ? "loading" : disabled ? "disabled" : "idle"}
      data-variant={variant}
      disabled={isDisabled}
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
    <Tooltip content={loading ? resolvedLoadingLabel : title || label}>
      {isDisabled ? <span className="ui-tooltip-disabled-trigger">{button}</span> : button}
    </Tooltip>
  );
});
