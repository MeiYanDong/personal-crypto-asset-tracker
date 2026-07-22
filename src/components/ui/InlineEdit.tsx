import {
  forwardRef,
  type FormEvent,
  type FormHTMLAttributes
} from "react";
import { Check, X } from "lucide-react";
import { IconButton, type ButtonSize } from "./Button";
import { Input, type InputProps } from "./FormControls";
import { cx } from "./utils";

export type InlineEditProps = Omit<FormHTMLAttributes<HTMLFormElement>, "children" | "onSubmit"> & {
  actionSize?: ButtonSize;
  actionsLabel?: string;
  cancelLabel: string;
  inputLabel: string;
  inputProps?: Omit<InputProps, "aria-label" | "onChange" | "value">;
  onCancel: () => void;
  onSave: () => void;
  onValueChange: (value: string) => void;
  saveLabel: string;
  value: string;
};

export const InlineEdit = forwardRef<HTMLFormElement, InlineEditProps>(function InlineEdit({
  actionSize = "xs",
  actionsLabel,
  cancelLabel,
  className,
  inputLabel,
  inputProps,
  onCancel,
  onKeyDown,
  onSave,
  onValueChange,
  saveLabel,
  value,
  ...props
}, ref) {
  const { className: inputClassName, ...restInputProps } = inputProps || {};

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave();
  }

  return (
    <form
      {...props}
      ref={ref}
      className={cx("ui-inline-edit", className)}
      data-empty={!value.trim() || undefined}
      data-slot="inline-edit"
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (
          event.defaultPrevented ||
          event.key !== "Escape" ||
          event.nativeEvent.isComposing
        ) {
          return;
        }
        event.preventDefault();
        onCancel();
      }}
      onSubmit={submit}
    >
      <Input
        {...restInputProps}
        autoFocus={inputProps?.autoFocus ?? true}
        aria-label={inputLabel}
        className={cx("ui-inline-edit-input", inputClassName)}
        data-slot="inline-edit-input"
        value={value}
        onChange={(event) => onValueChange(event.currentTarget.value)}
      />
      <div
        aria-label={actionsLabel || `${inputLabel}操作`}
        className="ui-inline-edit-actions"
        data-slot="inline-edit-actions"
        role="group"
      >
        <IconButton
          data-slot="inline-edit-save"
          label={saveLabel}
          size={actionSize}
          type="submit"
          variant="primary"
        >
          <Check aria-hidden="true" />
        </IconButton>
        <IconButton
          data-slot="inline-edit-cancel"
          label={cancelLabel}
          size={actionSize}
          variant="secondary"
          onClick={onCancel}
        >
          <X aria-hidden="true" />
        </IconButton>
      </div>
    </form>
  );
});
