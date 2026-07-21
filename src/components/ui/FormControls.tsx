import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes
} from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
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

type NativeSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  icon?: ReactNode;
  containerClassName?: string;
};

export function NativeSelect({ icon, className, containerClassName, children, ...props }: NativeSelectProps) {
  return (
    <label className={cx("ui-select-field", Boolean(icon) && "has-leading-icon", containerClassName)}>
      {icon ? <span className="ui-select-leading" aria-hidden="true">{icon}</span> : null}
      <select className={cx("ui-native-select", className)} {...props}>
        {children}
      </select>
      <ChevronDown className="ui-select-chevron" aria-hidden="true" />
    </label>
  );
}

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: ReactNode;
};

export function Checkbox({ label, className, ...props }: CheckboxProps) {
  return (
    <label className={cx("ui-checkbox", Boolean(label) && "ui-checkbox-labelled", className)}>
      <input type="checkbox" {...props} />
      <span className="ui-checkbox-box" aria-hidden="true"><Check /></span>
      {label ? <span className="ui-checkbox-label">{label}</span> : null}
    </label>
  );
}

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
