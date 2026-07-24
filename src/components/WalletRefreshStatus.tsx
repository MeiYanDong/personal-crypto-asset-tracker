import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  CircleHelp,
  CircleMinus,
  Clock3,
  ListFilter
} from "lucide-react";
import { forwardRef, type ReactNode } from "react";
import {
  type WalletRefreshCounts,
  type WalletRefreshFilter,
  type WalletRefreshState,
  type WalletRefreshStatus,
  walletRefreshState
} from "../../shared/wallet-snapshot";
import { StatusBadge, type StatusBadgeProps } from "./ui/Badge";
import { Select, type SelectProps } from "./ui/Select";

export const walletRefreshStateLabels: Record<WalletRefreshState, string> = {
  ok: "正常",
  stale: "旧数据",
  error: "失败",
  skipped: "跳过",
  missing: "缺失"
};

export type WalletRefreshStatusBadgeProps = Omit<StatusBadgeProps, "children" | "status"> & {
  children?: ReactNode;
  status?: WalletRefreshStatus;
};

export const WalletRefreshStatusBadge = forwardRef<
  HTMLSpanElement,
  WalletRefreshStatusBadgeProps
>(function WalletRefreshStatusBadge({ children, status, ...props }, ref) {
  const state = walletRefreshState(status);
  return (
    <StatusBadge {...props} ref={ref} status={state}>
      {children ?? walletRefreshStateLabels[state]}
    </StatusBadge>
  );
});

export type WalletRefreshFilterSelectProps = Omit<
  SelectProps,
  "defaultValue" | "label" | "onValueChange" | "options" | "value"
> & {
  counts: WalletRefreshCounts;
  label?: string;
  onValueChange: (value: WalletRefreshFilter) => void;
  value: WalletRefreshFilter;
};

export const WalletRefreshFilterSelect = forwardRef<
  HTMLButtonElement,
  WalletRefreshFilterSelectProps
>(function WalletRefreshFilterSelect({
  counts,
  label = "筛选刷新状态",
  onValueChange,
  value,
  ...props
}, ref) {
  return (
    <Select
      {...props}
      ref={ref}
      label={label}
      value={value}
      onValueChange={(nextValue) => onValueChange(nextValue as WalletRefreshFilter)}
      options={[
        {
          value: "all",
          label: `全部状态 · ${counts.all}`,
          icon: <ListFilter size={14} />
        },
        {
          value: "issues",
          label: `待处理 · ${counts.issues}`,
          icon: <AlertTriangle size={14} />
        },
        {
          value: "ok",
          label: `${walletRefreshStateLabels.ok} · ${counts.ok}`,
          icon: <CheckCircle2 size={14} />
        },
        {
          value: "stale",
          label: `${walletRefreshStateLabels.stale} · ${counts.stale}`,
          icon: <Clock3 size={14} />
        },
        {
          value: "error",
          label: `${walletRefreshStateLabels.error} · ${counts.error}`,
          icon: <CircleAlert size={14} />
        },
        {
          value: "skipped",
          label: `${walletRefreshStateLabels.skipped} · ${counts.skipped}`,
          icon: <CircleMinus size={14} />
        },
        {
          value: "missing",
          label: `${walletRefreshStateLabels.missing} · ${counts.missing}`,
          icon: <CircleHelp size={14} />
        }
      ]}
    />
  );
});
