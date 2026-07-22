import {
  forwardRef,
  useId,
  type FieldsetHTMLAttributes
} from "react";
import { Check } from "lucide-react";
import { cx } from "./utils";

export type ColorSwatchOption = {
  label: string;
  value: string;
};

export type ColorSwatchGroupProps = Omit<
  FieldsetHTMLAttributes<HTMLFieldSetElement>,
  "onChange"
> & {
  label: string;
  name: string;
  onValueChange: (value: string) => void;
  options: readonly ColorSwatchOption[];
  size?: "sm" | "md";
  value: string;
};

export const ColorSwatchGroup = forwardRef<HTMLFieldSetElement, ColorSwatchGroupProps>(
  function ColorSwatchGroup({
    className,
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

    return (
      <fieldset
        {...props}
        ref={ref}
        className={cx("ui-color-swatch-group", className)}
        data-disabled={disabled || undefined}
        data-size={size}
        data-slot="color-swatch-group"
        disabled={disabled}
      >
        <legend className="ui-color-swatch-label" data-slot="color-swatch-label">
          {label}
        </legend>
        <div className="ui-color-swatch-list" data-slot="color-swatch-list">
          {options.map((option, index) => {
            const checked = value === option.value;
            const inputId = `${generatedId}-${index}`;

            return (
              <label
                className="ui-color-swatch"
                data-color={option.value}
                data-state={checked ? "checked" : "unchecked"}
                data-slot="color-swatch"
                key={option.value}
                title={option.label}
              >
                <input
                  aria-label={option.label}
                  checked={checked}
                  className="ui-color-swatch-input"
                  id={inputId}
                  name={name}
                  type="radio"
                  value={option.value}
                  onChange={() => onValueChange(option.value)}
                />
                <span aria-hidden="true" className="ui-color-swatch-surface">
                  <Check />
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  }
);
