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
  "aria-atomic": ariaAtomic,
  "aria-live": ariaLive,
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
  const liveMode = live ?? ariaLive ?? (tone === "danger" ? "assertive" : "off");
  const resolvedRole = role ?? (
    liveMode === "assertive" ? "alert" : liveMode === "polite" ? "status" : undefined
  );
  const resolvedAriaLive = ariaLive ?? (
    role && role !== "alert" && role !== "status" && liveMode !== "off" ? liveMode : undefined
  );
  const resolvedAriaAtomic = ariaAtomic ?? (resolvedAriaLive ? true : undefined);
  const hasLiveRegion =
    resolvedRole === "alert" ||
    resolvedRole === "status" ||
    resolvedAriaLive === "assertive" ||
    resolvedAriaLive === "polite";
  const isolateLiveCopy = Boolean(action) && hasLiveRegion;

  return (
    <div
      {...props}
      ref={ref}
      aria-atomic={isolateLiveCopy ? undefined : resolvedAriaAtomic}
      aria-live={isolateLiveCopy ? undefined : resolvedAriaLive}
      className={cx("ui-notice", `ui-notice-${tone}`, className)}
      data-has-action={Boolean(action) || undefined}
      data-has-title={Boolean(title) || undefined}
      data-live={liveMode === "off" ? undefined : liveMode}
      data-live-target={isolateLiveCopy ? "copy" : hasLiveRegion ? "root" : undefined}
      data-slot="notice"
      data-tone={tone}
      role={isolateLiveCopy ? undefined : resolvedRole}
    >
      <span className="ui-notice-icon" data-slot="notice-icon" aria-hidden="true">{icon ?? <Icon />}</span>
      <div
        aria-atomic={isolateLiveCopy ? resolvedAriaAtomic : undefined}
        aria-live={isolateLiveCopy ? resolvedAriaLive : undefined}
        className="ui-notice-copy"
        data-slot="notice-copy"
        role={isolateLiveCopy ? resolvedRole : undefined}
      >
        {title ? <strong className="ui-notice-title" data-slot="notice-title">{title}</strong> : null}
        <div className="ui-notice-content" data-slot="notice-content">{children}</div>
      </div>
      {action ? <div className="ui-notice-action" data-slot="notice-action">{action}</div> : null}
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
      data-has-action={Boolean(action) && variant !== "loading" || undefined}
      data-has-title={Boolean(title) || undefined}
      data-slot="empty-state"
      data-state={variant}
      role={resolvedRole}
    >
      <span className="ui-empty-state-icon" data-slot="empty-state-media" aria-hidden="true">
        {variant === "loading" ? <Spinner decorative /> : icon ?? <DefaultIcon />}
      </span>
      <div className="ui-empty-state-copy" data-slot="empty-state-copy" role={copyRole}>
        {title ? <strong className="ui-empty-state-title" data-slot="empty-state-title">{title}</strong> : null}
        <div className="ui-empty-state-description" data-slot="empty-state-description">{description}</div>
      </div>
      {action && variant !== "loading" ? (
        <div className="ui-empty-state-action" data-slot="empty-state-action">{action}</div>
      ) : null}
    </div>
  );
});
