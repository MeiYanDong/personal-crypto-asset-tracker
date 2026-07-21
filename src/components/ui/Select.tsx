import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cx } from "./utils";

export type SelectOption = {
  value: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
};

export type SelectProps = Omit<ComponentPropsWithoutRef<typeof SelectPrimitive.Root>, "children"> & {
  className?: string;
  icon?: ReactNode;
  invalid?: boolean;
  label: string;
  options: readonly SelectOption[];
  placeholder?: string;
};

export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select({
  className,
  icon,
  invalid = false,
  label,
  options,
  placeholder,
  ...props
}, ref) {
  return (
    <SelectPrimitive.Root {...props}>
      <SelectPrimitive.Trigger
        ref={ref}
        aria-invalid={invalid || undefined}
        aria-label={label}
        className={cx("ui-select-trigger", Boolean(icon) && "has-leading-icon", className)}
        data-invalid={invalid || undefined}
        data-slot="select-trigger"
      >
        {icon ? (
          <span className="ui-select-leading" data-slot="select-leading" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <span className="ui-select-value" data-slot="select-value">
          <SelectPrimitive.Value placeholder={placeholder} />
        </span>
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="ui-select-chevron" aria-hidden="true" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          align="start"
          className="ui-select-content"
          collisionPadding={8}
          data-slot="select-content"
          position="popper"
          sideOffset={5}
        >
          <SelectPrimitive.ScrollUpButton className="ui-select-scroll-button" data-slot="select-scroll-up">
            <ChevronUp aria-hidden="true" />
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className="ui-select-viewport" data-slot="select-viewport">
            {options.map((option) => (
              <SelectPrimitive.Item
                className="ui-select-item"
                data-slot="select-item"
                disabled={option.disabled}
                key={option.value}
                textValue={option.label}
                value={option.value}
              >
                <span className="ui-select-item-indicator-slot" data-slot="select-indicator-slot" aria-hidden="true">
                  <SelectPrimitive.ItemIndicator className="ui-select-item-indicator" data-slot="select-indicator">
                    <Check />
                  </SelectPrimitive.ItemIndicator>
                </span>
                <SelectPrimitive.ItemText asChild>
                  <span
                    className={cx("ui-select-option", Boolean(option.icon) && "has-icon")}
                    data-slot="select-option"
                  >
                    {option.icon ? (
                      <span className="ui-select-option-icon" data-slot="select-option-icon" aria-hidden="true">
                        {option.icon}
                      </span>
                    ) : null}
                    <span className="ui-select-option-label" data-slot="select-option-label" title={option.label}>
                      {option.label}
                    </span>
                  </span>
                </SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="ui-select-scroll-button" data-slot="select-scroll-down">
            <ChevronDown aria-hidden="true" />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
});
