import type { HTMLAttributes, ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Clock3, CircleDashed } from "lucide-react";
import { cx } from "./utils";

export type BadgeTone = "success" | "warning" | "danger" | "neutral" | "accent" | "info" | "outline";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  icon?: ReactNode;
};

export function Badge({ tone = "neutral", icon, className, children, ...props }: BadgeProps) {
  return (
    <span className={cx("ui-badge", `ui-badge-${tone}`, className)} {...props}>
      {icon}
      {children}
    </span>
  );
}

type StatusBadgeProps = Omit<BadgeProps, "tone" | "icon"> & {
  status: "ok" | "stale" | "error" | "skipped";
};

const statusConfig = {
  ok: { tone: "success" as const, icon: CheckCircle2 },
  stale: { tone: "warning" as const, icon: Clock3 },
  error: { tone: "danger" as const, icon: AlertTriangle },
  skipped: { tone: "neutral" as const, icon: CircleDashed }
};

export function StatusBadge({ status, children, className, ...props }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <Badge className={className} icon={<Icon aria-hidden="true" />} tone={config.tone} {...props}>
      {children}
    </Badge>
  );
}
