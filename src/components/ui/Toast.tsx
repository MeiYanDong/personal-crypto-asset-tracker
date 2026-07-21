import { AlertTriangle, CheckCircle2, CircleX, Info, LoaderCircle, X } from "lucide-react";
import { Toaster as SonnerToaster, toast } from "sonner";

export { toast };

export function ToastViewport() {
  return (
    <SonnerToaster
      className="portfolio-toaster"
      closeButton
      containerAriaLabel="操作通知"
      dir="ltr"
      duration={6500}
      expand
      gap={8}
      icons={{
        close: <X aria-hidden="true" />,
        error: <CircleX aria-hidden="true" />,
        info: <Info aria-hidden="true" />,
        loading: <LoaderCircle aria-hidden="true" className="spin" />,
        success: <CheckCircle2 aria-hidden="true" />,
        warning: <AlertTriangle aria-hidden="true" />
      }}
      mobileOffset={{ bottom: 12, left: 12, right: 12 }}
      offset={{ bottom: 18, right: 18 }}
      position="bottom-right"
      theme="light"
      toastOptions={{
        closeButtonAriaLabel: "关闭通知",
        classNames: {
          closeButton: "portfolio-toast-close",
          content: "portfolio-toast-content",
          default: "portfolio-toast-default",
          description: "portfolio-toast-description",
          error: "portfolio-toast-error",
          icon: "portfolio-toast-icon",
          info: "portfolio-toast-info",
          loading: "portfolio-toast-loading",
          success: "portfolio-toast-success",
          title: "portfolio-toast-title",
          toast: "portfolio-toast",
          warning: "portfolio-toast-warning"
        }
      }}
      visibleToasts={3}
    />
  );
}
