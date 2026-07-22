type DownloadAnchor = {
  download: string;
  hidden: boolean;
  href: string;
  click: () => void;
  remove: () => void;
};

export type DownloadEnvironment = {
  appendAnchor: (anchor: DownloadAnchor) => void;
  createAnchor: () => DownloadAnchor;
  createObjectURL: (blob: Blob) => string;
  revokeObjectURL: (url: string) => void;
  scheduleCleanup: (callback: () => void, delay: number) => void;
};

function browserDownloadEnvironment(): DownloadEnvironment {
  return {
    appendAnchor: (anchor) => document.body.append(anchor as HTMLAnchorElement),
    createAnchor: () => document.createElement("a"),
    createObjectURL: (blob) => URL.createObjectURL(blob),
    revokeObjectURL: (url) => URL.revokeObjectURL(url),
    scheduleCleanup: (callback, delay) => {
      window.setTimeout(callback, delay);
    }
  };
}

export function startBlobDownload(
  blob: Blob,
  filename: string,
  environment: DownloadEnvironment = browserDownloadEnvironment(),
  cleanupDelay = 1000
) {
  const url = environment.createObjectURL(blob);
  let anchor: DownloadAnchor | null = null;

  try {
    anchor = environment.createAnchor();
    anchor.href = url;
    anchor.download = filename;
    anchor.hidden = true;
    environment.appendAnchor(anchor);
    anchor.click();
  } finally {
    anchor?.remove();
    environment.scheduleCleanup(
      () => environment.revokeObjectURL(url),
      Math.max(0, cleanupDelay)
    );
  }
}

export function timestampedFilename(prefix: string, timestamp: string | Date, extension: string) {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid download timestamp");
  }

  const safeTimestamp = date.toISOString().replace(/\.\d{3}Z$/, "Z").replace(/:/g, "-");
  const safeExtension = extension.replace(/^\.+/, "");
  return `${prefix}-${safeTimestamp}.${safeExtension}`;
}
