import {
  forwardRef,
  type HTMLAttributes,
  type InputHTMLAttributes
} from "react";
import { IconButton, type IconButtonProps } from "./Button";
import { cx } from "./utils";

export type InputGroupProps = HTMLAttributes<HTMLDivElement> & {
  "data-slot"?: string;
  disabled?: boolean;
  invalid?: boolean;
};

export const InputGroup = forwardRef<HTMLDivElement, InputGroupProps>(function InputGroup({
  className,
  "data-slot": inheritedSlot,
  disabled = false,
  invalid = false,
  ...props
}, ref) {
  return (
    <div
      {...props}
      ref={ref}
      className={cx("ui-input-group", className)}
      data-disabled={disabled || undefined}
      data-invalid={invalid || undefined}
      data-slot={inheritedSlot ?? "input-group"}
    />
  );
});

export type InputGroupInputProps = InputHTMLAttributes<HTMLInputElement> & {
  "data-slot"?: string;
  invalid?: boolean;
};

export const InputGroupInput = forwardRef<HTMLInputElement, InputGroupInputProps>(
  function InputGroupInput({
    "aria-invalid": ariaInvalid,
    className,
    "data-slot": inheritedSlot,
    disabled,
    invalid = false,
    ...props
  }, ref) {
    const resolvedAriaInvalid = invalid ? true : ariaInvalid;

    return (
      <input
        {...props}
        ref={ref}
        aria-invalid={resolvedAriaInvalid || undefined}
        className={cx("ui-input-group-control", className)}
        data-disabled={disabled || undefined}
        data-invalid={resolvedAriaInvalid || undefined}
        data-slot={inheritedSlot ?? "input-group-control"}
        disabled={disabled}
      />
    );
  }
);

export type InputGroupAddonAlign = "inline-start" | "inline-end";

export type InputGroupAddonProps = HTMLAttributes<HTMLSpanElement> & {
  "data-slot"?: string;
  align?: InputGroupAddonAlign;
  empty?: boolean;
};

export const InputGroupAddon = forwardRef<HTMLSpanElement, InputGroupAddonProps>(
  function InputGroupAddon({
    align = "inline-start",
    className,
    "data-slot": inheritedSlot,
    empty = false,
    ...props
  }, ref) {
    return (
      <span
        {...props}
        ref={ref}
        className={cx(
          "ui-input-group-addon",
          align === "inline-start" ? "ui-input-group-addon-start" : "ui-input-group-addon-end",
          className
        )}
        data-align={align}
        data-empty={empty || undefined}
        data-slot={inheritedSlot ?? "input-group-addon"}
      />
    );
  }
);

export type InputGroupButtonProps = Omit<IconButtonProps, "size">;

export const InputGroupButton = forwardRef<HTMLButtonElement, InputGroupButtonProps>(
  function InputGroupButton({ className, "data-slot": inheritedSlot, ...props }, ref) {
    return (
      <IconButton
        {...props}
        ref={ref}
        className={cx("ui-input-group-button", className)}
        data-slot={inheritedSlot ?? "input-group-button"}
        size="xs"
      />
    );
  }
);
