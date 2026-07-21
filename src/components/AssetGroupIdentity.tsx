import type { HTMLAttributes } from "react";
import { Folder, FolderKanban } from "lucide-react";
import type { AssetGroupColor } from "../../shared/portfolio-state";
import { cx } from "./ui/utils";

export type AssetGroupTone = AssetGroupColor | "all";
export type AssetGroupMarkSize = "xs" | "sm" | "md" | "lg";

type AssetGroupMarkProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  size?: AssetGroupMarkSize;
  tone?: AssetGroupTone;
};

export function AssetGroupMark({
  className,
  size = "sm",
  tone = "gray",
  ...props
}: AssetGroupMarkProps) {
  const Icon = tone === "all" ? FolderKanban : Folder;
  return (
    <span
      {...props}
      aria-hidden="true"
      className={cx("asset-group-mark", className)}
      data-size={size}
      data-tone={tone}
    >
      <Icon />
    </span>
  );
}

type AssetGroupLabelProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  name: string;
  tone?: AssetGroupTone;
};

export function AssetGroupLabel({
  className,
  name,
  tone = "gray",
  ...props
}: AssetGroupLabelProps) {
  return (
    <span className={cx("asset-group-label", className)} {...props}>
      <AssetGroupMark size="xs" tone={tone} />
      <span>{name}</span>
    </span>
  );
}
