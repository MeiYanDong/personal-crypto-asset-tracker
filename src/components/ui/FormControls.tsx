import type {
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes
} from "react";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Check, Minus, Search, X } from "lucide-react";
import { cx } from "./utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({
  className,
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
      data-slot="input"
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
  label,
  className,
  value,
  onClear,
  invalid = false,
  disabled,
  enterKeyHint = "search",
  ...props
}, forwardedRef) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasValue = value.length > 0;
  const hasClearAction = hasValue && Boolean(onClear) && !disabled;
  const ariaInvalid = invalid ? true : props["aria-invalid"];
  useImperativeHandle(forwardedRef, () => inputRef.current as HTMLInputElement, []);

  function clear() {
    onClear?.();
    window.requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
  }

  return (
    <div
      className={cx("ui-input-group", "ui-search-field", className)}
      data-disabled={disabled || undefined}
      data-has-value={hasValue || undefined}
      data-invalid={ariaInvalid || undefined}
      data-slot="input-group"
      data-component="search-field"
    >
      <input
        {...props}
        ref={inputRef}
        aria-invalid={ariaInvalid || undefined}
        aria-label={label}
        className="ui-input-group-control"
        disabled={disabled}
        enterKeyHint={enterKeyHint}
        type="search"
        value={value}
        data-slot="input-group-control"
      />
      <span
        aria-hidden="true"
        className="ui-input-group-addon ui-input-group-addon-start"
        data-align="inline-start"
        data-slot="input-group-addon"
      >
        <Search className="ui-field-icon" data-slot="input-group-icon" />
      </span>
      <span
        className="ui-input-group-addon ui-input-group-addon-end"
        data-align="inline-end"
        data-empty={!hasClearAction || undefined}
        data-slot="input-group-addon"
      >
        {hasClearAction ? (
          <button
            aria-label={`清除${label}`}
            className="ui-field-clear"
            data-slot="input-group-clear"
            type="button"
            onClick={clear}
            onMouseDown={(event) => event.preventDefault()}
          >
            <X aria-hidden="true" />
          </button>
        ) : null}
      </span>
    </div>
  );
});

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

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch({
  label,
  description,
  className,
  offLabel = "关闭",
  onLabel = "开启",
  disabled,
  ...props
}, ref) {
  return (
    <label
      className={cx("ui-switch", className)}
      data-disabled={disabled || undefined}
      data-has-description={Boolean(description) || undefined}
      data-invalid={props["aria-invalid"] || undefined}
      data-slot="switch"
    >
      <input
        {...props}
        ref={ref}
        data-slot="switch-control"
        disabled={disabled}
        type="checkbox"
        role="switch"
      />
      <span className="ui-switch-copy" data-slot="switch-copy">
        <strong data-slot="switch-label">{label}</strong>
        {description ? (
          <small data-slot="switch-description">{description}</small>
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
