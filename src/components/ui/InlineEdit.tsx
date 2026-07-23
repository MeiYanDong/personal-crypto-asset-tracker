import {
  forwardRef,
  useId,
  useRef,
  type FormEvent,
  type FormHTMLAttributes,
  type ReactNode
} from "react";
import { Check, CircleAlert, X } from "lucide-react";
import { IconButton, type ButtonSize } from "./Button";
import { ButtonGroup } from "./ButtonGroup";
import { Input, type InputProps } from "./FormControls";
import { cx } from "./utils";

export type InlineEditProps = Omit<FormHTMLAttributes<HTMLFormElement>, "children" | "onSubmit"> & {
  actionSize?: ButtonSize;
  actionsLabel?: string;
  cancelLabel: string;
  emptyMessage?: ReactNode;
  externallyDirty?: boolean;
  inputLabel: string;
  inputProps?: Omit<InputProps, "aria-label" | "onChange" | "value">;
  onCancel: () => void;
  onSave: () => boolean | void;
  onValueChange: (value: string) => void;
  originalValue?: string;
  returnFocusId?: string;
  saveLabel: string;
  value: string;
};

function keyboardShortcutsWithEscape(shortcuts?: string) {
  return Array.from(new Set([...(shortcuts || "").split(/\s+/).filter(Boolean), "Escape"])).join(" ");
}

function returnFocus(id?: string) {
  if (!id) {
    return;
  }

  window.requestAnimationFrame(() => {
    const target = document.getElementById(id);
    if (
      target instanceof HTMLElement &&
      !target.matches(":disabled, [aria-disabled='true'], [hidden]") &&
      target.getClientRects().length > 0
    ) {
      target.focus({ preventScroll: true });
    }
  });
}

export const InlineEdit = forwardRef<HTMLFormElement, InlineEditProps>(function InlineEdit({
  actionSize = "xs",
  actionsLabel,
  cancelLabel,
  className,
  emptyMessage = "请输入内容后保存",
  externallyDirty = false,
  inputLabel,
  inputProps,
  onCancel,
  onKeyDown,
  onSave,
  onValueChange,
  originalValue,
  returnFocusId,
  saveLabel,
  value,
  ...props
}, ref) {
  const {
    "aria-describedby": inheritedAriaDescribedBy,
    "aria-invalid": inheritedAriaInvalid,
    "aria-keyshortcuts": inheritedAriaKeyShortcuts,
    className: inputClassName,
    ...restInputProps
  } = inputProps || {};
  const trimmedValue = value.trim();
  const isEmpty = Boolean(inputProps?.required && !trimmedValue);
  const isInputInvalid = isEmpty || inheritedAriaInvalid === true || inheritedAriaInvalid === "true";
  const isUnchanged = !externallyDirty && originalValue !== undefined && trimmedValue === originalValue.trim();
  const isSaveDisabled = Boolean(inputProps?.disabled || isEmpty || isUnchanged);
  const state = isEmpty ? "invalid" : isUnchanged ? "unchanged" : "dirty";
  const saveDisabledReason = inputProps?.disabled
    ? "当前内容不可编辑"
    : isEmpty
      ? "请输入内容后保存"
      : isUnchanged
        ? "修改内容后保存"
        : undefined;
  const generatedId = useId();
  const emptyErrorId = `${generatedId}-empty-error`;
  const describedBy = [inheritedAriaDescribedBy, isEmpty ? emptyErrorId : undefined]
    .filter(Boolean)
    .join(" ") || undefined;
  const inputRef = useRef<HTMLInputElement>(null);

  function cancel() {
    onCancel();
    returnFocus(returnFocusId);
  }

  function save() {
    if (isSaveDisabled) {
      return;
    }
    const saved = onSave();
    if (saved === false) {
      inputRef.current?.focus({ preventScroll: true });
      return;
    }
    returnFocus(returnFocusId);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save();
  }

  return (
    <form
      {...props}
      ref={ref}
      className={cx("ui-inline-edit", className)}
      data-dirty={state === "dirty" || undefined}
      data-empty={!trimmedValue || undefined}
      data-invalid={state === "invalid" || undefined}
      data-slot="inline-edit"
      data-state={state}
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
        cancel();
      }}
      onSubmit={submit}
    >
      <Input
        {...restInputProps}
        ref={inputRef}
        autoFocus={inputProps?.autoFocus ?? true}
        aria-describedby={describedBy}
        aria-invalid={isInputInvalid || undefined}
        aria-keyshortcuts={keyboardShortcutsWithEscape(inheritedAriaKeyShortcuts)}
        aria-label={inputLabel}
        className={cx("ui-inline-edit-input", inputClassName)}
        data-slot="inline-edit-input"
        value={value}
        onChange={(event) => onValueChange(event.currentTarget.value)}
      />
      <ButtonGroup
        aria-label={actionsLabel || `${inputLabel}操作`}
        className="ui-inline-edit-actions"
        data-slot="inline-edit-actions"
      >
        <IconButton
          data-slot="inline-edit-save"
          disabled={isSaveDisabled}
          disabledReason={saveDisabledReason}
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
          onClick={cancel}
        >
          <X aria-hidden="true" />
        </IconButton>
      </ButtonGroup>
      {isEmpty ? (
        <span
          aria-atomic="true"
          className="ui-inline-edit-error"
          data-slot="inline-edit-error"
          id={emptyErrorId}
          role="alert"
        >
          <CircleAlert aria-hidden="true" />
          <span>{emptyMessage}</span>
        </span>
      ) : null}
    </form>
  );
});
