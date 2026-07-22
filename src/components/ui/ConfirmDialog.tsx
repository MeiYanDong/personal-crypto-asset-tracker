import { forwardRef, useEffect, useRef, useState, type ReactNode } from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { CircleX, Trash2 } from "lucide-react";
import { Button } from "./Button";
import { cx } from "./utils";

function focusElement(element: HTMLElement | null | undefined) {
  if (
    !element ||
    !document.contains(element) ||
    element.matches(":disabled, [aria-disabled='true'], [hidden]") ||
    element.closest("[inert]") ||
    element.getClientRects().length === 0
  ) {
    return false;
  }
  element.focus({ preventScroll: true });
  return document.activeElement === element;
}

export type ConfirmDialogProps = {
  actionIcon?: ReactNode;
  cancelLabel?: string;
  children?: ReactNode;
  className?: string;
  confirmLabel: string;
  description: ReactNode;
  failureMessage?: ReactNode;
  fallbackFocusIds?: string[];
  icon?: ReactNode;
  onConfirm: () => boolean | void | Promise<boolean | void>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  pendingLabel?: string;
  title: ReactNode;
};

type ConfirmDialogStatus = "idle" | "pending" | "error";

export const ConfirmDialog = forwardRef<HTMLDivElement, ConfirmDialogProps>(function ConfirmDialog({
  actionIcon,
  cancelLabel = "取消",
  children,
  className,
  confirmLabel,
  description,
  failureMessage = "操作未完成，请检查后重试。",
  fallbackFocusIds = [],
  icon,
  onConfirm,
  onOpenChange,
  open,
  pendingLabel = "正在处理",
  title
}, forwardedRef) {
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const fallbackFocusIdsRef = useRef<string[]>([]);
  const operationRef = useRef(0);
  const [status, setStatus] = useState<ConfirmDialogStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<ReactNode>(null);
  const pending = status === "pending";

  useEffect(() => {
    if (open) {
      return;
    }

    operationRef.current += 1;
    setStatus("idle");
    setErrorMessage(null);
  }, [open]);

  useEffect(() => () => {
    operationRef.current += 1;
  }, []);

  async function confirm() {
    if (pending) {
      return;
    }

    const operation = operationRef.current + 1;
    operationRef.current = operation;
    setStatus("pending");
    setErrorMessage(null);

    try {
      const result = await onConfirm();
      if (operationRef.current !== operation) {
        return;
      }
      if (result === false) {
        setStatus("error");
        setErrorMessage(failureMessage);
        return;
      }

      setStatus("idle");
      onOpenChange(false);
    } catch (error) {
      if (operationRef.current !== operation) {
        return;
      }
      setStatus("error");
      setErrorMessage(error instanceof Error && error.message ? error.message : failureMessage);
    }
  }

  return (
    <AlertDialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!pending || nextOpen) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="ui-confirm-overlay" data-slot="confirm-overlay" />
        <AlertDialogPrimitive.Content
          aria-busy={pending || undefined}
          aria-modal="true"
          className={cx("ui-confirm-dialog", className)}
          data-confirm-state={status}
          data-has-body={Boolean(children) || undefined}
          data-slot="confirm-content"
          data-status={status}
          ref={forwardedRef}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const trigger = returnFocusRef.current;
            const fallbackIds = fallbackFocusIdsRef.current;
            returnFocusRef.current = null;
            fallbackFocusIdsRef.current = [];

            queueMicrotask(() => {
              if (focusElement(trigger)) {
                return;
              }
              for (const id of fallbackIds) {
                const fallback = document.getElementById(id);
                if (fallback instanceof HTMLElement && focusElement(fallback)) {
                  return;
                }
              }
            });
          }}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            fallbackFocusIdsRef.current = [...fallbackFocusIds];
            const content = event.currentTarget as HTMLElement | null;
            focusElement(content?.querySelector<HTMLElement>("[data-slot='confirm-cancel']"));
          }}
          onEscapeKeyDown={(event) => {
            if (pending) {
              event.preventDefault();
            }
          }}
        >
          <div className="ui-confirm-layout" data-slot="confirm-layout">
            <header className="ui-confirm-header" data-slot="confirm-header">
              <span className="ui-confirm-header-icon" data-slot="confirm-icon" aria-hidden="true">
                {icon || <Trash2 />}
              </span>
              <div data-slot="confirm-heading">
                <AlertDialogPrimitive.Title data-slot="confirm-title">{title}</AlertDialogPrimitive.Title>
                <AlertDialogPrimitive.Description data-slot="confirm-description">
                  {description}
                </AlertDialogPrimitive.Description>
              </div>
            </header>
            {children ? <div className="ui-confirm-body" data-slot="confirm-body">{children}</div> : null}
            {status === "error" ? (
              <div
                aria-atomic="true"
                className="ui-confirm-error"
                data-slot="confirm-error"
                role="alert"
              >
                <CircleX aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            ) : null}
            <footer className="ui-confirm-footer" data-slot="confirm-footer">
              <AlertDialogPrimitive.Cancel asChild>
                <Button data-slot="confirm-cancel" disabled={pending} variant="secondary">{cancelLabel}</Button>
              </AlertDialogPrimitive.Cancel>
              <Button
                data-slot="confirm-action"
                loading={pending}
                loadingLabel={pendingLabel}
                preserveFocusOnLoading
                variant="destructive"
                onClick={() => void confirm()}
              >
                {actionIcon || <Trash2 aria-hidden="true" />}
                {confirmLabel}
              </Button>
            </footer>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
});
