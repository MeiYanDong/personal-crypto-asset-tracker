import {
  forwardRef,
  useEffect,
  useId,
  type FormEventHandler,
  type HTMLAttributes
} from "react";
import { ChevronRight, Edit3, FolderKanban, FolderPlus, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import type { AssetGroup, AssetGroupColor } from "../../shared/portfolio-state";
import { AssetGroupMark, type AssetGroupTone } from "./AssetGroupIdentity";
import { Badge } from "./ui/Badge";
import { Button, IconButton } from "./ui/Button";
import { ColorSwatchGroup, type ColorSwatchOption } from "./ui/ColorSwatchGroup";
import { CountValue, CountWithUnit } from "./ui/CountValue";
import { Dialog, DialogBody, DialogHeader } from "./ui/Dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "./ui/DropdownMenu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput
} from "./ui/InputGroup";
import { InlineEdit } from "./ui/InlineEdit";
import { useMediaQuery } from "./ui/useMediaQuery";
import { cx } from "./ui/utils";

export type AssetGroupManagerItem = {
  group: AssetGroup;
  walletCount: number;
};

const assetGroupColorOptions: readonly ColorSwatchOption[] = [
  { value: "green", label: "绿色" },
  { value: "blue", label: "蓝色" },
  { value: "violet", label: "紫色" },
  { value: "gold", label: "金色" },
  { value: "red", label: "红色" },
  { value: "gray", label: "灰色" }
];

export type AssetGroupManagerProps = Omit<HTMLAttributes<HTMLElement>, "children" | "onSelect"> & {
  activeId: string;
  editingColor: AssetGroupColor;
  editingId: string | null;
  editingName: string;
  items: AssetGroupManagerItem[];
  newColor: AssetGroupColor;
  newName: string;
  open: boolean;
  totalWalletCount: number;
  onBeginEdit: (group: AssetGroup) => void;
  onCancelEdit: () => void;
  onCreate: FormEventHandler<HTMLFormElement>;
  onDelete: (group: AssetGroup) => void;
  onEditingColorChange: (color: AssetGroupColor) => void;
  onEditingNameChange: (name: string) => void;
  onNewColorChange: (color: AssetGroupColor) => void;
  onNewNameChange: (name: string) => void;
  onOpenChange: (open: boolean) => void;
  onSaveEdit: (groupId: string) => boolean | void;
  onSelect: (groupId: string) => void;
};

export type AssetGroupManagerLayout = "desktop" | "dialog";

function assetGroupLayoutPrefix(layout: AssetGroupManagerLayout) {
  return layout === "dialog" ? "mobile-" : "";
}

export function assetGroupActionsId(groupId: string, layout: AssetGroupManagerLayout = "desktop") {
  return `${assetGroupLayoutPrefix(layout)}asset-group-actions-${encodeURIComponent(groupId)}`;
}

export function assetGroupButtonId(groupId: string, layout: AssetGroupManagerLayout = "desktop") {
  return `${assetGroupLayoutPrefix(layout)}asset-group-button-${encodeURIComponent(groupId)}`;
}

type AssetGroupMobileTriggerProps = {
  activeLabel: string;
  open: boolean;
  tone: AssetGroupTone;
  triggerId: string;
  walletCount: number;
  onOpen: () => void;
};

function AssetGroupMobileTrigger({
  activeLabel,
  open,
  tone,
  triggerId,
  walletCount,
  onOpen
}: AssetGroupMobileTriggerProps) {
  return (
    <Button
      id={triggerId}
      aria-expanded={open}
      aria-haspopup="dialog"
      aria-label={`管理资产组，当前为${activeLabel}，共${walletCount}个钱包`}
      className="asset-group-mobile-trigger"
      data-component="asset-group-mobile-trigger"
      data-slot="asset-group-trigger"
      variant="ghost"
      onClick={onOpen}
    >
      <AssetGroupMark size="md" tone={tone} />
      <span className="asset-group-mobile-copy" data-slot="asset-group-trigger-copy">
        <span data-slot="asset-group-trigger-label">当前资产组</span>
        <strong data-slot="asset-group-trigger-value">{activeLabel}</strong>
      </span>
      <Badge tone="neutral">
        <CountWithUnit unit="个钱包"><CountValue value={walletCount} /></CountWithUnit>
      </Badge>
      <ChevronRight aria-hidden="true" className="asset-group-mobile-chevron" />
    </Button>
  );
}

export const AssetGroupManager = forwardRef<HTMLElement, AssetGroupManagerProps>(function AssetGroupManager({
  activeId,
  className,
  editingColor,
  editingId,
  editingName,
  items,
  newColor,
  newName,
  open,
  totalWalletCount,
  onBeginEdit,
  onCancelEdit,
  onCreate,
  onDelete,
  onEditingColorChange,
  onEditingNameChange,
  onNewColorChange,
  onNewNameChange,
  onOpenChange,
  onSaveEdit,
  onSelect,
  ...props
}, ref) {
  const generatedId = useId();
  const triggerId = `${generatedId}-trigger`;
  const isDesktop = useMediaQuery("(min-width: 981px)", true);
  const activeItem = items.find((item) => item.group.id === activeId);
  const activeLabel = activeId === "all" ? "全部钱包" : activeItem?.group.name || "当前资产组";
  const activeWalletCount = activeId === "all" ? totalWalletCount : activeItem?.walletCount || 0;
  const canCreateAssetGroup = newName.trim().length > 0;

  useEffect(() => {
    if (isDesktop && open) {
      onOpenChange(false);
    }
  }, [isDesktop, onOpenChange, open]);

  function managerContent(layout: AssetGroupManagerLayout) {
    const idPrefix = assetGroupLayoutPrefix(layout);

    return (
      <div
        className="asset-group-sidebar-body"
        data-layout={layout}
        data-slot="asset-group-content"
      >
        <nav aria-label="钱包资产组" className="asset-group-nav" data-slot="asset-group-nav">
          <ul className="asset-group-list" data-slot="asset-group-list">
            <li
              className={cx("asset-group-item-row", activeId === "all" && "active")}
              data-active={activeId === "all" || undefined}
              data-slot="asset-group-item"
            >
              <Button
                id={assetGroupButtonId("all", layout)}
                aria-current={activeId === "all" ? "page" : undefined}
                variant="ghost"
                className="asset-group-item"
                data-slot="asset-group-select"
                onClick={() => onSelect("all")}
              >
                <AssetGroupMark tone="all" />
                <span data-slot="asset-group-name">全部钱包</span>
                <strong data-slot="asset-group-count"><CountValue value={totalWalletCount} /></strong>
              </Button>
            </li>

            {items.map(({ group, walletCount }) => {
              const editing = editingId === group.id;
              const actionsId = assetGroupActionsId(group.id, layout);
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
                      <AssetGroupMark tone={editingColor} />
                      <div className="asset-group-editor-fields" data-slot="asset-group-editor-fields">
                        <InlineEdit
                          actionSize={layout === "dialog" ? "md" : "xs"}
                          className="asset-group-inline-edit"
                          emptyMessage="资产组名称不能为空"
                          externallyDirty={editingColor !== group.color}
                          inputLabel={`编辑${group.name}名称`}
                          inputProps={{ maxLength: 40, required: true }}
                          originalValue={group.name}
                          returnFocusId={actionsId}
                          value={editingName}
                          saveLabel="保存资产组"
                          cancelLabel="取消编辑资产组"
                          onCancel={onCancelEdit}
                          onSave={() => onSaveEdit(group.id)}
                          onValueChange={onEditingNameChange}
                        />
                        <ColorSwatchGroup
                          label="资产组颜色"
                          name={`${idPrefix}asset-group-color-${group.id}`}
                          options={assetGroupColorOptions}
                          size="sm"
                          value={editingColor}
                          onValueChange={(color) => onEditingColorChange(color as AssetGroupColor)}
                        />
                      </div>
                    </div>
                  ) : (
                    <Button
                      id={assetGroupButtonId(group.id, layout)}
                      aria-current={activeId === group.id ? "page" : undefined}
                      variant="ghost"
                      className="asset-group-item"
                      data-slot="asset-group-select"
                      onClick={() => onSelect(group.id)}
                    >
                      <AssetGroupMark tone={group.color} />
                      <span data-slot="asset-group-name">{group.name}</span>
                      <strong data-slot="asset-group-count"><CountValue value={walletCount} /></strong>
                    </Button>
                  )}

                  {!editing ? (
                    <div
                      className="asset-group-actions"
                      data-slot="asset-group-actions"
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <IconButton
                            id={actionsId}
                            className="asset-group-action-trigger"
                            label={`更多${group.name}资产组操作`}
                            size={layout === "dialog" ? "md" : "xs"}
                            tooltip={false}
                            variant="ghost"
                          >
                            <MoreHorizontal aria-hidden="true" />
                          </IconButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          aria-label={`${group.name}资产组操作`}
                          className="asset-group-action-menu"
                          sideOffset={4}
                        >
                          <DropdownMenuGroup>
                            <DropdownMenuLabel title={group.name}>{group.name}</DropdownMenuLabel>
                            <DropdownMenuItem icon={<Edit3 />} onSelect={() => onBeginEdit(group)}>
                              编辑资产组
                            </DropdownMenuItem>
                            {!group.system ? (
                              <DropdownMenuItem
                                icon={<Trash2 />}
                                variant="destructive"
                                onSelect={() => onDelete(group)}
                              >
                                删除资产组
                              </DropdownMenuItem>
                            ) : null}
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </nav>

        <form
          aria-label="创建资产组"
          className="new-asset-group"
          data-ready={canCreateAssetGroup || undefined}
          data-slot="asset-group-footer"
          onSubmit={onCreate}
        >
          <InputGroup data-component="asset-group-create-field">
            <InputGroupInput
              aria-label="新资产组名称"
              autoComplete="off"
              data-slot="asset-group-new-input"
              maxLength={40}
              required
              value={newName}
              onChange={(event) => onNewNameChange(event.target.value)}
              placeholder="新资产组名称"
            />
            <InputGroupAddon aria-hidden="true" data-slot="asset-group-create-addon">
              <FolderPlus className="ui-field-icon" />
            </InputGroupAddon>
            <InputGroupAddon align="inline-end" data-slot="asset-group-create-addon">
              <InputGroupButton
                data-slot="asset-group-create"
                disabled={!canCreateAssetGroup}
                disabledReason="输入名称后添加"
                label="添加资产组"
                type="submit"
                variant="primary"
              >
                <Plus aria-hidden="true" />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <ColorSwatchGroup
            className="new-asset-group-colors"
            label="新资产组颜色"
            name={`${idPrefix}new-asset-group-color`}
            options={assetGroupColorOptions}
            value={newColor}
            onValueChange={(color) => onNewColorChange(color as AssetGroupColor)}
          />
        </form>
      </div>
    );
  }

  return (
    <>
      <aside
        {...props}
        ref={ref}
        className={cx("asset-group-sidebar", className)}
        data-component="asset-group-manager"
        data-layout={isDesktop ? "desktop" : "trigger"}
        data-open={open || undefined}
        data-slot="asset-group-manager"
      >
        {isDesktop ? (
          <>
            <div className="asset-group-desktop-head" data-slot="asset-group-header">
              <div>
                <span className="eyebrow">资产组</span>
                <strong>归类</strong>
              </div>
              <Badge data-slot="asset-group-total" tone="neutral"><CountValue value={items.length} /></Badge>
            </div>
            {managerContent("desktop")}
          </>
        ) : (
          <AssetGroupMobileTrigger
            activeLabel={activeLabel}
            open={open}
            tone={activeId === "all" ? "all" : activeItem?.group.color || "gray"}
            triggerId={triggerId}
            walletCount={activeWalletCount}
            onOpen={() => onOpenChange(true)}
          />
        )}
      </aside>
      {!isDesktop ? (
        <Dialog
          className="asset-group-dialog"
          closeLabel="关闭资产组管理"
          fallbackFocusIds={[triggerId]}
          initialFocus="heading"
          open={open}
          size="sm"
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              onCancelEdit();
            }
            onOpenChange(nextOpen);
          }}
        >
          <DialogHeader
            description={(
              <>
                当前 {activeLabel} ·{" "}
                <CountWithUnit unit="个钱包"><CountValue value={activeWalletCount} /></CountWithUnit>
              </>
            )}
            icon={<FolderKanban />}
            title="资产组管理"
          />
          <DialogBody className="asset-group-dialog-body">
            {managerContent("dialog")}
          </DialogBody>
        </Dialog>
      ) : null}
    </>
  );
});

export default AssetGroupManager;
