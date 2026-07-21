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
      disabled={disabled}
    />
  );
});

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx("ui-textarea", className)} {...props} />;
}

export const LineTextarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function LineTextarea({
    className,
    defaultValue,
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
    const invalid = props["aria-invalid"] === true || props["aria-invalid"] === "true";

    return (
      <div
        className="ui-line-textarea"
        data-disabled={props.disabled || undefined}
        data-invalid={invalid || undefined}
      >
        <div className="ui-line-textarea-gutter" aria-hidden="true">
          <div
            className="ui-line-textarea-lines"
            style={{ transform: `translateY(${-scrollTop}px)` }}
          >
            {Array.from({ length: lineCount }, (_, index) => (
              <span className="ui-line-textarea-line" key={index + 1}>{index + 1}</span>
            ))}
          </div>
        </div>
        <textarea
          {...props}
          ref={ref}
          className={cx("ui-textarea", "ui-line-textarea-input", className)}
          defaultValue={defaultValue}
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
        <Search className="ui-field-icon" />
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

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  indeterminate?: boolean;
  label?: ReactNode;
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className, indeterminate = false, ...props },
  forwardedRef
) {
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(forwardedRef, () => inputRef.current as HTMLInputElement, []);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <label className={cx("ui-checkbox", Boolean(label) && "ui-checkbox-labelled", className)}>
      <input
        {...props}
        ref={inputRef}
        aria-checked={indeterminate ? "mixed" : props["aria-checked"]}
        type="checkbox"
      />
      <span className="ui-checkbox-box" aria-hidden="true">
        {indeterminate ? <Minus /> : <Check />}
      </span>
      {label ? <span className="ui-checkbox-label">{label}</span> : null}
    </label>
  );
});

type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
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
  ...props
}, ref) {
  return (
    <label className={cx("ui-switch", className)}>
      <input {...props} ref={ref} type="checkbox" role="switch" />
      <span className="ui-switch-copy">
        <strong>{label}</strong>
        {description ? <small>{description}</small> : null}
      </span>
      <span className="ui-switch-control" aria-hidden="true">
        <span className="ui-switch-state">
          <span className="ui-switch-state-off">{offLabel}</span>
          <span className="ui-switch-state-on">{onLabel}</span>
        </span>
        <span className="ui-switch-track"><span /></span>
      </span>
    </label>
  );
});
