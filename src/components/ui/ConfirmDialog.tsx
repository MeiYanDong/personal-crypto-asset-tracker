import { useRef, type ReactNode } from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { Trash2 } from "lucide-react";
import { Button } from "./Button";
import { cx } from "./utils";

type ConfirmDialogProps = {
  actionIcon?: ReactNode;
  cancelLabel?: string;
  children?: ReactNode;
  className?: string;
  confirmLabel: string;
  description: ReactNode;
  fallbackFocusIds?: string[];
  icon?: ReactNode;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: ReactNode;
};

export function ConfirmDialog({
  actionIcon,
  cancelLabel = "取消",
  children,
  className,
  confirmLabel,
  description,
  fallbackFocusIds = [],
  icon,
  onConfirm,
  onOpenChange,
  open,
  title
}: ConfirmDialogProps) {
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const fallbackFocusIdsRef = useRef<string[]>([]);

  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="ui-confirm-overlay" />
        <AlertDialogPrimitive.Content
          aria-modal="true"
          className={cx("ui-confirm-dialog", className)}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const trigger = returnFocusRef.current;
            const fallbackIds = fallbackFocusIdsRef.current;
            returnFocusRef.current = null;
            fallbackFocusIdsRef.current = [];

            queueMicrotask(() => {
              if (trigger && document.contains(trigger)) {
                trigger.focus();
                return;
              }
              for (const id of fallbackIds) {
                const fallback = document.getElementById(id);
                if (fallback instanceof HTMLElement) {
                  fallback.focus();
                  return;
                }
              }
            });
          }}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            fallbackFocusIdsRef.current = fallbackFocusIds;
            const content = event.currentTarget as HTMLElement | null;
            requestAnimationFrame(() => {
              content?.querySelector<HTMLElement>("[data-confirm-cancel]")?.focus();
            });
          }}
        >
          <div className="ui-confirm-layout">
            <header className="ui-confirm-header">
              <span className="ui-confirm-header-icon" aria-hidden="true">{icon || <Trash2 />}</span>
              <div>
                <AlertDialogPrimitive.Title>{title}</AlertDialogPrimitive.Title>
                <AlertDialogPrimitive.Description>{description}</AlertDialogPrimitive.Description>
              </div>
            </header>
            {children ? <div className="ui-confirm-body">{children}</div> : null}
            <footer className="ui-confirm-footer">
              <AlertDialogPrimitive.Cancel asChild>
                <Button data-confirm-cancel variant="secondary">{cancelLabel}</Button>
              </AlertDialogPrimitive.Cancel>
              <AlertDialogPrimitive.Action asChild>
                <Button variant="destructive" onClick={onConfirm}>
                  {actionIcon || <Trash2 aria-hidden="true" />}
                  {confirmLabel}
                </Button>
              </AlertDialogPrimitive.Action>
            </footer>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
