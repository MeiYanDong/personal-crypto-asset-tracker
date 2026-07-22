import { forwardRef, type MouseEventHandler } from "react";
import { Copy } from "lucide-react";
import { AsyncIconButton, type AsyncIconButtonProps } from "./AsyncIconButton";
import { writeClipboardText } from "./clipboard";
import { cx } from "./utils";

export type CopyButtonStatus = "idle" | "copying" | "copied" | "error";

export type CopyButtonProps = Omit<
  AsyncIconButtonProps,
  | "action"
  | "errorIcon"
  | "errorLabel"
  | "idleIcon"
  | "label"
  | "onActionError"
  | "onActionSuccess"
  | "onClick"
  | "pendingLabel"
  | "resetKey"
  | "stateNames"
  | "statusSlot"
  | "successIcon"
  | "successLabel"
> & {
  copiedLabel?: string;
  errorLabel?: string;
  label?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  onCopied?: (text: string) => void;
  onCopyError?: (error: unknown) => void;
  resetDelay?: number;
  text: string;
};

export const CopyButton = forwardRef<HTMLButtonElement, CopyButtonProps>(function CopyButton({
  className,
  copiedLabel = "已复制",
  "data-slot": inheritedSlot,
  disabled,
  errorLabel = "复制失败",
  label = "复制",
  onClick,
  onCopied,
  onCopyError,
  resetDelay = 1800,
  text,
  ...props
}, ref) {
  return (
    <AsyncIconButton
      {...props}
      ref={ref}
      action={() => writeClipboardText(text)}
      className={cx("ui-copy-button", className)}
      data-slot={inheritedSlot ?? "copy-button"}
      disabled={disabled}
      errorLabel={errorLabel}
      idleIcon={<Copy />}
      label={label}
      onActionError={onCopyError}
      onActionSuccess={() => onCopied?.(text)}
      onClick={onClick}
      pendingLabel={`正在${label}`}
      resetDelay={resetDelay}
      resetKey={text}
      stateNames={{ pending: "copying", success: "copied" }}
      statusSlot="copy-status"
      successLabel={copiedLabel}
    />
  );
});
