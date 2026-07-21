import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";

export type IdentityMarkKind = "icon" | "text";

export type IdentityMarkProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  kind: IdentityMarkKind;
};

export const IdentityMark = forwardRef<HTMLSpanElement, IdentityMarkProps>(
  function IdentityMark({ children, className, kind, ...props }, ref) {
    return (
      <span
        className={cx("ui-identity-mark", className)}
        data-kind={kind}
        data-slot="identity-mark"
        ref={ref}
        {...props}
      >
        <span data-slot="identity-mark-glyph">{children}</span>
      </span>
    );
  }
);
