import type { HTMLAttributes, ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, Loader2 } from "lucide-react";
import { cx } from "./utils";

type NoticeTone = "info" | "success" | "warning" | "danger";

type NoticeProps = HTMLAttributes<HTMLDivElement> & {
  tone?: NoticeTone;
  icon?: ReactNode;
};

const noticeIcons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertTriangle
};

export function Notice({ tone = "info", icon, className, children, ...props }: NoticeProps) {
  const Icon = noticeIcons[tone];
  return (
    <div className={cx("ui-notice", `ui-notice-${tone}`, className)} role={tone === "danger" ? "alert" : "status"} {...props}>
      <span className="ui-notice-icon" aria-hidden="true">{icon || <Icon />}</span>
      <div className="ui-notice-content">{children}</div>
    </div>
  );
}

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
        {loading ? <Loader2 className="spin" /> : icon}
      </span>
      <div className="ui-empty-state-copy">
        {title ? <strong>{title}</strong> : null}
        <span>{description}</span>
      </div>
      {action ? <div className="ui-empty-state-action">{action}</div> : null}
    </div>
  );
}
