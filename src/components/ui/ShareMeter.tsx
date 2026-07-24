import { forwardRef, type HTMLAttributes } from "react";
import { BarSegment, MeterBar } from "./DataBar";
import {
  formatPercentage,
  percentageOf,
  PercentageValue,
  type PercentageFormatOptions
} from "./PercentageValue";
import { cx } from "./utils";

export type ShareMeterProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> &
  PercentageFormatOptions & {
    "data-slot"?: string;
    label?: string;
    total: number;
    value: number;
  };

export const ShareMeter = forwardRef<HTMLDivElement, ShareMeterProps>(function ShareMeter({
  className,
  "data-slot": inheritedSlot,
  label = "占总资产",
  maximumFractionDigits,
  minimumDisplayValue,
  total,
  value,
  ...props
}, ref) {
  const formatOptions = { maximumFractionDigits, minimumDisplayValue };
  const share = percentageOf(value, total);
  const shareLabel = formatPercentage(share, formatOptions);
  const state = share <= 0 ? "empty" : share >= 100 ? "full" : "partial";
  const thresholdValueText = shareLabel.startsWith("<") ? shareLabel : undefined;

  return (
    <div
      {...props}
      ref={ref}
      className={cx("ui-share-meter", className)}
      data-share={Number(share.toFixed(4))}
      data-slot={inheritedSlot ?? "share-meter"}
      data-state={state}
    >
      <MeterBar
        className="ui-share-meter-track"
        data-component="share-meter"
        data-slot="share-meter-track"
        label={label}
        value={share}
        valueText={thresholdValueText}
      >
        <BarSegment
          className="ui-share-meter-indicator"
          data-slot="share-meter-indicator"
          minimumVisible={share > 0}
          value={share}
        />
      </MeterBar>
      <span aria-hidden="true" className="ui-share-meter-value" data-slot="share-meter-value">
        <PercentageValue
          maximumFractionDigits={maximumFractionDigits}
          minimumDisplayValue={minimumDisplayValue}
          value={share}
        />
      </span>
    </div>
  );
});
