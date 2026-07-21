import { forwardRef, type HTMLAttributes, type LabelHTMLAttributes } from "react";
import { CircleAlert } from "lucide-react";
import { cx } from "./utils";

export type FieldProps = HTMLAttributes<HTMLDivElement> & {
  invalid?: boolean;
};

export const Field = forwardRef<HTMLDivElement, FieldProps>(function Field({
  className,
  invalid = false,
  ...props
}, ref) {
  return (
    <div
      {...props}
      ref={ref}
      className={cx("ui-field", className)}
      data-invalid={invalid || undefined}
      data-slot="field"
    />
  );
});

export type FieldHeaderProps = HTMLAttributes<HTMLDivElement>;

export const FieldHeader = forwardRef<HTMLDivElement, FieldHeaderProps>(function FieldHeader(
  { className, ...props },
  ref
) {
  return <div {...props} ref={ref} className={cx("ui-field-header", className)} data-slot="field-header" />;
});

export type FieldLabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export const FieldLabel = forwardRef<HTMLLabelElement, FieldLabelProps>(function FieldLabel(
  { className, ...props },
  ref
) {
  return <label {...props} ref={ref} className={cx("ui-field-label", className)} data-slot="field-label" />;
});

export type FieldDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

export const FieldDescription = forwardRef<HTMLParagraphElement, FieldDescriptionProps>(
  function FieldDescription({ className, ...props }, ref) {
    return (
      <p
        {...props}
        ref={ref}
        className={cx("ui-field-description", className)}
        data-slot="field-description"
      />
    );
  }
);

export type FieldErrorProps = HTMLAttributes<HTMLParagraphElement>;

export const FieldError = forwardRef<HTMLParagraphElement, FieldErrorProps>(function FieldError({
  className,
  children,
  role = "alert",
  ...props
}, ref) {
  return (
    <p
      {...props}
      ref={ref}
      className={cx("ui-field-error", className)}
      data-slot="field-error"
      role={role}
    >
      <CircleAlert aria-hidden="true" data-slot="field-error-icon" />
      <span data-slot="field-error-text">{children}</span>
    </p>
  );
});
