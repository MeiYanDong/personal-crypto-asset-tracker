import { forwardRef, type HTMLAttributes } from "react";
import { Folder, FolderKanban } from "lucide-react";
import type { AssetGroupColor } from "../../shared/portfolio-state";
import { IdentityMark } from "./ui/IdentityMark";
import { cx } from "./ui/utils";

export type AssetGroupTone = AssetGroupColor | "all";
export type AssetGroupMarkSize = "xs" | "sm" | "md" | "lg";

export type AssetGroupMarkProps = Omit<HTMLAttributes<HTMLSpanElement>, "aria-hidden" | "children"> & {
  size?: AssetGroupMarkSize;
  tone?: AssetGroupTone;
};

export const AssetGroupMark = forwardRef<HTMLSpanElement, AssetGroupMarkProps>(function AssetGroupMark({
  className,
  size = "sm",
  tone = "gray",
  ...props
}, ref) {
  const Icon = tone === "all" ? FolderKanban : Folder;
  return (
    <IdentityMark
      {...props}
      ref={ref}
      aria-hidden="true"
      className={cx("asset-group-mark", className)}
      data-component="asset-group-mark"
      data-size={size}
      data-tone={tone}
      kind="icon"
    >
      <Icon aria-hidden="true" />
    </IdentityMark>
  );
});

export type AssetGroupLabelProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  name: string;
  tone?: AssetGroupTone;
};

export const AssetGroupLabel = forwardRef<HTMLSpanElement, AssetGroupLabelProps>(function AssetGroupLabel({
  className,
  name,
  tone = "gray",
  title,
  ...props
}, ref) {
  return (
    <span
      {...props}
      ref={ref}
      className={cx("asset-group-label", className)}
      data-slot="asset-group-label"
      data-tone={tone}
      title={title ?? name}
    >
      <AssetGroupMark size="xs" tone={tone} />
      <span data-slot="asset-group-label-text">{name}</span>
    </span>
  );
});
