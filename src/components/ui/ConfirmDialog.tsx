import { forwardRef, useEffect, useRef, useState, type ReactNode } from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { CircleX, Trash2 } from "lucide-react";
import { Button } from "./Button";
import { focusElement, focusReturnTarget } from "./focus";
import { cx } from "./utils";

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

export type ConfirmDialogImpactItem = {
  label: string;
  value: ReactNode;
};

type ConfirmDialogImpactProps = {
  ariaLabel?: string;
  className?: string;
  items: ConfirmDialogImpactItem[];
};

export function ConfirmDialogImpact({
  ariaLabel = "操作影响",
  className,
  items
}: ConfirmDialogImpactProps) {
  return (
    <dl
      aria-label={ariaLabel}
      className={cx("ui-confirm-impact", className)}
      data-slot="confirm-impact"
    >
      {items.map((item) => (
        <div data-slot="confirm-impact-item" key={item.label}>
          <dt data-slot="confirm-impact-label">{item.label}</dt>
          <dd data-slot="confirm-impact-value">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

type ConfirmDialogTargetProps = {
  ariaLabel?: string;
  className?: string;
  marker?: ReactNode;
  name: ReactNode;
  value: ReactNode;
};

export function ConfirmDialogTarget({
  ariaLabel = "操作目标",
  className,
  marker,
  name,
  value
}: ConfirmDialogTargetProps) {
  return (
    <div
      aria-label={ariaLabel}
      className={cx("ui-confirm-target", className)}
      data-slot="confirm-target"
      role="group"
    >
      <div data-slot="confirm-target-heading">
        {marker}
        <strong data-slot="confirm-target-name">{name}</strong>
      </div>
      <code data-slot="confirm-target-value">{value}</code>
    </div>
  );
}

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
            returnFocusRef.current = focusReturnTarget(document.activeElement);
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
