import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type MouseEventHandler
} from "react";
import { Check, CircleX, Copy } from "lucide-react";
import { IconButton, type IconButtonProps } from "./Button";
import { Spinner } from "./Spinner";
import { cx } from "./utils";

export type CopyButtonStatus = "idle" | "copying" | "copied" | "error";

export type CopyButtonProps = Omit<
  IconButtonProps,
  "children" | "data-state" | "label" | "loading" | "loadingLabel" | "onClick" | "title"
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

export async function writeClipboardText(
  text: string,
  clipboard: Pick<Clipboard, "writeText"> | undefined = globalThis.navigator?.clipboard
) {
  if (!clipboard?.writeText) {
    throw new Error("Clipboard API is unavailable");
  }

  await clipboard.writeText(text);
}

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
  const [status, setStatus] = useState<CopyButtonStatus>("idle");
  const operationRef = useRef(0);
  const resetTimerRef = useRef<number | null>(null);

  function clearResetTimer() {
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  }

  function scheduleReset() {
    clearResetTimer();
    resetTimerRef.current = window.setTimeout(() => {
      setStatus("idle");
      resetTimerRef.current = null;
    }, Math.max(0, resetDelay));
  }

  useEffect(() => {
    operationRef.current += 1;
    clearResetTimer();
    setStatus("idle");

    return () => {
      operationRef.current += 1;
      clearResetTimer();
    };
  }, [text]);

  const handleClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    onClick?.(event);
    if (event.defaultPrevented) {
      return;
    }

    clearResetTimer();
    const operation = operationRef.current + 1;
    operationRef.current = operation;
    setStatus("copying");

    void writeClipboardText(text).then(
      () => {
        if (operation !== operationRef.current) {
          return;
        }
        setStatus("copied");
        scheduleReset();
        onCopied?.(text);
      },
      (error: unknown) => {
        if (operation !== operationRef.current) {
          return;
        }
        setStatus("error");
        scheduleReset();
        onCopyError?.(error);
      }
    );
  };

  const stateLabel = status === "copied"
    ? copiedLabel
    : status === "error"
      ? errorLabel
      : status === "copying"
        ? `${label}中`
        : label;

  return (
    <>
      <IconButton
        {...props}
        ref={ref}
        aria-busy={status === "copying" || undefined}
        aria-disabled={status === "copying" || undefined}
        className={cx("ui-copy-button", className)}
        data-state={status}
        data-slot={inheritedSlot ?? "copy-button"}
        disabled={disabled}
        label={label}
        onClick={handleClick}
        title={stateLabel}
      >
        {status === "copying"
          ? <Spinner decorative />
          : status === "copied"
            ? <Check />
            : status === "error"
              ? <CircleX />
              : <Copy />}
      </IconButton>
      <span aria-atomic="true" className="sr-only" data-slot="copy-status" role="status">
        {status === "copied" || status === "error" ? stateLabel : ""}
      </span>
    </>
  );
});
