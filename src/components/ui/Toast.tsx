import { forwardRef, useCallback, useEffect, useRef } from "react";
import { AlertTriangle, CheckCircle2, CircleX, Info, X } from "lucide-react";
import { Toaster as SonnerToaster, toast, type ToasterProps } from "sonner";
import { Spinner } from "./Spinner";
import { cx } from "./utils";

export { toast };

export type ToastViewportProps = ToasterProps;

const defaultIcons: NonNullable<ToasterProps["icons"]> = {
  close: <X aria-hidden="true" />,
  error: <CircleX aria-hidden="true" />,
  info: <Info aria-hidden="true" />,
  loading: <Spinner decorative />,
  success: <CheckCircle2 aria-hidden="true" />,
  warning: <AlertTriangle aria-hidden="true" />
};

const defaultClassNames: NonNullable<NonNullable<ToasterProps["toastOptions"]>["classNames"]> = {
  actionButton: "portfolio-toast-action",
  cancelButton: "portfolio-toast-cancel",
  closeButton: "portfolio-toast-close",
  content: "portfolio-toast-content",
  default: "portfolio-toast-default",
  description: "portfolio-toast-description",
  error: "portfolio-toast-error",
  icon: "portfolio-toast-icon",
  info: "portfolio-toast-info",
  loader: "portfolio-toast-loader",
  loading: "portfolio-toast-loading",
  success: "portfolio-toast-success",
  title: "portfolio-toast-title",
  toast: "portfolio-toast",
  warning: "portfolio-toast-warning"
};

const defaultOffset: NonNullable<ToasterProps["offset"]> = {
  bottom: "max(18px, env(safe-area-inset-bottom, 0px))",
  right: "max(18px, env(safe-area-inset-right, 0px))"
};

const mobileSideOffset =
  "max(12px, env(safe-area-inset-left, 0px), env(safe-area-inset-right, 0px))";

const defaultMobileOffset: NonNullable<ToasterProps["mobileOffset"]> = {
  bottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
  left: mobileSideOffset,
  right: mobileSideOffset
};

export const ToastViewport = forwardRef<HTMLElement, ToastViewportProps>(
  function ToastViewport({ className, icons, mobileOffset, offset, toastOptions, ...props }, ref) {
    const { classNames, ...toastOptionOverrides } = toastOptions || {};
    const viewportRef = useRef<HTMLElement | null>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);
    const setViewportRef = useCallback(
      (node: HTMLElement | null) => {
        viewportRef.current = node;

        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref]
    );

    useEffect(() => {
      function handleFocusIn(event: FocusEvent) {
        const viewport = viewportRef.current;
        const focusTarget = event.target;
        const previousTarget = event.relatedTarget;

        if (
          viewport?.contains(focusTarget as Node) &&
          previousTarget instanceof HTMLElement &&
          !viewport.contains(previousTarget)
        ) {
          previousFocusRef.current = previousTarget;
        }
      }

      function handleKeyDown(event: KeyboardEvent) {
        const viewport = viewportRef.current;

        if (event.code !== "Escape" || !viewport?.contains(document.activeElement)) {
          return;
        }

        const previousFocus = previousFocusRef.current;
        window.requestAnimationFrame(() => {
          if (previousFocus?.isConnected) {
            previousFocus.focus({ preventScroll: true });
          }
          previousFocusRef.current = null;
        });
      }

      document.addEventListener("focusin", handleFocusIn, true);
      document.addEventListener("keydown", handleKeyDown, true);

      return () => {
        document.removeEventListener("focusin", handleFocusIn, true);
        document.removeEventListener("keydown", handleKeyDown, true);
      };
    }, []);

    return (
      <SonnerToaster
        className={cx("portfolio-toaster", className)}
        closeButton
        containerAriaLabel="操作通知"
        dir="auto"
        duration={6500}
        expand={false}
        gap={8}
        icons={{ ...defaultIcons, ...icons }}
        mobileOffset={mobileOffset || defaultMobileOffset}
        offset={offset || defaultOffset}
        position="bottom-right"
        ref={setViewportRef}
        swipeDirections={["right", "bottom"]}
        theme="light"
        toastOptions={{
          closeButtonAriaLabel: "关闭通知",
          ...toastOptionOverrides,
          classNames: { ...defaultClassNames, ...classNames }
        }}
        visibleToasts={3}
        {...props}
      />
    );
  }
);
