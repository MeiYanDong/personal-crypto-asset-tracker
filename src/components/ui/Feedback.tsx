import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, CircleX, Inbox, Info, SearchX } from "lucide-react";
import { Spinner } from "./Spinner";
import { cx } from "./utils";

export type NoticeTone = "info" | "success" | "warning" | "danger";
export type NoticeLive = "off" | "polite" | "assertive";

export type NoticeProps = HTMLAttributes<HTMLDivElement> & {
  tone?: NoticeTone;
  icon?: ReactNode;
  title?: ReactNode;
  action?: ReactNode;
  live?: NoticeLive;
};

const noticeIcons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: CircleX
};

export const Notice = forwardRef<HTMLDivElement, NoticeProps>(function Notice({
  tone = "info",
  icon,
  title,
  action,
  live,
  className,
  children,
  role,
  ...props
}, ref) {
  const Icon = noticeIcons[tone];
  const liveMode = live ?? (tone === "danger" ? "assertive" : "off");
  const resolvedRole = role ?? (
    liveMode === "assertive" ? "alert" : liveMode === "polite" ? "status" : undefined
  );

  return (
    <div
      {...props}
      ref={ref}
      className={cx("ui-notice", `ui-notice-${tone}`, className)}
      data-live={liveMode === "off" ? undefined : liveMode}
      data-tone={tone}
      role={resolvedRole}
    >
      <span className="ui-notice-icon" aria-hidden="true">{icon || <Icon />}</span>
      <div className="ui-notice-copy">
        {title ? <strong className="ui-notice-title">{title}</strong> : null}
        <div className="ui-notice-content">{children}</div>
      </div>
      {action ? <div className="ui-notice-action">{action}</div> : null}
    </div>
  );
});

export type EmptyStateVariant = "empty" | "no-results" | "loading";

export type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  icon?: ReactNode;
  title?: ReactNode;
  description: ReactNode;
  action?: ReactNode;
  variant?: EmptyStateVariant;
};

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState({
  icon,
  title,
  description,
  action,
  variant = "empty",
  className,
  role,
  "aria-busy": ariaBusy,
  ...props
}, ref) {
  const DefaultIcon = variant === "no-results" ? SearchX : Inbox;
  const resolvedRole = role ?? (variant === "loading" ? "status" : undefined);
  const copyRole = role === undefined && variant === "no-results" ? "status" : undefined;

  return (
    <div
      {...props}
      ref={ref}
      aria-busy={variant === "loading" ? true : ariaBusy}
      className={cx("ui-empty-state", className)}
      data-state={variant}
      role={resolvedRole}
    >
      <span className="ui-empty-state-icon" aria-hidden="true">
        {variant === "loading" ? <Spinner decorative /> : icon || <DefaultIcon />}
      </span>
      <div className="ui-empty-state-copy" role={copyRole}>
        {title ? <strong className="ui-empty-state-title">{title}</strong> : null}
        <span className="ui-empty-state-description">{description}</span>
      </div>
      {action && variant !== "loading" ? <div className="ui-empty-state-action">{action}</div> : null}
    </div>
  );
});
