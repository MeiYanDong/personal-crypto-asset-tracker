import { forwardRef } from "react";
import { Download } from "lucide-react";
import { AsyncIconButton, type AsyncIconButtonProps } from "./AsyncIconButton";
import { startBlobDownload } from "./download";
import { cx } from "./utils";

export type DownloadButtonProps = Omit<
  AsyncIconButtonProps,
  | "action"
  | "errorIcon"
  | "errorLabel"
  | "idleIcon"
  | "label"
  | "onActionError"
  | "onActionSuccess"
  | "pendingLabel"
  | "resetKey"
  | "stateNames"
  | "statusSlot"
  | "successIcon"
  | "successLabel"
> & {
  cleanupDelay?: number;
  content: BlobPart;
  errorLabel?: string;
  filename: string;
  label?: string;
  mimeType?: string;
  onDownloadError?: (error: unknown) => void;
  onDownloadStarted?: (filename: string) => void;
  pendingLabel?: string;
  successLabel?: string;
};

export const DownloadButton = forwardRef<HTMLButtonElement, DownloadButtonProps>(
  function DownloadButton({
    className,
    cleanupDelay = 1000,
    content,
    "data-slot": inheritedSlot,
    errorLabel = "下载失败",
    filename,
    label = "下载文件",
    mimeType = "application/octet-stream",
    onDownloadError,
    onDownloadStarted,
    pendingLabel = "正在准备下载",
    successLabel = "下载已开始",
    ...props
  }, ref) {
    return (
      <AsyncIconButton
        {...props}
        ref={ref}
        action={() => {
          startBlobDownload(new Blob([content], { type: mimeType }), filename, undefined, cleanupDelay);
        }}
        className={cx("ui-download-button", className)}
        data-slot={inheritedSlot ?? "download-button"}
        errorLabel={errorLabel}
        idleIcon={<Download />}
        label={label}
        onActionError={onDownloadError}
        onActionSuccess={() => onDownloadStarted?.(filename)}
        pendingLabel={pendingLabel}
        resetKey={filename}
        stateNames={{ pending: "preparing", success: "started" }}
        statusSlot="download-status"
        successLabel={successLabel}
      />
    );
  }
);
