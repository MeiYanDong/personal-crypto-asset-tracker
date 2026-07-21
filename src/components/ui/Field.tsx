import type { HTMLAttributes, LabelHTMLAttributes } from "react";
import { CircleAlert } from "lucide-react";
import { cx } from "./utils";

type FieldProps = HTMLAttributes<HTMLDivElement> & {
  invalid?: boolean;
};

export function Field({ className, invalid = false, ...props }: FieldProps) {
  return (
    <div
      {...props}
      className={cx("ui-field", className)}
      data-invalid={invalid || undefined}
      role={props.role || "group"}
    />
  );
}

export function FieldHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("ui-field-header", className)} {...props} />;
}

export function FieldLabel({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cx("ui-field-label", className)} {...props} />;
}

export function FieldDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cx("ui-field-description", className)} {...props} />;
}

export function FieldError({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cx("ui-field-error", className)} role="alert" {...props}>
      <CircleAlert aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
