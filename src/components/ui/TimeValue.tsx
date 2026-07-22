import { useEffect, useState, type HTMLAttributes } from "react";
import { cx } from "./utils";

const compactDateTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23"
});

const exactDateTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23"
});

const relativeTimeFormatter = new Intl.RelativeTimeFormat("zh-CN", {
  numeric: "always",
  style: "long"
});

export type TimeValueInput = string | number | Date;
export type TimeValueMode = "absolute" | "relative";
export type TimeValueTone = "fresh" | "aging" | "stale";
export type RelativeTimeDetails = {
  label: string;
  tone: TimeValueTone;
  valid: boolean;
};

function parseTimeValue(value?: TimeValueInput) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const date = value instanceof Date
    ? new Date(value.getTime())
    : typeof value === "number"
      ? new Date(value)
      : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function formatDateTime(value?: TimeValueInput, emptyLabel = "尚未刷新") {
  const date = parseTimeValue(value);
  return date ? compactDateTimeFormatter.format(date) : emptyLabel;
}

export function formatExactDateTime(value?: TimeValueInput, emptyLabel = "尚未刷新") {
  const date = parseTimeValue(value);
  return date ? exactDateTimeFormatter.format(date) : emptyLabel;
}

export function relativeTimeDetails(value?: TimeValueInput, now = Date.now()): RelativeTimeDetails {
  const date = parseTimeValue(value);
  if (!date || !Number.isFinite(now)) {
    return { label: "尚未刷新", tone: "stale", valid: false };
  }

  const delta = date.getTime() - now;
  const distance = Math.abs(delta);
  const future = delta > 0;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;
  const year = 365 * day;

  if (distance < 2 * minute) {
    return {
      label: future ? "即将刷新" : "刚刚刷新",
      tone: "fresh",
      valid: true
    };
  }

  const [amount, unit] = distance < hour
    ? [Math.max(1, Math.floor(distance / minute)), "minute"] as const
    : distance < day
      ? [Math.max(1, Math.floor(distance / hour)), "hour"] as const
      : distance < month
        ? [Math.max(1, Math.floor(distance / day)), "day"] as const
        : distance < year
          ? [Math.max(1, Math.floor(distance / month)), "month"] as const
          : [Math.max(1, Math.floor(distance / year)), "year"] as const;
  const tone: TimeValueTone = distance < 8 * hour
    ? "fresh"
    : distance < 3 * day
      ? "aging"
      : "stale";

  return {
    label: relativeTimeFormatter.format(future ? amount : -amount, unit),
    tone,
    valid: true
  };
}

export function useRelativeTimeClock(enabled = true, intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    setNow(Date.now());
    const safeInterval = Number.isFinite(intervalMs) ? Math.max(1_000, intervalMs) : 60_000;
    const timer = window.setInterval(() => setNow(Date.now()), safeInterval);
    return () => window.clearInterval(timer);
  }, [enabled, intervalMs]);

  return now;
}

export type TimeValueProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  "data-slot"?: string;
  emptyLabel?: string;
  mode?: TimeValueMode;
  now?: number;
  value?: TimeValueInput;
};

export function TimeValue({
  className,
  "data-slot": inheritedSlot,
  emptyLabel = "尚未刷新",
  mode = "absolute",
  now,
  title,
  value,
  ...props
}: TimeValueProps) {
  const date = parseTimeValue(value);
  if (!date) {
    return (
      <span
        {...props}
        className={cx("ui-time-value", className)}
        data-mode={mode}
        data-slot={inheritedSlot ?? "time-value"}
        data-state="empty"
        title={title}
      >
        {emptyLabel}
      </span>
    );
  }

  const label = mode === "relative"
    ? relativeTimeDetails(date, now).label
    : formatDateTime(date, emptyLabel);
  const exactLabel = formatExactDateTime(date, emptyLabel);

  return (
    <time
      {...props}
      className={cx("ui-time-value", className)}
      data-mode={mode}
      data-slot={inheritedSlot ?? "time-value"}
      data-state="valid"
      dateTime={date.toISOString()}
      title={title ?? `完整时间：${exactLabel}`}
    >
      {label}
    </time>
  );
}
