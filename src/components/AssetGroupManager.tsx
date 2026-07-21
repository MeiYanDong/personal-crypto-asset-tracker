import type { FormEventHandler } from "react";
import { CheckCircle2, ChevronDown, Edit3, Folder, FolderKanban, Plus, Trash2 } from "lucide-react";
import type { AssetGroup } from "../../shared/portfolio-state";
import { Badge } from "./ui/Badge";
import { Button, IconButton } from "./ui/Button";
import { Input } from "./ui/FormControls";
import { cx } from "./ui/utils";

export type AssetGroupManagerItem = {
  group: AssetGroup;
  walletCount: number;
};

type AssetGroupManagerProps = {
  activeId: string;
  editingId: string | null;
  editingName: string;
  items: AssetGroupManagerItem[];
  newName: string;
  open: boolean;
  totalWalletCount: number;
  onBeginEdit: (group: AssetGroup) => void;
  onCancelEdit: () => void;
  onCreate: FormEventHandler<HTMLFormElement>;
  onDelete: (group: AssetGroup) => void;
  onEditingNameChange: (name: string) => void;
  onNewNameChange: (name: string) => void;
  onOpenChange: (open: boolean) => void;
  onSaveEdit: (groupId: string) => void;
  onSelect: (groupId: string) => void;
};

const panelId = "asset-group-manager-panel";

export default function AssetGroupManager({
  activeId,
  editingId,
  editingName,
  items,
  newName,
  open,
  totalWalletCount,
  onBeginEdit,
  onCancelEdit,
  onCreate,
  onDelete,
  onEditingNameChange,
  onNewNameChange,
  onOpenChange,
  onSaveEdit,
  onSelect
}: AssetGroupManagerProps) {
  const activeItem = items.find((item) => item.group.id === activeId);
  const activeLabel = activeId === "all" ? "全部钱包" : activeItem?.group.name || "当前资产组";
  const activeWalletCount = activeId === "all" ? totalWalletCount : activeItem?.walletCount || 0;

  return (
    <aside className={cx("asset-group-sidebar", open && "is-open")}>
      <div className="asset-group-desktop-head">
        <div>
          <span className="eyebrow">资产组</span>
          <strong>归类</strong>
        </div>
        <Badge tone="neutral">{items.length}</Badge>
      </div>

      <Button
        aria-controls={panelId}
        aria-expanded={open}
        className="asset-group-mobile-trigger"
        variant="ghost"
        onClick={() => onOpenChange(!open)}
      >
        <span className="asset-group-mobile-icon"><FolderKanban aria-hidden="true" /></span>
        <span className="asset-group-mobile-copy">
          <small>当前资产组</small>
          <strong>{activeLabel}</strong>
        </span>
        <Badge tone="neutral">{activeWalletCount} 个钱包</Badge>
        <ChevronDown className="asset-group-mobile-chevron" aria-hidden="true" />
      </Button>

      {open ? (
        <div className="asset-group-sidebar-body" id={panelId}>
          <nav aria-label="钱包资产组" className="asset-group-list">
            <Button
              aria-current={activeId === "all" ? "page" : undefined}
              variant="ghost"
              className={activeId === "all" ? "asset-group-item active" : "asset-group-item"}
              onClick={() => onSelect("all")}
            >
              <span className="asset-group-icon all"><FolderKanban aria-hidden="true" /></span>
              <span>全部钱包</span>
              <strong>{totalWalletCount}</strong>
            </Button>

            {items.map(({ group, walletCount }) => (
              <div className={cx("asset-group-item-row", activeId === group.id && "active")} key={group.id}>
                {editingId === group.id ? (
                  <div className="asset-group-item asset-group-item-editing">
                    <span className={`asset-group-icon ${group.color}`}><Folder aria-hidden="true" /></span>
                    <Input
                      autoFocus
                      aria-label={`编辑${group.name}名称`}
                      value={editingName}
                      onChange={(event) => onEditingNameChange(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          onSaveEdit(group.id);
                        }
                        if (event.key === "Escape") {
                          onCancelEdit();
                        }
                      }}
                    />
                    <strong>{walletCount}</strong>
                  </div>
                ) : (
                  <Button
                    aria-current={activeId === group.id ? "page" : undefined}
                    variant="ghost"
                    className="asset-group-item"
                    onClick={() => onSelect(group.id)}
                  >
                    <span className={`asset-group-icon ${group.color}`}><Folder aria-hidden="true" /></span>
                    <span>{group.name}</span>
                    <strong>{walletCount}</strong>
                  </Button>
                )}

                <div className="asset-group-actions">
                  {editingId === group.id ? (
                    <IconButton label="保存资产组名称" size="xs" variant="ghost" onClick={() => onSaveEdit(group.id)}>
                      <CheckCircle2 aria-hidden="true" />
                    </IconButton>
                  ) : (
                    <IconButton label="编辑资产组" size="xs" variant="ghost" onClick={() => onBeginEdit(group)}>
                      <Edit3 aria-hidden="true" />
                    </IconButton>
                  )}
                  {!group.system ? (
                    <IconButton label="删除资产组" size="xs" variant="danger" onClick={() => onDelete(group)}>
                      <Trash2 aria-hidden="true" />
                    </IconButton>
                  ) : null}
                </div>
              </div>
            ))}
          </nav>

          <form className="new-asset-group" onSubmit={onCreate}>
            <Input
              aria-label="新资产组名称"
              value={newName}
              onChange={(event) => onNewNameChange(event.target.value)}
              placeholder="新资产组名称"
            />
            <IconButton label="添加资产组" type="submit" variant="primary">
              <Plus aria-hidden="true" />
            </IconButton>
          </form>
        </div>
      ) : null}
    </aside>
  );
}
