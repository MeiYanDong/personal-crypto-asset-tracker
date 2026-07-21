import type {
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes
} from "react";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Check, Minus, Search, X } from "lucide-react";
import { cx } from "./utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export function Input({ className, invalid, ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cx("ui-input", className)}
      {...props}
    />
  );
}

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

type SearchFieldProps = Omit<InputProps, "type"> & {
  label: string;
  onClear?: () => void;
};

export function SearchField({ label, className, value, onClear, ...props }: SearchFieldProps) {
  const hasValue = typeof value === "string" && value.length > 0;
  return (
    <div className={cx("ui-search-field", className)}>
      <Search className="ui-field-icon" aria-hidden="true" />
      <input aria-label={label} type="search" value={value} {...props} />
      {hasValue && onClear ? (
        <button aria-label={`清除${label}`} className="ui-field-clear" type="button" onClick={onClear}>
          <X aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

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
};

export function Switch({ label, description, className, ...props }: SwitchProps) {
  return (
    <label className={cx("ui-switch", className)}>
      <input type="checkbox" role="switch" {...props} />
      <span className="ui-switch-track" aria-hidden="true"><span /></span>
      <span className="ui-switch-copy">
        <strong>{label}</strong>
        {description ? <small>{description}</small> : null}
      </span>
    </label>
  );
}
