import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "./utils";

type IdentityMarkProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
};

export function IdentityMark({ children, className, ...props }: IdentityMarkProps) {
  return (
    <span className={cx("ui-identity-mark", className)} {...props}>
      <span className="ui-identity-mark-glyph">{children}</span>
    </span>
  );
}
