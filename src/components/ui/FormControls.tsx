import type {
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes
} from "react";
import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from "react";
import { Check, Eye, EyeOff, KeyRound, Minus, Search, X } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput
} from "./InputGroup";
import { cx } from "./utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  "data-slot"?: string;
  invalid?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({
  className,
  "data-slot": inheritedSlot,
  invalid = false,
  disabled,
  ...props
}, ref) {
  const ariaInvalid = invalid ? true : props["aria-invalid"];

  return (
    <input
      {...props}
      ref={ref}
      aria-invalid={ariaInvalid || undefined}
      className={cx("ui-input", className)}
      data-disabled={disabled || undefined}
      data-invalid={ariaInvalid || undefined}
      data-slot={inheritedSlot ?? "input"}
      disabled={disabled}
    />
  );
});

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({
  className,
  invalid = false,
  disabled,
  ...props
}, ref) {
  const ariaInvalid = invalid ? true : props["aria-invalid"];

  return (
    <textarea
      {...props}
      ref={ref}
      aria-invalid={ariaInvalid || undefined}
      className={cx("ui-textarea", className)}
      data-disabled={disabled || undefined}
      data-invalid={ariaInvalid || undefined}
      data-slot="textarea"
      disabled={disabled}
    />
  );
});

export type LineTextareaProps = TextareaProps & {
  containerClassName?: string;
};

export const LineTextarea = forwardRef<HTMLTextAreaElement, LineTextareaProps>(
  function LineTextarea({
    className,
    containerClassName,
    defaultValue,
    disabled,
    invalid = false,
    onChange,
    onScroll,
    placeholder,
    value,
    wrap = "off",
    ...props
  }, ref) {
    const [scrollTop, setScrollTop] = useState(0);
    const [uncontrolledValue, setUncontrolledValue] = useState(() => String(defaultValue ?? ""));
    const content = value === undefined ? uncontrolledValue : String(value);
    const referenceText = content || String(placeholder || "");
    const lineCount = Math.max(1, referenceText.split("\n").length);
    const ariaInvalid = invalid ? true : props["aria-invalid"];
    const isInvalid = ariaInvalid === true || ariaInvalid === "true";

    return (
      <div
        className={cx("ui-line-textarea", containerClassName)}
        data-disabled={disabled || undefined}
        data-invalid={isInvalid || undefined}
        data-line-count={lineCount}
        data-slot="line-textarea"
      >
        <div
          className="ui-line-textarea-gutter"
          aria-hidden="true"
          data-slot="line-textarea-gutter"
        >
          <div
            className="ui-line-textarea-lines"
            data-slot="line-textarea-lines"
            style={{ transform: `translateY(${-scrollTop}px)` }}
          >
            {Array.from({ length: lineCount }, (_, index) => (
              <span
                className="ui-line-textarea-line"
                data-slot="line-textarea-line"
                key={index + 1}
              >
                {index + 1}
              </span>
            ))}
          </div>
        </div>
        <textarea
          {...props}
          ref={ref}
          aria-invalid={ariaInvalid || undefined}
          className={cx("ui-textarea", "ui-line-textarea-input", className)}
          data-disabled={disabled || undefined}
          data-invalid={ariaInvalid || undefined}
          data-slot="line-textarea-control"
          defaultValue={defaultValue}
          disabled={disabled}
          onChange={(event) => {
            if (value === undefined) {
              setUncontrolledValue(event.currentTarget.value);
            }
            onChange?.(event);
          }}
          onScroll={(event) => {
            setScrollTop(event.currentTarget.scrollTop);
            onScroll?.(event);
          }}
          placeholder={placeholder}
          value={value}
          wrap={wrap}
        />
      </div>
    );
  }
);

export type SearchFieldProps = Omit<InputProps, "defaultValue" | "type" | "value"> & {
  label: string;
  onClear?: () => void;
  value: string;
};

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField({
  "aria-keyshortcuts": ariaKeyShortcuts,
  label,
  className,
  "data-slot": inheritedSlot,
  value,
  onClear,
  onKeyDown,
  invalid = false,
  disabled,
  enterKeyHint = "search",
  ...props
}, forwardedRef) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasValue = value.length > 0;
  const hasClearAction = hasValue && Boolean(onClear) && !disabled;
  const ariaInvalid = invalid ? true : props["aria-invalid"];
  const isInvalid = ariaInvalid === true
    || ariaInvalid === "true"
    || ariaInvalid === "grammar"
    || ariaInvalid === "spelling";
  const keyboardShortcuts = Array.from(new Set([
    ...(ariaKeyShortcuts?.split(/\s+/).filter(Boolean) || []),
    ...(hasClearAction ? ["Escape"] : [])
  ])).join(" ") || undefined;
  useImperativeHandle(forwardedRef, () => inputRef.current as HTMLInputElement, []);

  function clear() {
    onClear?.();
    window.requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
  }

  return (
    <InputGroup
      className={cx("ui-search-field", className)}
      data-has-value={hasValue || undefined}
      data-slot={inheritedSlot ?? "input-group"}
      data-component="search-field"
      disabled={disabled}
      invalid={isInvalid}
    >
      <InputGroupInput
        {...props}
        ref={inputRef}
        aria-invalid={ariaInvalid || undefined}
        aria-keyshortcuts={keyboardShortcuts}
        aria-label={label}
        disabled={disabled}
        enterKeyHint={enterKeyHint}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (
            event.defaultPrevented ||
            event.key !== "Escape" ||
            event.nativeEvent.isComposing ||
            !hasClearAction
          ) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          clear();
        }}
        type="search"
        value={value}
        data-slot="input-group-control"
      />
      <InputGroupAddon
        aria-hidden="true"
        data-slot="input-group-addon"
      >
        <Search className="ui-field-icon" data-slot="input-group-icon" />
      </InputGroupAddon>
      <InputGroupAddon
        align="inline-end"
        empty={!hasClearAction}
        data-slot="input-group-addon"
      >
        {hasClearAction ? (
          <InputGroupButton
            data-slot="input-group-clear"
            label={`清除${label}`}
            onClick={clear}
            onMouseDown={(event) => event.preventDefault()}
            variant="ghost"
          >
            <X aria-hidden="true" />
          </InputGroupButton>
        ) : null}
      </InputGroupAddon>
    </InputGroup>
  );
});

export type PasswordFieldProps = Omit<InputProps, "type"> & {
  hideLabel?: string;
  label: string;
  showLabel?: string;
};

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField({
    "aria-label": ariaLabel,
    autoCapitalize,
    autoCorrect,
    className,
    "data-slot": inheritedSlot,
    disabled,
    hideLabel = "隐藏访问口令",
    id,
    invalid = false,
    label,
    showLabel = "显示访问口令",
    spellCheck,
    ...props
  }, ref) {
    const generatedId = useId();
    const [revealed, setRevealed] = useState(false);
    const ariaInvalid = invalid ? true : props["aria-invalid"];
    const isInvalid = ariaInvalid === true
      || ariaInvalid === "true"
      || ariaInvalid === "grammar"
      || ariaInvalid === "spelling";
    const controlId = id?.trim() || `password-${generatedId}`;
    const controlLabel = ariaLabel?.trim() || label;
    const visibilityLabel = revealed ? hideLabel : showLabel;

    return (
      <InputGroup
        className={cx("ui-password-field", className)}
        data-component="password-field"
        data-revealed={revealed || undefined}
        data-slot={inheritedSlot ?? "password-field"}
        disabled={disabled}
        invalid={isInvalid}
      >
        <InputGroupInput
          {...props}
          ref={ref}
          aria-invalid={ariaInvalid || undefined}
          aria-label={controlLabel}
          autoCapitalize={autoCapitalize ?? "none"}
          autoCorrect={autoCorrect ?? "off"}
          data-slot="password-field-control"
          disabled={disabled}
          id={controlId}
          spellCheck={spellCheck ?? false}
          type={revealed ? "text" : "password"}
        />
        <InputGroupAddon
          aria-hidden="true"
          data-slot="password-field-addon"
        >
          <KeyRound className="ui-field-icon" data-slot="password-field-icon" />
        </InputGroupAddon>
        <InputGroupAddon
          align="inline-end"
          data-slot="password-field-addon"
        >
          <InputGroupButton
            aria-controls={controlId}
            data-component="password-field-toggle"
            data-state={revealed ? "visible" : "hidden"}
            disabled={disabled}
            label={visibilityLabel}
            onClick={() => setRevealed((current) => !current)}
            onMouseDown={(event) => event.preventDefault()}
            variant="ghost"
          >
            {revealed ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    );
  }
);

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  indeterminate?: boolean;
  label?: ReactNode;
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className, disabled, indeterminate = false, ...props },
  forwardedRef
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasLabel = Boolean(label);
  const ariaInvalid = props["aria-invalid"];
  useImperativeHandle(forwardedRef, () => inputRef.current as HTMLInputElement, []);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <label
      className={cx("ui-checkbox", hasLabel && "ui-checkbox-labelled", className)}
      data-disabled={disabled || undefined}
      data-indeterminate={indeterminate || undefined}
      data-invalid={ariaInvalid || undefined}
      data-labelled={hasLabel || undefined}
      data-slot="checkbox"
    >
      <input
        {...props}
        ref={inputRef}
        aria-checked={indeterminate ? "mixed" : props["aria-checked"]}
        data-slot="checkbox-control"
        disabled={disabled}
        type="checkbox"
      />
      <span className="ui-checkbox-box" aria-hidden="true" data-slot="checkbox-indicator">
        {indeterminate ? <Minus /> : <Check />}
      </span>
      {hasLabel ? (
        <span className="ui-checkbox-label" data-slot="checkbox-label">{label}</span>
      ) : null}
    </label>
  );
});

export type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: ReactNode;
  description?: ReactNode;
  offLabel?: ReactNode;
  onLabel?: ReactNode;
};

function mergeAriaIdRefs(...values: Array<string | undefined>) {
  const ids = values.flatMap((value) => value?.trim().split(/\s+/).filter(Boolean) ?? []);
  const uniqueIds = [...new Set(ids)];
  return uniqueIds.length ? uniqueIds.join(" ") : undefined;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch({
  label,
  description,
  className,
  offLabel = "关闭",
  onLabel = "开启",
  disabled,
  ...props
}, ref) {
  const generatedId = useId();
  const {
    "aria-describedby": ariaDescribedBy,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    id,
    ...inputProps
  } = props;
  const controlId = id ?? `switch-${generatedId}`;
  const labelId = `${controlId}-label`;
  const descriptionId = `${controlId}-description`;
  const hasDescription = Boolean(description);
  const resolvedLabelledBy = ariaLabelledBy?.trim()
    || (ariaLabel?.trim() ? undefined : labelId);
  const resolvedDescribedBy = mergeAriaIdRefs(
    ariaDescribedBy,
    hasDescription ? descriptionId : undefined
  );

  return (
    <label
      className={cx("ui-switch", className)}
      data-disabled={disabled || undefined}
      data-has-description={hasDescription || undefined}
      data-invalid={inputProps["aria-invalid"] || undefined}
      data-slot="switch"
    >
      <input
        {...inputProps}
        ref={ref}
        aria-describedby={resolvedDescribedBy}
        aria-label={ariaLabel}
        aria-labelledby={resolvedLabelledBy}
        data-slot="switch-control"
        disabled={disabled}
        id={controlId}
        type="checkbox"
        role="switch"
      />
      <span className="ui-switch-copy" data-slot="switch-copy">
        <strong data-slot="switch-label" id={labelId}>{label}</strong>
        {hasDescription ? (
          <small data-slot="switch-description" id={descriptionId}>{description}</small>
        ) : null}
      </span>
      <span className="ui-switch-control" aria-hidden="true" data-slot="switch-visual">
        <span className="ui-switch-state" data-slot="switch-state">
          <span className="ui-switch-state-off" data-slot="switch-state-off">{offLabel}</span>
          <span className="ui-switch-state-on" data-slot="switch-state-on">{onLabel}</span>
        </span>
        <span className="ui-switch-track" data-slot="switch-track">
          <span className="ui-switch-thumb" data-slot="switch-thumb" />
        </span>
      </span>
    </label>
  );
});
