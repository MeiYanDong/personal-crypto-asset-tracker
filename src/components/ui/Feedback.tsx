import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, CircleX, Info } from "lucide-react";
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

type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  icon?: ReactNode;
  title?: ReactNode;
  description: ReactNode;
  loading?: boolean;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, loading, action, className, ...props }: EmptyStateProps) {
  return (
    <div className={cx("ui-empty-state", className)} {...props}>
      <span className="ui-empty-state-icon" aria-hidden="true">
        {loading ? <Spinner decorative /> : icon}
      </span>
      <div className="ui-empty-state-copy">
        {title ? <strong>{title}</strong> : null}
        <span>{description}</span>
      </div>
      {action ? <div className="ui-empty-state-action">{action}</div> : null}
    </div>
  );
}
