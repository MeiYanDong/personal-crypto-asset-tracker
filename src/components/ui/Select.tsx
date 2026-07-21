import type { ComponentPropsWithoutRef, ReactNode } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cx } from "./utils";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectProps = Omit<ComponentPropsWithoutRef<typeof SelectPrimitive.Root>, "children"> & {
  className?: string;
  icon?: ReactNode;
  invalid?: boolean;
  label: string;
  options: readonly SelectOption[];
  placeholder?: string;
};

export function Select({
  className,
  icon,
  invalid = false,
  label,
  options,
  placeholder,
  ...props
}: SelectProps) {
  return (
    <SelectPrimitive.Root {...props}>
      <SelectPrimitive.Trigger
        aria-invalid={invalid || undefined}
        aria-label={label}
        className={cx("ui-select-trigger", Boolean(icon) && "has-leading-icon", className)}
      >
        {icon ? <span className="ui-select-leading" aria-hidden="true">{icon}</span> : null}
        <SelectPrimitive.Value className="ui-select-value" placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="ui-select-chevron" aria-hidden="true" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          align="start"
          className="ui-select-content"
          collisionPadding={8}
          position="popper"
          sideOffset={5}
        >
          <SelectPrimitive.ScrollUpButton className="ui-select-scroll-button">
            <ChevronUp aria-hidden="true" />
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className="ui-select-viewport">
            {options.map((option) => (
              <SelectPrimitive.Item
                className="ui-select-item"
                disabled={option.disabled}
                key={option.value}
                textValue={option.label}
                value={option.value}
              >
                <span className="ui-select-item-indicator-slot" aria-hidden="true">
                  <SelectPrimitive.ItemIndicator className="ui-select-item-indicator">
                    <Check />
                  </SelectPrimitive.ItemIndicator>
                </span>
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="ui-select-scroll-button">
            <ChevronDown aria-hidden="true" />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
