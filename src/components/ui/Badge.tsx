import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, CircleHelp, CircleMinus, Clock3 } from "lucide-react";
import { cx } from "./utils";

export type BadgeTone = "success" | "warning" | "danger" | "neutral" | "accent" | "info" | "outline";
export type BadgeSize = "sm" | "md";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  "data-slot"?: string;
  tone?: BadgeTone;
  icon?: ReactNode;
  size?: BadgeSize;
  truncate?: boolean;
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge({
  tone = "neutral",
  icon,
  size = "sm",
  truncate = false,
  className,
  children,
  "data-slot": inheritedSlot,
  ...props
}, ref) {
  return (
    <span
      {...props}
      ref={ref}
      className={cx("ui-badge", `ui-badge-${tone}`, `ui-badge-${size}`, className)}
      data-size={size}
      data-slot={inheritedSlot ?? "badge"}
      data-tone={tone}
      data-truncate={truncate || undefined}
    >
      {icon ? <span className="ui-badge-icon" data-icon="inline-start" aria-hidden="true">{icon}</span> : null}
      <span className="ui-badge-label">{children}</span>
    </span>
  );
});

export type StatusBadgeStatus = "ok" | "stale" | "error" | "skipped" | "missing";

export type StatusBadgeProps = Omit<BadgeProps, "tone" | "icon"> & {
  status: StatusBadgeStatus;
};

const statusConfig = {
  ok: { tone: "success" as const, icon: CheckCircle2 },
  stale: { tone: "warning" as const, icon: Clock3 },
  error: { tone: "danger" as const, icon: AlertTriangle },
  skipped: { tone: "neutral" as const, icon: CircleMinus },
  missing: { tone: "info" as const, icon: CircleHelp }
};

export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(function StatusBadge({
  status,
  children,
  className,
  size = "md",
  "data-slot": inheritedSlot,
  ...props
}, ref) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <Badge
      {...props}
      ref={ref}
      className={cx("ui-status-badge", className)}
      data-slot={inheritedSlot ?? "status-badge"}
      data-status={status}
      icon={<Icon />}
      size={size}
      tone={config.tone}
    >
      {children}
    </Badge>
  );
});
