import {
  forwardRef,
  useId,
  type FormEventHandler,
  type HTMLAttributes
} from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import type { AssetGroup } from "../../shared/portfolio-state";
import { AssetGroupMark } from "./AssetGroupIdentity";
import { Badge } from "./ui/Badge";
import { Button, IconButton } from "./ui/Button";
import {
  Collapsible,
  CollapsibleChevron,
  CollapsibleContent,
  CollapsibleTrigger
} from "./ui/Collapsible";
import { Input } from "./ui/FormControls";
import { InlineEdit } from "./ui/InlineEdit";
import { cx } from "./ui/utils";

export type AssetGroupManagerItem = {
  group: AssetGroup;
  walletCount: number;
};

export type AssetGroupManagerProps = Omit<HTMLAttributes<HTMLElement>, "children" | "onSelect"> & {
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
  onSaveEdit: (groupId: string) => boolean | void;
  onSelect: (groupId: string) => void;
};

function assetGroupEditId(groupId: string) {
  return `asset-group-edit-${encodeURIComponent(groupId)}`;
}

export const AssetGroupManager = forwardRef<HTMLElement, AssetGroupManagerProps>(function AssetGroupManager({
  activeId,
  className,
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
  onSelect,
  ...props
}, ref) {
  const generatedId = useId();
  const panelId = `${generatedId}-panel`;
  const triggerId = `${generatedId}-trigger`;
  const activeItem = items.find((item) => item.group.id === activeId);
  const activeLabel = activeId === "all" ? "全部钱包" : activeItem?.group.name || "当前资产组";
  const activeWalletCount = activeId === "all" ? totalWalletCount : activeItem?.walletCount || 0;

  return (
    <Collapsible asChild open={open} onOpenChange={onOpenChange}>
      <aside
        {...props}
        ref={ref}
        className={cx("asset-group-sidebar", className)}
        data-component="asset-group-manager"
        data-open={open || undefined}
        data-slot="asset-group-manager"
      >
        <div className="asset-group-desktop-head" data-slot="asset-group-header">
          <div>
            <span className="eyebrow">资产组</span>
            <strong>归类</strong>
          </div>
          <Badge data-slot="asset-group-total" tone="neutral">{items.length}</Badge>
        </div>

        <CollapsibleTrigger asChild>
          <Button
            id={triggerId}
            aria-controls={panelId}
            className="asset-group-mobile-trigger"
            data-slot="asset-group-trigger"
            variant="ghost"
          >
            <AssetGroupMark
              size="md"
              tone={activeId === "all" ? "all" : activeItem?.group.color || "gray"}
            />
            <span className="asset-group-mobile-copy" data-slot="asset-group-trigger-copy">
              <small>当前资产组</small>
              <strong>{activeLabel}</strong>
            </span>
            <Badge tone="neutral">{activeWalletCount} 个钱包</Badge>
            <CollapsibleChevron className="asset-group-mobile-chevron" direction="down" />
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent
          aria-labelledby={triggerId}
          className="asset-group-sidebar-body"
          data-slot="asset-group-content"
          id={panelId}
        >
          <nav aria-label="钱包资产组" className="asset-group-nav" data-slot="asset-group-nav">
            <ul className="asset-group-list" data-slot="asset-group-list">
              <li
                className={cx("asset-group-item-row", activeId === "all" && "active")}
                data-active={activeId === "all" || undefined}
                data-slot="asset-group-item"
              >
                <Button
                  id="asset-group-button-all"
                  aria-current={activeId === "all" ? "page" : undefined}
                  variant="ghost"
                  className="asset-group-item"
                  data-slot="asset-group-select"
                  onClick={() => onSelect("all")}
                >
                  <AssetGroupMark tone="all" />
                  <span data-slot="asset-group-name">全部钱包</span>
                  <strong data-slot="asset-group-count">{totalWalletCount}</strong>
                </Button>
              </li>

              {items.map(({ group, walletCount }) => {
                const editing = editingId === group.id;
                return (
                  <li
                    className={cx("asset-group-item-row", activeId === group.id && "active")}
                    data-active={activeId === group.id || undefined}
                    data-editing={editing || undefined}
                    data-slot="asset-group-item"
                    data-system={group.system || undefined}
                    key={group.id}
                  >
                    {editing ? (
                      <div className="asset-group-item asset-group-item-editing" data-slot="asset-group-editor">
                        <AssetGroupMark tone={group.color} />
                        <InlineEdit
                          className="asset-group-inline-edit"
                          inputLabel={`编辑${group.name}名称`}
                          inputProps={{ maxLength: 40, required: true }}
                          originalValue={group.name}
                          returnFocusId={assetGroupEditId(group.id)}
                          value={editingName}
                          saveLabel="保存资产组名称"
                          cancelLabel="取消编辑资产组名称"
                          onCancel={onCancelEdit}
                          onSave={() => onSaveEdit(group.id)}
                          onValueChange={onEditingNameChange}
                        />
                      </div>
                    ) : (
                      <Button
                        id={`asset-group-button-${group.id}`}
                        aria-current={activeId === group.id ? "page" : undefined}
                        variant="ghost"
                        className="asset-group-item"
                        data-slot="asset-group-select"
                        onClick={() => onSelect(group.id)}
                      >
                        <AssetGroupMark tone={group.color} />
                        <span data-slot="asset-group-name">{group.name}</span>
                        <strong data-slot="asset-group-count">{walletCount}</strong>
                      </Button>
                    )}

                    {!editing ? (
                      <div
                        aria-label={`${group.name}资产组操作`}
                        className="asset-group-actions"
                        data-slot="asset-group-actions"
                        role="group"
                      >
                        <IconButton
                          id={assetGroupEditId(group.id)}
                          label="编辑资产组"
                          size="xs"
                          variant="ghost"
                          onClick={() => onBeginEdit(group)}
                        >
                          <Edit3 aria-hidden="true" />
                        </IconButton>
                        {!group.system ? (
                          <IconButton label="删除资产组" size="xs" variant="danger" onClick={() => onDelete(group)}>
                            <Trash2 aria-hidden="true" />
                          </IconButton>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </nav>

          <form aria-label="创建资产组" className="new-asset-group" data-slot="asset-group-footer" onSubmit={onCreate}>
            <Input
              aria-label="新资产组名称"
              data-slot="asset-group-new-input"
              maxLength={40}
              required
              value={newName}
              onChange={(event) => onNewNameChange(event.target.value)}
              placeholder="新资产组名称"
            />
            <IconButton data-slot="asset-group-create" label="添加资产组" type="submit" variant="primary">
              <Plus aria-hidden="true" />
            </IconButton>
          </form>
        </CollapsibleContent>
      </aside>
    </Collapsible>
  );
});

export default AssetGroupManager;
