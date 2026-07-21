import { createContext, useContext, useRef, type HTMLAttributes, type ReactNode } from "react";
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

type DialogProps = {
  children: ReactNode;
  className?: string;
  closeLabel?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  size?: "sm" | "md" | "lg";
};

export function Dialog({
  children,
  className,
  closeLabel = "关闭对话框",
  onOpenChange,
  open,
  size = "md"
}: DialogProps) {
  const returnFocusRef = useRef<HTMLElement | null>(null);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="ui-dialog-overlay" />
        <DialogPrimitive.Content
          className={cx("ui-dialog", `ui-dialog-${size}`, className)}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const trigger = returnFocusRef.current;
            returnFocusRef.current = null;
            if (trigger && document.contains(trigger)) {
              trigger.focus();
            }
          }}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            const content = event.currentTarget as HTMLElement | null;
            content?.querySelector<HTMLElement>("[data-dialog-initial-focus]")?.focus();
          }}
        >
          <DialogContext.Provider value={{ closeLabel }}>
            <div className="ui-dialog-layout">{children}</div>
          </DialogContext.Provider>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

type DialogHeaderProps = HTMLAttributes<HTMLElement> & {
  description: ReactNode;
  icon?: ReactNode;
  title: ReactNode;
};

export function DialogHeader({ className, description, icon, title, ...props }: DialogHeaderProps) {
  const { closeLabel } = useDialogContext();
  return (
    <header className={cx("ui-dialog-header", className)} {...props}>
      {icon ? <span className="ui-dialog-header-icon" aria-hidden="true">{icon}</span> : null}
      <div className="ui-dialog-heading">
        <DialogPrimitive.Title data-dialog-initial-focus tabIndex={-1}>{title}</DialogPrimitive.Title>
        <DialogPrimitive.Description>{description}</DialogPrimitive.Description>
      </div>
      <DialogPrimitive.Close asChild>
        <IconButton label={closeLabel} size="sm" tooltip={false} variant="ghost">
          <X aria-hidden="true" />
        </IconButton>
      </DialogPrimitive.Close>
    </header>
  );
}

export function DialogBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("ui-dialog-body", className)} {...props} />;
}

type DialogFooterProps = HTMLAttributes<HTMLElement> & {
  meta?: ReactNode;
};

export function DialogFooter({ children, className, meta, ...props }: DialogFooterProps) {
  return (
    <footer className={cx("ui-dialog-footer", className)} {...props}>
      <div className="ui-dialog-footer-meta">{meta}</div>
      <div className="ui-dialog-footer-actions">{children}</div>
    </footer>
  );
}
