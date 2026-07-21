import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
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
      ref={ref}
      className={cx("ui-button", `ui-button-${variant}`, `ui-button-${size}`, className)}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading ? <Loader2 className="spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
});

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "aria-label"> & {
  label: string;
  children: ReactNode;
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
  title,
  type = "button",
  ...props
}, ref) {
  const button = (
    <button
      ref={ref}
      aria-label={label}
      className={cx("ui-icon-button", `ui-icon-button-${variant}`, `ui-icon-button-${size}`, className)}
      disabled={disabled}
      title={tooltip ? undefined : title}
      type={type}
      {...props}
    >
      {children}
    </button>
  );

  if (!tooltip) {
    return button;
  }

  return (
    <Tooltip content={title || label}>
      {disabled ? <span className="ui-tooltip-disabled-trigger">{button}</span> : button}
    </Tooltip>
  );
});
