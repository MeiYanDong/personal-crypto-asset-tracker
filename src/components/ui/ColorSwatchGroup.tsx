import {
  forwardRef,
  useId,
  type ComponentPropsWithoutRef,
  type ElementRef
} from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Check } from "lucide-react";
import { cx } from "./utils";

export type ColorSwatchOption = {
  label: string;
  value: string;
};

export type ColorSwatchGroupProps = Omit<
  ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>,
  "children" | "name" | "onValueChange" | "orientation" | "value"
> & {
  "data-slot"?: string;
  label: string;
  name: string;
  onValueChange: (value: string) => void;
  options: readonly ColorSwatchOption[];
  size?: "sm" | "md";
  value: string;
};

export const ColorSwatchGroup = forwardRef<
  ElementRef<typeof RadioGroupPrimitive.Root>,
  ColorSwatchGroupProps
>(
  function ColorSwatchGroup({
    "aria-labelledby": ariaLabelledBy,
    className,
    "data-slot": inheritedSlot,
    disabled,
    label,
    name,
    onValueChange,
    options,
    size = "md",
    value,
    ...props
  }, ref) {
    const generatedId = useId();
    const labelId = `${generatedId}-label`;
    const selectedOptionLabel = options.find((option) => option.value === value)?.label;

    return (
      <RadioGroupPrimitive.Root
        {...props}
        ref={ref}
        aria-labelledby={ariaLabelledBy ?? labelId}
        className={cx("ui-color-swatch-group", className)}
        data-size={size}
        data-slot={inheritedSlot ?? "color-swatch-group"}
        disabled={disabled}
        name={name}
        orientation="horizontal"
        value={value}
        onValueChange={onValueChange}
      >
        <span className="ui-color-swatch-label" data-slot="color-swatch-label" id={labelId}>
          <span>{label}</span>
          {selectedOptionLabel ? (
            <span aria-hidden="true" className="ui-color-swatch-value" data-slot="color-swatch-value">
              已选：{selectedOptionLabel}
            </span>
          ) : null}
        </span>
        <div className="ui-color-swatch-list" data-slot="color-swatch-list">
          {options.map((option) => (
            <RadioGroupPrimitive.Item
              aria-label={option.label}
              className="ui-color-swatch"
              data-color={option.value}
              data-slot="color-swatch"
              key={option.value}
              title={option.label}
              value={option.value}
            >
              <span aria-hidden="true" className="ui-color-swatch-surface">
                <RadioGroupPrimitive.Indicator className="ui-color-swatch-indicator">
                  <Check />
                </RadioGroupPrimitive.Indicator>
              </span>
            </RadioGroupPrimitive.Item>
          ))}
        </div>
      </RadioGroupPrimitive.Root>
    );
  }
);
