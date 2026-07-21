import { forwardRef, useRef, type ReactNode } from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { Trash2 } from "lucide-react";
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
  fallbackFocusIds?: string[];
  icon?: ReactNode;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: ReactNode;
};

export const ConfirmDialog = forwardRef<HTMLDivElement, ConfirmDialogProps>(function ConfirmDialog({
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
}, forwardedRef) {
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const fallbackFocusIdsRef = useRef<string[]>([]);

  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="ui-confirm-overlay" data-slot="confirm-overlay" />
        <AlertDialogPrimitive.Content
          aria-modal="true"
          className={cx("ui-confirm-dialog", className)}
          data-has-body={Boolean(children) || undefined}
          data-slot="confirm-content"
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
            <footer className="ui-confirm-footer" data-slot="confirm-footer">
              <AlertDialogPrimitive.Cancel asChild>
                <Button data-slot="confirm-cancel" variant="secondary">{cancelLabel}</Button>
              </AlertDialogPrimitive.Cancel>
              <AlertDialogPrimitive.Action asChild>
                <Button data-slot="confirm-action" variant="destructive" onClick={onConfirm}>
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
});
