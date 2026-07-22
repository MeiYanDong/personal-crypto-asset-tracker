import {
  createContext,
  forwardRef,
  useContext,
  useRef,
  type HTMLAttributes,
  type ReactNode
} from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { IconButton } from "./Button";
import { cx } from "./utils";

type DialogContextValue = {
  closeLabel: string;
};

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("Dialog components must be rendered inside Dialog.");
  }
  return context;
}

export type DialogInitialFocus = "heading" | "first-control";
export type DialogSize = "sm" | "md" | "lg";

export type DialogProps = {
  children: ReactNode;
  className?: string;
  closeLabel?: string;
  fallbackFocusIds?: string[];
  initialFocus?: DialogInitialFocus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  size?: DialogSize;
};

const bodyFocusableControlSelector = [
  "button:not(:disabled)",
  "[href]",
  "input:not(:disabled):not([type='hidden'])",
  "select:not(:disabled)",
  "textarea:not(:disabled)",
  "[tabindex]:not([tabindex='-1'])"
].map((selector) => `[data-slot="dialog-body"] ${selector}`).join(",");

export const Dialog = forwardRef<HTMLDivElement, DialogProps>(function Dialog({
  children,
  className,
  closeLabel = "关闭对话框",
  fallbackFocusIds = [],
  initialFocus = "heading",
  onOpenChange,
  open,
  size = "md"
}, forwardedRef) {
  const returnFocusRef = useRef<HTMLElement | null>(null);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="ui-dialog-overlay" data-slot="dialog-overlay" />
        <DialogPrimitive.Content
          aria-modal="true"
          className={cx("ui-dialog", `ui-dialog-${size}`, className)}
          data-size={size}
          data-slot="dialog-content"
          ref={forwardedRef}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const trigger = returnFocusRef.current;
            returnFocusRef.current = null;
            if (trigger && document.contains(trigger)) {
              trigger.focus();
              return;
            }
            const fallback = fallbackFocusIds
              .map((id) => document.getElementById(id))
              .find((element): element is HTMLElement => Boolean(element?.getClientRects().length));
            fallback?.focus();
          }}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            const content = event.currentTarget as HTMLElement | null;
            const explicitTarget = content?.querySelector<HTMLElement>("[data-dialog-initial-focus]");
            const firstControl = initialFocus === "first-control"
              ? content?.querySelector<HTMLElement>(bodyFocusableControlSelector)
              : null;
            const title = content?.querySelector<HTMLElement>("[data-slot='dialog-title']");
            (explicitTarget || firstControl || title)?.focus({ preventScroll: true });
          }}
        >
          <DialogContext.Provider value={{ closeLabel }}>
            <div className="ui-dialog-layout" data-slot="dialog-layout">{children}</div>
          </DialogContext.Provider>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
});

export type DialogHeaderProps = HTMLAttributes<HTMLElement> & {
  description: ReactNode;
  icon?: ReactNode;
  title: ReactNode;
};

export const DialogHeader = forwardRef<HTMLElement, DialogHeaderProps>(function DialogHeader(
  { className, description, icon, title, ...props },
  forwardedRef
) {
  const { closeLabel } = useDialogContext();
  return (
    <header className={cx("ui-dialog-header", className)} data-slot="dialog-header" ref={forwardedRef} {...props}>
      {icon ? <span className="ui-dialog-header-icon" data-slot="dialog-icon" aria-hidden="true">{icon}</span> : null}
      <div className="ui-dialog-heading" data-slot="dialog-heading">
        <DialogPrimitive.Title data-slot="dialog-title" tabIndex={-1}>{title}</DialogPrimitive.Title>
        <DialogPrimitive.Description data-slot="dialog-description">{description}</DialogPrimitive.Description>
      </div>
      <DialogPrimitive.Close asChild>
        <IconButton data-slot="dialog-close" label={closeLabel} size="sm" tooltip={false} variant="ghost">
          <X aria-hidden="true" />
        </IconButton>
      </DialogPrimitive.Close>
    </header>
  );
});

export type DialogBodyProps = HTMLAttributes<HTMLDivElement>;

export const DialogBody = forwardRef<HTMLDivElement, DialogBodyProps>(function DialogBody(
  { className, ...props },
  forwardedRef
) {
  return <div className={cx("ui-dialog-body", className)} data-slot="dialog-body" ref={forwardedRef} {...props} />;
});

export type DialogFooterProps = HTMLAttributes<HTMLElement> & {
  meta?: ReactNode;
};

export const DialogFooter = forwardRef<HTMLElement, DialogFooterProps>(function DialogFooter(
  { children, className, meta, ...props },
  forwardedRef
) {
  return (
    <footer className={cx("ui-dialog-footer", className)} data-slot="dialog-footer" ref={forwardedRef} {...props}>
      <div className="ui-dialog-footer-meta" data-slot="dialog-footer-meta">{meta}</div>
      <div className="ui-dialog-footer-actions" data-slot="dialog-footer-actions">{children}</div>
    </footer>
  );
});
