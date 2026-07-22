import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type MouseEventHandler,
  type ReactNode
} from "react";
import { Check, CircleX } from "lucide-react";
import { IconButton, type IconButtonProps } from "./Button";
import { Spinner } from "./Spinner";
import { cx } from "./utils";

export type AsyncActionStatus = "idle" | "pending" | "success" | "error";

export type AsyncActionStateNames = Partial<Record<AsyncActionStatus, string>>;

export type AsyncIconButtonProps = Omit<
  IconButtonProps,
  "children" | "data-state" | "label" | "loading" | "loadingLabel" | "onClick" | "title"
> & {
  action: () => Promise<void> | void;
  errorIcon?: ReactNode;
  errorLabel: string;
  idleIcon: ReactNode;
  label: string;
  onActionError?: (error: unknown) => void;
  onActionSuccess?: () => void;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  pendingLabel: string;
  resetDelay?: number;
  resetKey?: unknown;
  statusSlot?: string;
  stateNames?: AsyncActionStateNames;
  successIcon?: ReactNode;
  successLabel: string;
};

export const AsyncIconButton = forwardRef<HTMLButtonElement, AsyncIconButtonProps>(
  function AsyncIconButton({
    action,
    className,
    "data-slot": inheritedSlot,
    disabled,
    errorIcon = <CircleX />,
    errorLabel,
    idleIcon,
    label,
    onActionError,
    onActionSuccess,
    onClick,
    pendingLabel,
    resetDelay = 1800,
    resetKey,
    statusSlot = "async-action-status",
    stateNames,
    successIcon = <Check />,
    successLabel,
    ...props
  }, ref) {
    const [status, setStatus] = useState<AsyncActionStatus>("idle");
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
    }, [resetKey]);

    const handleClick: MouseEventHandler<HTMLButtonElement> = (event) => {
      onClick?.(event);
      if (event.defaultPrevented) {
        return;
      }

      clearResetTimer();
      const operation = operationRef.current + 1;
      operationRef.current = operation;
      setStatus("pending");

      let actionResult: Promise<void> | void;
      try {
        actionResult = action();
      } catch (error) {
        setStatus("error");
        scheduleReset();
        onActionError?.(error);
        return;
      }

      void Promise.resolve(actionResult).then(
        () => {
          if (operation !== operationRef.current) {
            return;
          }
          setStatus("success");
          scheduleReset();
          onActionSuccess?.();
        },
        (error: unknown) => {
          if (operation !== operationRef.current) {
            return;
          }
          setStatus("error");
          scheduleReset();
          onActionError?.(error);
        }
      );
    };

    const stateLabel = status === "success"
      ? successLabel
      : status === "error"
        ? errorLabel
        : status === "pending"
          ? pendingLabel
          : label;
    const icon = status === "pending"
      ? <Spinner decorative />
      : status === "success"
        ? successIcon
        : status === "error"
          ? errorIcon
          : idleIcon;
    const dataState = stateNames?.[status] ?? status;

    return (
      <>
        <IconButton
          {...props}
          ref={ref}
          aria-busy={status === "pending" || undefined}
          aria-disabled={status === "pending" || undefined}
          className={cx("ui-async-icon-button", className)}
          data-action-state={status}
          data-state={dataState}
          data-slot={inheritedSlot ?? "async-icon-button"}
          disabled={disabled}
          label={label}
          onClick={handleClick}
          title={stateLabel}
        >
          {icon}
        </IconButton>
        <span aria-atomic="true" className="sr-only" data-slot={statusSlot} role="status">
          {status === "success" || status === "error" ? stateLabel : ""}
        </span>
      </>
    );
  }
);
