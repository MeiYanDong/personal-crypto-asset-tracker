import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Spinner } from "./Spinner";
import { Tooltip } from "./Tooltip";
import { cx } from "./utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "quiet" | "danger" | "destructive";
type ButtonSize = "md" | "sm" | "xs";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  type = "button",
  ...props
}, ref) {
  return (
    <button
      {...props}
      ref={ref}
      aria-busy={loading || props["aria-busy"]}
      className={cx("ui-button", `ui-button-${variant}`, `ui-button-${size}`, className)}
      data-loading={loading || undefined}
      disabled={disabled || loading}
      type={type}
    >
      {loading ? <Spinner data-icon="inline-start" decorative /> : null}
      {children}
    </button>
  );
});

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "aria-label"> & {
  label: string;
  children: ReactNode;
  loading?: boolean;
  tooltip?: boolean;
  variant?: "secondary" | "ghost" | "danger" | "primary";
  size?: "md" | "sm" | "xs";
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
  title,
  type = "button",
  ...props
}, ref) {
  const isDisabled = disabled || loading;
  const button = (
    <button
      {...props}
      ref={ref}
      aria-busy={loading || props["aria-busy"]}
      aria-label={label}
      className={cx("ui-icon-button", `ui-icon-button-${variant}`, `ui-icon-button-${size}`, className)}
      data-loading={loading || undefined}
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
    <Tooltip content={title || label}>
      {isDisabled ? <span className="ui-tooltip-disabled-trigger">{button}</span> : button}
    </Tooltip>
  );
});
