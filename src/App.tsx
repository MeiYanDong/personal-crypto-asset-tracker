import {
  ArrowUpDown,
  CheckCircle2,
  CheckSquare2,
  ChevronRight,
  CircleDollarSign,
  Database,
  Edit3,
  FolderInput,
  FolderKanban,
  LayoutDashboard,
  LockKeyhole,
  MoreHorizontal,
  Network,
  Plus,
  RefreshCw,
  RotateCcw,
  Settings2,
  Trash2,
  Unlink,
  WalletCards,
  X
} from "lucide-react";
import {
  Fragment,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import { calculateConservativeEstimate } from "../shared/asset-estimate";
import {
  canDetachWalletFromPair,
  INDEPENDENT_WALLET_GROUP_VALUE,
  reassignWalletPairing
} from "../shared/wallet-pairing";
import {
  countWalletRefreshStates,
  regroupWalletSummaries,
  walletRefreshHasAssetData,
  walletRefreshMatchesFilter,
  walletRefreshState,
  type WalletRefreshFilter,
  type WalletRefreshStatus
} from "../shared/wallet-snapshot";
import AssetGroupManager, {
  assetGroupActionsId,
  assetGroupButtonId,
  type AssetGroupManagerItem
} from "./components/AssetGroupManager";
import { AssetGroupLabel, AssetGroupMark } from "./components/AssetGroupIdentity";
import { ChainChoiceGroup } from "./components/ChainChoice";
import ChainExposure, {
  ChainIdentity,
  chainTone,
  type ChainExposureSummary,
  type ChainTokenSummary
} from "./components/ChainExposure";
import LedgerItem, { LedgerDetail } from "./components/LedgerItem";
import PortfolioSummary, { PortfolioSummarySkeleton } from "./components/PortfolioSummary";
import RefreshHealth, { type SnapshotHistoryPoint } from "./components/RefreshHealth";
import { TokenChainBreakdownList, TokenContractList } from "./components/TokenMetadata";
import {
  canonicalTokenSymbol,
  fallbackTokenIconUrl,
  TokenHoldingList,
  TokenIcon,
  tokenIconUrl
} from "./components/TokenIdentity";
import {
  WalletAddressDetailItem,
  WalletAddressDetailList,
  WalletAddressList
} from "./components/WalletAddressList";
import {
  WalletManagementHeadingSkeleton,
  WalletManagementSkeleton
} from "./components/WalletManagementSkeleton";
import WalletImportReview, {
  type WalletImportIssue
} from "./components/WalletImportReview";
import {
  WalletRefreshFilterSelect,
  WalletRefreshStatusBadge
} from "./components/WalletRefreshStatus";
import { Badge, StatusBadge } from "./components/ui/Badge";
import { Button, IconButton } from "./components/ui/Button";
import { ButtonGroup } from "./components/ui/ButtonGroup";
import {
  Collapsible,
  CollapsibleChevron,
  CollapsibleContent,
  CollapsibleTrigger,
  DisclosureIconButton
} from "./components/ui/Collapsible";
import {
  ConfirmDialog,
  ConfirmDialogImpact,
  ConfirmDialogTarget
} from "./components/ui/ConfirmDialog";
import { CopyButton } from "./components/ui/CopyButton";
import { CountPair, CountValue } from "./components/ui/CountValue";
import { CurrencyValue } from "./components/ui/CurrencyValue";
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "./components/ui/Dialog";
import { DownloadButton } from "./components/ui/DownloadButton";
import { timestampedFilename } from "./components/ui/download";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "./components/ui/DropdownMenu";
import { EmptyState, Notice } from "./components/ui/Feedback";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldHeader,
  FieldLabel,
  FieldLegend,
  FieldSet
} from "./components/ui/Field";
import { Checkbox, LineTextarea, PasswordField, SearchField, Switch } from "./components/ui/FormControls";
import { IdentityMark } from "./components/ui/IdentityMark";
import { InlineEdit } from "./components/ui/InlineEdit";
import { ItemGroup } from "./components/ui/Item";
import { Pagination } from "./components/ui/Pagination";
import { QuantityValue } from "./components/ui/QuantityValue";
import { RouteNavigation } from "./components/ui/RouteNavigation";
import { Select } from "./components/ui/Select";
import { ShareMeter } from "./components/ui/ShareMeter";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableRowHead
} from "./components/ui/Table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/Tabs";
import { formatDateTime } from "./components/ui/TimeValue";
import { TokenPriceValue } from "./components/ui/TokenPriceValue";
import { ToastActionLabel, ToastViewport, toast } from "./components/ui/Toast";
import { useMediaQuery } from "./components/ui/useMediaQuery";
import { ValuePlaceholder } from "./components/ui/ValuePlaceholder";
import {
  type AssetGroup,
  type AssetGroupAssignments,
  type AssetGroupColor,
  assetGroupColorForIndex,
  defaultAssetGroups,
  inferAssetGroupId,
  normalizeAssetGroups,
  UNCLASSIFIED_ASSET_GROUP_ID
} from "../shared/portfolio-state";

type WalletRecord = {
  id: string;
  label: string;
  address: string;
  addressType: "evm" | "solana";
  source?: "manual" | "okx-agentic-wallet";
  accountId?: string;
  groupId?: string;
  groupLabel?: string;
  createdAt: string;
};

type PortfolioSuccessAction = {
  label: ReactNode;
  onClick: (wallets: WalletRecord[]) => void;
};

type TokenSummary = {
  symbol: string;
  iconUrl?: string;
  totalUsd: number;
  totalBalance: number;
  walletCount: number;
  holdingCount: number;
  chainBreakdown: Array<{
    chainName: string;
    totalUsd: number;
    totalBalance: number;
  }>;
  contracts: string[];
  riskCount: number;
};

type Holding = {
  walletId: string;
  walletLabel: string;
  walletAddress: string;
  chainIndex: string;
  chainName: string;
  symbol: string;
  iconUrl?: string;
  tokenContractAddress: string;
  balance: number;
  tokenPrice: number;
  usdValue: number;
  isRiskToken: boolean;
};

type WalletSummary = {
  wallet: WalletRecord;
  wallets?: WalletRecord[];
  addressTypes?: Array<WalletRecord["addressType"]>;
  status: WalletRefreshStatus;
  error?: string;
  staleReason?: string;
  updatedAt?: string;
  totalUsd: number;
  tokenCount: number;
  topTokens: Array<{
    symbol: string;
    iconUrl?: string;
    totalUsd: number;
    totalBalance: number;
  }>;
  holdings: Holding[];
};

function assetGroupSelectOption(group: AssetGroup, label = group.name) {
  return {
    value: group.id,
    label,
    icon: <AssetGroupMark size="xs" tone={group.color} />
  };
}

type WalletGroup = {
  key: string;
  label: string;
  displayLabel: string;
  wallets: WalletRecord[];
  addressTypes: Array<WalletRecord["addressType"]>;
};

type DeleteIntent =
  | {
      kind: "asset-group";
      assetGroup: AssetGroup;
      walletCount: number;
    }
  | {
      kind: "wallet-address";
      wallet: WalletRecord;
      walletGroupKey: string;
      walletGroupLabel: string;
    };

type ManagementSort = "sequence" | "assets-desc" | "name";

type Snapshot = {
  generatedAt: string;
  chains: string[];
  includeRisk: boolean;
  walletCount: number;
  totalUsd: number;
  stablecoinUsd: number;
  volatileAssetUsd: number;
  conservativeTotalUsd: number;
  needsLogin: boolean;
  loginCommand: string;
  tokenSummary: TokenSummary[];
  walletSummary: WalletSummary[];
  errors: Array<{
    wallet: WalletRecord;
    error: string;
  }>;
  stale?: Array<{
    wallet: WalletRecord;
    error?: string;
    updatedAt?: string;
  }>;
  skipped?: Array<{
    wallet: WalletRecord;
    reason?: string;
  }>;
};

type Config = {
  authRequired: boolean;
  defaultChains: string[];
  availableChains: string[];
};

type PortfolioState = {
  version: 2;
  wallets: WalletRecord[];
  assetGroups: AssetGroup[];
  assignments: AssetGroupAssignments;
  updatedAt: string;
};

type AssetGroupSummary = {
  group: AssetGroup;
  totalUsd: number;
  stablecoinUsd: number;
  conservativeTotalUsd: number;
  coveredWalletCount: number;
  missingWalletCount: number;
  walletCount: number;
  addressCount: number;
  topTokens: TokenSummary[];
  issueCount: number;
};

type ApiError = Error & {
  status?: number;
};

const evmAddressPattern = /^0x[a-fA-F0-9]{40}$/;
const solanaAddressPattern = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const minVisibleUsd = 1;
const managementPageSize = 8;
const assetViews = ["groups", "chains", "tokens", "wallets"] as const;
type AssetView = (typeof assetViews)[number];
const legacyAuthTokenStorageKey = "asset-tracker-token";
const authIdleTimeoutMs = 5 * 60 * 1000;
let runtimeAuthToken = "";
const snapshotStorageKey = "asset-tracker-snapshot-v1";
const walletsStorageKey = "asset-tracker-wallets-v1";
const portfolioStateStorageKey = "asset-tracker-state-v2";
const nativeSymbolsByChain: Record<string, string> = {
  "1": "ETH",
  ethereum: "ETH",
  eth: "ETH",
  "56": "BNB",
  bsc: "BNB",
  "137": "MATIC",
  polygon: "MATIC",
  "8453": "ETH",
  base: "ETH",
  "4663": "ETH",
  robinhood: "ETH",
  "10": "ETH",
  optimism: "ETH",
  "42161": "ETH",
  arbitrum: "ETH",
  "43114": "AVAX",
  avalanche: "AVAX",
  avax: "AVAX",
  "196": "OKB",
  xlayer: "OKB",
  "501": "SOL",
  solana: "SOL"
};

function normalizeAddressInput(address: string) {
  const trimmed = address.trim();
  return evmAddressPattern.test(trimmed) ? trimmed.toLowerCase() : trimmed;
}

function isSupportedAddress(address: string) {
  return evmAddressPattern.test(address) || solanaAddressPattern.test(address);
}

function getAddressType(address: string): WalletRecord["addressType"] {
  const normalized = normalizeAddressInput(address);
  if (evmAddressPattern.test(normalized)) {
    return "evm";
  }
  if (solanaAddressPattern.test(normalized)) {
    return "solana";
  }
  throw new Error("请输入有效的 EVM 或 Solana 钱包地址。");
}

function stableWalletId(address: string) {
  const normalized = normalizeAddressInput(address);
  return `wallet-${getAddressType(normalized)}-${normalized.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12).toLowerCase()}`;
}

function addressTypeLabel(wallet: WalletRecord) {
  return wallet.addressType === "solana" ? "SOL" : "EVM";
}

function walletTypeRank(wallet: Pick<WalletRecord, "addressType">) {
  return wallet.addressType === "evm" ? 0 : 1;
}

function walletSummaryMembers(summary: WalletSummary) {
  return [...(summary.wallets?.length ? summary.wallets : [summary.wallet])].sort(
    (a, b) => walletTypeRank(a) - walletTypeRank(b)
  );
}

function walletDisplayLabel(wallet: WalletRecord) {
  return wallet.groupLabel || wallet.label;
}

function walletBadgeText(label: string) {
  if (/^独立[：:]/.test(label)) {
    return "独";
  }
  return label.replace("钱包 ", "").replace("Wallet ", "");
}

function walletRecordGroupKey(wallet: WalletRecord) {
  return wallet.groupId || wallet.id || wallet.address;
}

function walletRecordGroupLabel(wallet: WalletRecord) {
  return wallet.groupLabel || wallet.label;
}

function walletGroupDisplayLabel(group: Pick<WalletGroup, "label" | "wallets">) {
  const [onlyWallet] = group.wallets;
  if (
    onlyWallet &&
    group.wallets.length === 1 &&
    !/^独立[：:]/.test(group.label)
  ) {
    return `独立：${group.label}`;
  }

  return group.label;
}

function walletGroupToggleId(groupKey: string) {
  return `wallet-group-toggle-${encodeURIComponent(groupKey)}`;
}

function walletGroupDetailsId(groupKey: string) {
  return `wallet-group-details-${encodeURIComponent(groupKey)}`;
}

function walletGroupEditId(groupKey: string) {
  return `wallet-group-edit-${encodeURIComponent(groupKey)}`;
}

function walletGroupSelectId(groupKey: string) {
  return `wallet-group-select-${encodeURIComponent(groupKey)}`;
}

function walletAddressEditId(address: string) {
  return `wallet-address-edit-${encodeURIComponent(address)}`;
}

function WalletManagementActions({
  expanded,
  groupKey,
  label,
  layout,
  onEdit,
  onToggle
}: {
  expanded: boolean;
  groupKey: string;
  label: string;
  layout: "desktop" | "mobile";
  onEdit: () => void;
  onToggle: () => void;
}) {
  const actionSize = layout === "mobile" ? "md" : "sm";

  return (
    <ButtonGroup
      aria-label={`${label}钱包操作`}
      attached={layout === "desktop"}
      className="row-actions wallet-management-actions"
      data-layout={layout}
      data-slot="wallet-actions"
    >
      <IconButton
        id={walletGroupEditId(groupKey)}
        label="编辑钱包名称"
        size={actionSize}
        onClick={onEdit}
      >
        <Edit3 size={15} />
      </IconButton>
      <DisclosureIconButton
        id={walletGroupToggleId(groupKey)}
        collapsedLabel={`展开${label}地址`}
        controls={walletGroupDetailsId(groupKey)}
        expanded={expanded}
        expandedLabel={`收起${label}地址`}
        size={actionSize}
        onClick={onToggle}
      />
    </ButtonGroup>
  );
}

function normalizeWalletRecords(wallets: WalletRecord[]): WalletRecord[] {
  const seen = new Set<string>();
  return wallets.flatMap((wallet, index) => {
    try {
      const address = normalizeAddressInput(String(wallet.address || ""));
      if (!isSupportedAddress(address) || seen.has(address)) {
        return [];
      }
      seen.add(address);

      const id = String(wallet.id || stableWalletId(address));
      const label = String(wallet.label || `钱包 ${index + 1}`).trim();
      const groupId = wallet.groupId ? String(wallet.groupId) : id;
      const groupLabel = wallet.groupLabel ? String(wallet.groupLabel).trim() : undefined;
      const normalizedWallet: WalletRecord = {
        ...wallet,
        id,
        label,
        address,
        addressType: wallet.addressType || getAddressType(address),
        groupId,
        groupLabel,
        createdAt: wallet.createdAt || new Date().toISOString()
      };

      return [normalizedWallet];
    } catch {
      return [];
    }
  });
}

function walletGroupIdFromNumber(value: number) {
  return `wallet-${String(value).padStart(3, "0")}`;
}

function parseWalletLine(line: string, fallbackIndex: number): WalletRecord {
  const parts = line.split(/[\s,，]+/).map((part) => part.trim()).filter(Boolean);
  const addressPart = parts.find((part) => isSupportedAddress(normalizeAddressInput(part)));
  if (!addressPart) {
    throw new Error("未找到有效地址");
  }

  const address = normalizeAddressInput(addressPart);
  const addressType = getAddressType(address);
  const id = stableWalletId(address);
  const rawLabel = line
    .replace(addressPart, "")
    .replace(/^[\s,，:：#-]+|[\s,，:：#-]+$/g, "")
    .trim();
  const numberMatch = rawLabel.match(/^(?:钱包|Wallet|EVM|SOL)?\s*(\d+)$/i);
  const groupNumber = numberMatch ? Number(numberMatch[1]) : null;
  const label =
    rawLabel && !numberMatch
      ? rawLabel
      : groupNumber
        ? `${addressType === "solana" ? "SOL" : "EVM"} ${groupNumber}`
        : `钱包 ${fallbackIndex + 1}`;
  const groupId = groupNumber ? walletGroupIdFromNumber(groupNumber) : id;
  const groupLabel = groupNumber ? `钱包 ${groupNumber}` : label;

  return {
    id,
    label,
    address,
    addressType,
    groupId,
    groupLabel,
    createdAt: new Date().toISOString()
  };
}

type WalletImportAnalysis = {
  lineCount: number;
  wallets: WalletRecord[];
  issues: WalletImportIssue[];
  pairCount: number;
};

function analyzeWalletImport(
  text: string,
  existingWallets: WalletRecord[],
  fallbackIndex: number
): WalletImportAnalysis {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const existingAddresses = new Set(existingWallets.map((wallet) => wallet.address));
  const groupTypes = new Map<string, Set<WalletRecord["addressType"]>>();

  for (const wallet of existingWallets) {
    const groupKey = walletRecordGroupKey(wallet);
    const types = groupTypes.get(groupKey) || new Set<WalletRecord["addressType"]>();
    types.add(wallet.addressType);
    groupTypes.set(groupKey, types);
  }

  const initiallyPairedGroups = new Set(
    [...groupTypes.entries()]
      .filter(([, types]) => types.size > 1)
      .map(([groupKey]) => groupKey)
  );
  const newlyPairedGroups = new Set<string>();
  const nextWallets: WalletRecord[] = [];
  const issues: WalletImportIssue[] = [];

  for (const [index, line] of lines.entries()) {
    try {
      const wallet = parseWalletLine(line, fallbackIndex + nextWallets.length);
      const duplicateAddress =
        existingAddresses.has(wallet.address) ||
        nextWallets.some((item) => item.address === wallet.address);
      if (duplicateAddress) {
        issues.push({ lineNumber: index + 1, message: "地址已存在，将跳过" });
        continue;
      }

      const groupKey = walletRecordGroupKey(wallet);
      const types = groupTypes.get(groupKey) || new Set<WalletRecord["addressType"]>();
      if (types.has(wallet.addressType)) {
        issues.push({
          lineNumber: index + 1,
          message: `“${wallet.groupLabel || wallet.label}”已有 ${addressTypeLabel(wallet)} 地址`
        });
        continue;
      }

      types.add(wallet.addressType);
      groupTypes.set(groupKey, types);
      if (types.size > 1 && !initiallyPairedGroups.has(groupKey)) {
        newlyPairedGroups.add(groupKey);
      }
      nextWallets.push(wallet);
    } catch (nextError) {
      issues.push({
        lineNumber: index + 1,
        message: (nextError as Error).message
      });
    }
  }

  return {
    lineCount: lines.length,
    wallets: nextWallets,
    issues,
    pairCount: newlyPairedGroups.size
  };
}

function walletGroupSortRank(group: WalletGroup, fallback: number) {
  return walletSequenceRank(
    [group.label, group.key, ...group.wallets.flatMap((wallet) => [wallet.groupLabel, wallet.label, wallet.id])],
    fallback
  );
}

function walletSequenceRank(values: Array<string | undefined>, fallback: number) {
  const ranks = values
    .map((value) => walletSequenceRankValue(value))
    .filter((value): value is number => value !== null);

  return ranks.length ? Math.min(...ranks) : 1000 + fallback;
}

function walletSequenceRankValue(value?: string) {
  const text = value?.trim();
  if (!text) {
    return null;
  }

  const idMatch = text.match(/^wallet-(\d+)$/i);
  if (idMatch) {
    return Number(idMatch[1]);
  }

  const walletMatch = text.match(/^(?:钱包|Wallet|EVM|SOL(?:\s*钱包)?)\s*(\d+)$/i);
  if (walletMatch) {
    return Number(walletMatch[1]);
  }

  const accountMatch = text.match(/^Account\s*(\d+)/i);
  if (accountMatch) {
    return 100 + Number(accountMatch[1]);
  }

  return null;
}

function walletSummarySortRank(summary: WalletSummary, fallback: number) {
  const members = walletSummaryMembers(summary);
  return walletSequenceRank(
    [
      summary.wallet.groupLabel,
      summary.wallet.label,
      summary.wallet.groupId,
      summary.wallet.id,
      ...members.flatMap((wallet) => [wallet.groupLabel, wallet.label, wallet.groupId, wallet.id])
    ],
    fallback
  );
}

function compareWalletSummaries(
  left: { summary: WalletSummary; index: number },
  right: { summary: WalletSummary; index: number }
) {
  const leftRank = walletSummarySortRank(left.summary, left.index);
  const rightRank = walletSummarySortRank(right.summary, right.index);
  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }

  return (
    walletDisplayLabel(left.summary.wallet).localeCompare(walletDisplayLabel(right.summary.wallet), "zh-CN", {
      numeric: true
    }) || left.index - right.index
  );
}

function groupWalletRecords(wallets: WalletRecord[]) {
  const groups = new Map<string, WalletGroup>();
  wallets.forEach((wallet, index) => {
    const key = walletRecordGroupKey(wallet);
    const group =
      groups.get(key) ||
      ({
        key,
        label: walletRecordGroupLabel(wallet),
        displayLabel: walletRecordGroupLabel(wallet),
        wallets: [],
        addressTypes: []
      } satisfies WalletGroup);
    group.wallets.push(wallet);
    group.label = wallet.groupLabel || group.label;
    group.wallets.sort((a, b) => walletTypeRank(a) - walletTypeRank(b));
    group.addressTypes = Array.from(new Set(group.wallets.map((item) => item.addressType))).sort((a, b) =>
      walletTypeRank({ addressType: a }) - walletTypeRank({ addressType: b })
    );
    groups.set(key, group);
    if (!wallet.groupId && !wallet.groupLabel && group.label === wallet.label) {
      group.label = wallet.label || `钱包 ${index + 1}`;
    }
  });

  return Array.from(groups.values())
    .map((group) => ({ ...group, displayLabel: walletGroupDisplayLabel(group) }))
    .sort((a, b) => walletGroupSortRank(a, 999) - walletGroupSortRank(b, 999));
}

function holdingContractAddress(holding: Holding) {
  const address = holding.tokenContractAddress.trim();
  if (!address || address === "(native)") {
    return undefined;
  }

  return evmAddressPattern.test(address) ? address.toLowerCase() : address;
}

function nativeSymbolForHolding(holding: Pick<Holding, "chainIndex" | "chainName">) {
  const candidates = [holding.chainIndex, holding.chainName];
  for (const candidate of candidates) {
    const symbol = nativeSymbolsByChain[candidate.trim().toLowerCase()];
    if (symbol) {
      return symbol;
    }
  }
  return undefined;
}

function tokenAggregationKey(holding: Holding) {
  const symbol = canonicalTokenSymbol(holding.symbol);
  const contractAddress = holdingContractAddress(holding);
  const nativeSymbol = nativeSymbolForHolding(holding);
  if (contractAddress && nativeSymbol && symbol === nativeSymbol) {
    return `${symbol}:${holding.chainIndex || holding.chainName}:${contractAddress}`;
  }

  return symbol;
}

function visibleTokenGroups(holdings: Holding[]) {
  const groups = new Map<string, { symbol: string; iconUrl?: string; totalUsd: number; totalBalance: number }>();
  for (const holding of holdings) {
    if (holding.usdValue < minVisibleUsd) {
      continue;
    }

    const key = tokenAggregationKey(holding);
    const group = groups.get(key) || {
      symbol: holding.symbol,
      iconUrl: tokenIconUrl(holding.symbol, holding.iconUrl),
      totalUsd: 0,
      totalBalance: 0
    };
    group.iconUrl ||= tokenIconUrl(holding.symbol, holding.iconUrl);
    group.totalUsd += holding.usdValue;
    group.totalBalance += holding.balance;
    groups.set(key, group);
  }

  return Array.from(groups.values()).sort((a, b) => b.totalUsd - a.totalUsd);
}

function browserStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function snapshotTimestamp(snapshot?: Snapshot | null) {
  if (!snapshot) {
    return 0;
  }

  const timestamp = Date.parse(snapshot.generatedAt);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function readStoredSnapshot() {
  const storage = browserStorage();
  const raw = storage?.getItem(snapshotStorageKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Snapshot;
  } catch {
    storage?.removeItem(snapshotStorageKey);
    return null;
  }
}

function readStoredWallets() {
  const storage = browserStorage();
  const raw = storage?.getItem(walletsStorageKey);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as WalletRecord[];
    return Array.isArray(parsed) ? normalizeWalletRecords(parsed) : null;
  } catch {
    storage?.removeItem(walletsStorageKey);
    return null;
  }
}

function normalizeAssetGroupAssignments(
  input: unknown,
  wallets: WalletRecord[],
  assetGroups: AssetGroup[]
): AssetGroupAssignments {
  const source = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const validGroupIds = new Set(assetGroups.map((group) => group.id));
  const walletGroups = groupWalletRecords(wallets);
  return Object.fromEntries(
    walletGroups.map((group) => {
      const requestedGroupId = String(source[group.key] || "");
      const assetGroupId = validGroupIds.has(requestedGroupId)
        ? requestedGroupId
        : inferAssetGroupId(group.wallets.flatMap((wallet) => [wallet.groupLabel, wallet.label]));
      return [group.key, assetGroupId];
    })
  );
}

function normalizePortfolioState(input: unknown, fallbackWallets: WalletRecord[] = []): PortfolioState {
  const item = (input && typeof input === "object" ? input : {}) as Partial<PortfolioState>;
  const wallets = normalizeWalletRecords(Array.isArray(item.wallets) ? item.wallets : fallbackWallets);
  const assetGroups = normalizeAssetGroups(item.assetGroups);
  return {
    version: 2,
    wallets,
    assetGroups,
    assignments: normalizeAssetGroupAssignments(item.assignments, wallets, assetGroups),
    updatedAt: Number.isFinite(Date.parse(String(item.updatedAt || "")))
      ? String(item.updatedAt)
      : new Date().toISOString()
  };
}

function readStoredPortfolioState() {
  const storage = browserStorage();
  const raw = storage?.getItem(portfolioStateStorageKey);
  if (!raw) {
    return null;
  }

  try {
    return normalizePortfolioState(JSON.parse(raw));
  } catch {
    storage?.removeItem(portfolioStateStorageKey);
    return null;
  }
}

function writeStoredPortfolioState(state: PortfolioState) {
  const storage = browserStorage();
  try {
    storage?.setItem(portfolioStateStorageKey, JSON.stringify(normalizePortfolioState(state)));
    storage?.removeItem(walletsStorageKey);
  } catch {
    // Keep the current in-memory configuration if browser storage is unavailable.
  }
}

function portfolioStateTimestamp(state?: PortfolioState | null) {
  if (!state) {
    return 0;
  }
  const timestamp = Date.parse(state.updatedAt);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function mergeLegacyWallets(serverState: PortfolioState, legacyWallets: WalletRecord[]) {
  const walletsByAddress = new Map(serverState.wallets.map((wallet) => [wallet.address, wallet]));
  for (const wallet of legacyWallets) {
    walletsByAddress.set(wallet.address, wallet);
  }
  return normalizePortfolioState({
    ...serverState,
    wallets: Array.from(walletsByAddress.values()),
    updatedAt: new Date().toISOString()
  });
}

function writeStoredWallets(wallets: WalletRecord[]) {
  const storage = browserStorage();
  try {
    storage?.setItem(walletsStorageKey, JSON.stringify(normalizeWalletRecords(wallets)));
  } catch {
    // Wallet edits still update the current page even if browser storage is unavailable.
  }
}

function writeStoredSnapshot(snapshot: Snapshot) {
  const storage = browserStorage();
  try {
    storage?.setItem(snapshotStorageKey, JSON.stringify(snapshot));
  } catch {
    // Keep the refreshed in-memory view even when browser storage is unavailable.
  }
}

function removeStoredSnapshot() {
  browserStorage()?.removeItem(snapshotStorageKey);
}

function snapshotWalletAddresses(snapshot: Snapshot) {
  const addresses = new Set<string>();
  for (const summary of snapshot.walletSummary || []) {
    for (const wallet of walletSummaryMembers(summary)) {
      addresses.add(normalizeAddressInput(wallet.address));
    }

    for (const holding of summary.holdings || []) {
      addresses.add(normalizeAddressInput(holding.walletAddress));
    }
  }

  for (const item of [...(snapshot.errors || []), ...(snapshot.stale || []), ...(snapshot.skipped || [])]) {
    addresses.add(normalizeAddressInput(item.wallet.address));
  }

  return addresses;
}

function snapshotMatchesWallets(snapshot: Snapshot, wallets: WalletRecord[]) {
  const walletAddresses = new Set(wallets.map((wallet) => normalizeAddressInput(wallet.address)));
  for (const address of snapshotWalletAddresses(snapshot)) {
    if (!walletAddresses.has(address)) {
      return false;
    }
  }

  return true;
}

function newestSnapshot(...snapshots: Array<Snapshot | null | undefined>) {
  return snapshots.reduce<Snapshot | null>((latest, current) => {
    if (!current) {
      return latest;
    }

    if (!latest || snapshotTimestamp(current) > snapshotTimestamp(latest)) {
      return current;
    }

    return latest;
  }, null);
}

function snapshotHistoryPoint(snapshot: Snapshot): SnapshotHistoryPoint {
  const summaries = snapshot.walletSummary || [];
  return {
    generatedAt: snapshot.generatedAt,
    walletCount: snapshot.walletCount,
    totalUsd: snapshot.totalUsd,
    stablecoinUsd: snapshot.stablecoinUsd,
    volatileAssetUsd: snapshot.volatileAssetUsd,
    conservativeTotalUsd: snapshot.conservativeTotalUsd,
    okCount: summaries.filter((summary) => summary.status === "ok").length,
    staleCount: summaries.filter((summary) => summary.status === "stale").length,
    errorCount: summaries.filter((summary) => summary.status === "error").length,
    skippedCount: summaries.filter((summary) => summary.status === "skipped").length
  };
}

function mergeSnapshotHistory(history: SnapshotHistoryPoint[], snapshot: Snapshot | null) {
  const points = snapshot
    ? [...history.filter((point) => point.generatedAt !== snapshot.generatedAt), snapshotHistoryPoint(snapshot)]
    : history;
  return points
    .filter((point) => point.generatedAt && Number.isFinite(Date.parse(point.generatedAt)))
    .sort((left, right) => Date.parse(left.generatedAt) - Date.parse(right.generatedAt))
    .slice(-30);
}

function countWalletRecordGroups(wallets: WalletRecord[]) {
  return new Set(wallets.map((wallet) => walletRecordGroupKey(wallet))).size;
}

function aggregateTokenSummariesFromWallets(walletSummaries: WalletSummary[]) {
  const groups = new Map<
    string,
    {
      symbol: string;
      iconUrl?: string;
      totalUsd: number;
      totalBalance: number;
      walletKeys: Set<string>;
      holdingCount: number;
      chains: Map<string, { chainName: string; totalUsd: number; totalBalance: number }>;
      contracts: Set<string>;
      riskCount: number;
    }
  >();

  for (const summary of walletSummaries) {
    const walletKey = summary.wallet.groupId || summary.wallet.address;
    for (const holding of summary.holdings) {
      const key = tokenAggregationKey(holding);
      const group =
        groups.get(key) ||
        ({
          symbol: holding.symbol,
          iconUrl: tokenIconUrl(holding.symbol, holding.iconUrl),
          totalUsd: 0,
          totalBalance: 0,
          walletKeys: new Set<string>(),
          holdingCount: 0,
          chains: new Map<string, { chainName: string; totalUsd: number; totalBalance: number }>(),
          contracts: new Set<string>(),
          riskCount: 0
        } satisfies {
          symbol: string;
          iconUrl?: string;
          totalUsd: number;
          totalBalance: number;
          walletKeys: Set<string>;
          holdingCount: number;
          chains: Map<string, { chainName: string; totalUsd: number; totalBalance: number }>;
          contracts: Set<string>;
          riskCount: number;
        });

      group.iconUrl ||= tokenIconUrl(holding.symbol, holding.iconUrl);
      group.totalUsd += holding.usdValue;
      group.totalBalance += holding.balance;
      group.walletKeys.add(walletKey);
      group.holdingCount += 1;
      group.contracts.add(holding.tokenContractAddress || "(native)");
      if (holding.isRiskToken) {
        group.riskCount += 1;
      }

      const chainKey = holding.chainIndex || holding.chainName;
      const chain =
        group.chains.get(chainKey) ||
        ({
          chainName: holding.chainName,
          totalUsd: 0,
          totalBalance: 0
        } satisfies { chainName: string; totalUsd: number; totalBalance: number });
      chain.totalUsd += holding.usdValue;
      chain.totalBalance += holding.balance;
      group.chains.set(chainKey, chain);
      groups.set(key, group);
    }
  }

  return Array.from(groups.values())
    .map((group) => ({
      symbol: group.symbol,
      iconUrl: group.iconUrl || fallbackTokenIconUrl(group.symbol),
      totalUsd: group.totalUsd,
      totalBalance: group.totalBalance,
      walletCount: group.walletKeys.size,
      holdingCount: group.holdingCount,
      chainBreakdown: Array.from(group.chains.values()).sort((a, b) => b.totalUsd - a.totalUsd),
      contracts: Array.from(group.contracts).slice(0, 8),
      riskCount: group.riskCount
    }))
    .sort((a, b) => b.totalUsd - a.totalUsd);
}

function tokenUnitPrice(token: Pick<TokenSummary, "totalBalance" | "totalUsd">) {
  if (!Number.isFinite(token.totalBalance) || token.totalBalance <= 0) {
    return 0;
  }
  return token.totalUsd / token.totalBalance;
}

function summarizeChains(walletSummaries: WalletSummary[]): ChainExposureSummary[] {
  const chains = new Map<
    string,
    {
      chainKey: string;
      chainName: string;
      totalUsd: number;
      walletKeys: Set<string>;
      tokens: Map<string, ChainTokenSummary>;
    }
  >();

  for (const summary of walletSummaries) {
    const walletKey = walletSummaryGroupKey(summary);
    for (const holding of summary.holdings) {
      if (holding.usdValue <= 0) {
        continue;
      }
      const chainKey = holding.chainIndex || holding.chainName || "unknown";
      const chain = chains.get(chainKey) || {
        chainKey,
        chainName: holding.chainName || holding.chainIndex || "Unknown",
        totalUsd: 0,
        walletKeys: new Set<string>(),
        tokens: new Map<string, ChainTokenSummary>()
      };
      const tokenKey = tokenAggregationKey(holding);
      const token = chain.tokens.get(tokenKey) || {
        symbol: holding.symbol,
        iconUrl: tokenIconUrl(holding.symbol, holding.iconUrl),
        totalUsd: 0,
        totalBalance: 0,
        riskCount: 0
      };

      chain.totalUsd += holding.usdValue;
      chain.walletKeys.add(walletKey);
      token.iconUrl ||= tokenIconUrl(holding.symbol, holding.iconUrl);
      token.totalUsd += holding.usdValue;
      token.totalBalance += holding.balance;
      if (holding.isRiskToken) {
        token.riskCount += 1;
      }
      chain.tokens.set(tokenKey, token);
      chains.set(chainKey, chain);
    }
  }

  return Array.from(chains.values())
    .map((chain) => {
      const tokens = Array.from(chain.tokens.values()).sort((left, right) => right.totalUsd - left.totalUsd);
      const estimate = calculateConservativeEstimate(tokens);
      const visibleTokens = tokens.filter((token) => token.totalUsd >= minVisibleUsd);
      return {
        chainKey: chain.chainKey,
        chainName: chain.chainName,
        totalUsd: chain.totalUsd,
        stablecoinUsd: estimate.stablecoinUsd,
        volatileAssetUsd: estimate.volatileAssetUsd,
        conservativeTotalUsd: estimate.conservativeTotalUsd,
        walletCount: chain.walletKeys.size,
        tokenCount: visibleTokens.length,
        topTokens: visibleTokens.slice(0, 5)
      };
    })
    .filter((chain) => chain.totalUsd >= minVisibleUsd)
    .sort((left, right) => right.totalUsd - left.totalUsd);
}

function summarizeTopTokens(holdings: Holding[]) {
  const groups = new Map<string, { symbol: string; iconUrl?: string; totalUsd: number; totalBalance: number }>();
  for (const holding of holdings) {
    const key = tokenAggregationKey(holding);
    const group = groups.get(key) || {
      symbol: holding.symbol,
      iconUrl: tokenIconUrl(holding.symbol, holding.iconUrl),
      totalUsd: 0,
      totalBalance: 0
    };
    group.iconUrl ||= tokenIconUrl(holding.symbol, holding.iconUrl);
    group.totalUsd += holding.usdValue;
    group.totalBalance += holding.balance;
    groups.set(key, group);
  }

  return Array.from(groups.values())
    .sort((a, b) => b.totalUsd - a.totalUsd)
    .slice(0, 6);
}

function applyWalletsToSnapshot(snapshot: Snapshot | null, wallets: WalletRecord[]): Snapshot | null {
  if (!snapshot) {
    return null;
  }

  const normalizedWallets = normalizeWalletRecords(wallets);
  const walletsByAddress = new Map(normalizedWallets.map((wallet) => [wallet.address, wallet]));
  const nextWalletSummaries = regroupWalletSummaries(snapshot.walletSummary || [], normalizedWallets, {
    groupKey: walletRecordGroupKey,
    groupLabel: walletRecordGroupLabel,
    normalizeAddress: normalizeAddressInput,
    prepareHolding: (holding, wallet) => ({
      ...holding,
      walletId: wallet.id,
      walletLabel: wallet.label,
      walletAddress: wallet.address,
      iconUrl: tokenIconUrl(holding.symbol, holding.iconUrl)
    }),
    summarizeTopTokens,
    walletTypeRank
  });

  const tokenSummary = aggregateTokenSummariesFromWallets(nextWalletSummaries);
  const nextSnapshot = {
    ...snapshot,
    walletCount: countWalletRecordGroups(normalizedWallets),
    totalUsd: nextWalletSummaries.reduce((sum, summary) => sum + summary.totalUsd, 0),
    ...calculateConservativeEstimate(tokenSummary),
    tokenSummary,
    walletSummary: nextWalletSummaries
      .map((summary, index) => ({ summary, index }))
      .sort(compareWalletSummaries)
      .map((item) => item.summary),
    errors: (snapshot.errors || []).flatMap((item) => {
      const wallet = walletsByAddress.get(normalizeAddressInput(item.wallet.address));
      return wallet ? [{ ...item, wallet }] : [];
    }),
    stale: (snapshot.stale || []).flatMap((item) => {
      const wallet = walletsByAddress.get(normalizeAddressInput(item.wallet.address));
      return wallet ? [{ ...item, wallet }] : [];
    }),
    skipped: (snapshot.skipped || []).flatMap((item) => {
      const wallet = walletsByAddress.get(normalizeAddressInput(item.wallet.address));
      return wallet ? [{ ...item, wallet }] : [];
    })
  };

  return nextSnapshot;
}

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(runtimeAuthToken ? { "x-asset-tracker-token": runtimeAuthToken } : {}),
      ...(options?.headers || {})
    }
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    const error = new Error(payload?.error || `请求失败：${response.status}`) as ApiError;
    error.status = response.status;
    throw error;
  }

  return response.json() as Promise<T>;
}

function appPageFromPath() {
  return typeof window !== "undefined" && window.location.pathname.startsWith("/wallets") ? "wallets" : "overview";
}

function walletSummaryGroupKey(summary: WalletSummary) {
  return summary.wallet.groupId || walletRecordGroupKey(summary.wallet);
}

function summarizeAssetGroups(
  assetGroups: AssetGroup[],
  assignments: AssetGroupAssignments,
  walletGroups: WalletGroup[],
  walletSummaries: WalletSummary[]
): AssetGroupSummary[] {
  const summariesByWalletGroup = new Map(walletSummaries.map((summary) => [walletSummaryGroupKey(summary), summary]));

  return assetGroups.map((group) => {
    const matchingWalletGroups = walletGroups.filter(
      (walletGroup) => (assignments[walletGroup.key] || UNCLASSIFIED_ASSET_GROUP_ID) === group.id
    );
    const summaries = matchingWalletGroups.flatMap((walletGroup) => {
      const summary = summariesByWalletGroup.get(walletGroup.key);
      return summary ? [summary] : [];
    });
    const assetSummaries = summaries.filter((summary) => walletRefreshHasAssetData(summary.status));
    const tokenSummary = aggregateTokenSummariesFromWallets(assetSummaries);
    const estimate = calculateConservativeEstimate(tokenSummary);
    const missingWalletCount = Math.max(0, matchingWalletGroups.length - summaries.length);
    const problemWalletCount = summaries.filter((summary) => summary.status !== "ok").length;

    return {
      group,
      totalUsd: assetSummaries.reduce((sum, summary) => sum + summary.totalUsd, 0),
      stablecoinUsd: estimate.stablecoinUsd,
      conservativeTotalUsd: estimate.conservativeTotalUsd,
      coveredWalletCount: assetSummaries.length,
      missingWalletCount,
      walletCount: matchingWalletGroups.length,
      addressCount: matchingWalletGroups.reduce((sum, walletGroup) => sum + walletGroup.wallets.length, 0),
      topTokens: tokenSummary.filter((token) => token.totalUsd >= minVisibleUsd).slice(0, 5),
      issueCount: missingWalletCount + problemWalletCount
    };
  }).sort((left, right) => {
    const assetPriority = Number(right.totalUsd > 0) - Number(left.totalUsd > 0);
    return assetPriority || right.totalUsd - left.totalUsd || left.group.order - right.group.order;
  });
}

export default function App() {
  const compactManagementLayout = useMediaQuery("(max-width: 680px)", false);
  const [wallets, setWallets] = useState<WalletRecord[]>([]);
  const [assetGroups, setAssetGroups] = useState<AssetGroup[]>(defaultAssetGroups);
  const [assetGroupAssignments, setAssetGroupAssignments] = useState<AssetGroupAssignments>({});
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [snapshotHistory, setSnapshotHistory] = useState<SnapshotHistoryPoint[]>([]);
  const [config, setConfig] = useState<Config>({ authRequired: false, defaultChains: [], availableChains: [] });
  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  const [includeRisk, setIncludeRisk] = useState(false);
  const [appPage, setAppPage] = useState<"overview" | "wallets">(appPageFromPath);
  const [activeView, setActiveView] = useState<AssetView>("groups");
  const [selectedAssetGroupId, setSelectedAssetGroupId] = useState("all");
  const [walletRefreshFilter, setWalletRefreshFilter] = useState<WalletRefreshFilter>("all");
  const [query, setQuery] = useState("");
  const [walletImportText, setWalletImportText] = useState("");
  const [walletImportError, setWalletImportError] = useState<string | null>(null);
  const [walletImportOpen, setWalletImportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draftSelectedChains, setDraftSelectedChains] = useState<string[]>([]);
  const [draftIncludeRisk, setDraftIncludeRisk] = useState(false);
  const [selectedWalletGroupKeys, setSelectedWalletGroupKeys] = useState<string[]>([]);
  const [expandedWalletGroupKeys, setExpandedWalletGroupKeys] = useState<string[]>([]);
  const [managementAssetGroupId, setManagementAssetGroupId] = useState("all");
  const [managementRefreshFilter, setManagementRefreshFilter] = useState<WalletRefreshFilter>("all");
  const [assetGroupPanelOpen, setAssetGroupPanelOpen] = useState(false);
  const [managementSort, setManagementSort] = useState<ManagementSort>("sequence");
  const [managementPage, setManagementPage] = useState(1);
  const [batchAssetGroupId, setBatchAssetGroupId] = useState(UNCLASSIFIED_ASSET_GROUP_ID);
  const [newAssetGroupName, setNewAssetGroupName] = useState("");
  const [newAssetGroupColor, setNewAssetGroupColor] = useState<AssetGroupColor>(
    assetGroupColorForIndex(defaultAssetGroups.length)
  );
  const [editingAssetGroupId, setEditingAssetGroupId] = useState<string | null>(null);
  const [editingAssetGroupName, setEditingAssetGroupName] = useState("");
  const [editingAssetGroupColor, setEditingAssetGroupColor] = useState<AssetGroupColor>("gray");
  const [editingGroupKey, setEditingGroupKey] = useState<string | null>(null);
  const [editingGroupLabel, setEditingGroupLabel] = useState("");
  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [deleteIntent, setDeleteIntent] = useState<DeleteIntent | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [authInput, setAuthInput] = useState("");
  const [persistence, setPersistence] = useState<"vercel-blob" | "local-file" | null>(null);
  const authInputRef = useRef<HTMLInputElement>(null);
  const overviewSearchRef = useRef<HTMLInputElement>(null);
  const walletRefreshFilterRef = useRef<HTMLButtonElement>(null);
  const managementSearchRef = useRef<HTMLInputElement>(null);
  const managementRefreshFilterRef = useRef<HTMLButtonElement>(null);
  const walletImportInputRef = useRef<HTMLTextAreaElement>(null);
  const walletIssuesPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    browserStorage()?.removeItem(legacyAuthTokenStorageKey);
    void loadInitial();
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setSettingsOpen(false);
      setWalletImportOpen(false);
      setAssetGroupPanelOpen(false);
      setDeleteIntent(null);
      setAppPage(appPageFromPath());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (authRequired || !config.authRequired) {
      return;
    }

    let idleTimer = window.setTimeout(lockApp, authIdleTimeoutMs);
    const resetIdleTimer = () => {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(lockApp, authIdleTimeoutMs);
    };
    const events: Array<keyof WindowEventMap> = ["keydown", "pointerdown", "scroll"];
    events.forEach((eventName) => window.addEventListener(eventName, resetIdleTimer, { passive: true }));

    return () => {
      window.clearTimeout(idleTimer);
      events.forEach((eventName) => window.removeEventListener(eventName, resetIdleTimer));
    };
  }, [authRequired, config.authRequired]);

  async function loadInitial(announce = false) {
    setLoading(true);
    setError(null);
    try {
      const [configPayload, statePayload, snapshotPayload, historyPayload] = await Promise.all([
        api<Config>("/api/config"),
        api<{ state: PortfolioState; persistence: "vercel-blob" | "local-file" }>("/api/state"),
        api<Snapshot | null>("/api/snapshot"),
        api<SnapshotHistoryPoint[]>("/api/history")
      ]);
      const serverState = normalizePortfolioState(statePayload.state);
      const storedState = readStoredPortfolioState();
      const legacyWallets = storedState ? null : readStoredWallets();
      let nextPortfolioState =
        storedState && portfolioStateTimestamp(storedState) > portfolioStateTimestamp(serverState)
          ? storedState
          : serverState;
      if (legacyWallets?.length) {
        nextPortfolioState = mergeLegacyWallets(nextPortfolioState, legacyWallets);
      }

      const nextWallets = nextPortfolioState.wallets;
      const storedSnapshot = readStoredSnapshot();
      const serverSnapshot = applyWalletsToSnapshot(snapshotPayload, nextWallets);
      const compatibleStoredSnapshot =
        storedSnapshot && snapshotMatchesWallets(storedSnapshot, nextWallets)
          ? applyWalletsToSnapshot(storedSnapshot, nextWallets)
          : null;
      const nextSnapshot = newestSnapshot(serverSnapshot, compatibleStoredSnapshot);

      if (storedSnapshot && !compatibleStoredSnapshot) {
        removeStoredSnapshot();
      }
      if (nextSnapshot) {
        writeStoredSnapshot(nextSnapshot);
      }
      writeStoredPortfolioState(nextPortfolioState);

      setConfig(configPayload);
      setWallets(nextWallets);
      setAssetGroups(nextPortfolioState.assetGroups);
      setAssetGroupAssignments(nextPortfolioState.assignments);
      setSnapshot(nextSnapshot);
      setSnapshotHistory(mergeSnapshotHistory(historyPayload, nextSnapshot));
      setPersistence(statePayload.persistence);
      if (nextSnapshot) {
        setIncludeRisk(nextSnapshot.includeRisk);
        setSelectedChains(Array.from(new Set([...nextSnapshot.chains, ...configPayload.defaultChains])));
      } else {
        setSelectedChains(configPayload.defaultChains);
      }

      let loadedWallets = nextWallets;
      if (portfolioStateTimestamp(nextPortfolioState) > portfolioStateTimestamp(serverState)) {
        const synced = await api<{ state: PortfolioState; persistence: "vercel-blob" | "local-file" }>("/api/state", {
          method: "PUT",
          body: JSON.stringify(nextPortfolioState)
        });
        const normalizedSyncedState = normalizePortfolioState(synced.state);
        loadedWallets = normalizedSyncedState.wallets;
        writeStoredPortfolioState(normalizedSyncedState);
        setWallets(normalizedSyncedState.wallets);
        setAssetGroups(normalizedSyncedState.assetGroups);
        setAssetGroupAssignments(normalizedSyncedState.assignments);
        setPersistence(synced.persistence);
      }

      if (announce) {
        toast.success("资产配置已重新载入", {
          action: {
            label: (
              <ToastActionLabel icon={<RefreshCw />}>
                刷新资产
              </ToastActionLabel>
            ),
            onClick: () => {
              navigate("overview");
              void refresh(loadedWallets);
            }
          },
          description: `已读取 ${loadedWallets.length} 个链上地址。`,
          id: "portfolio-reload"
        });
      }
    } catch (nextError) {
      const apiError = nextError as ApiError;
      if (apiError.status === 401) {
        const hadAuthToken = Boolean(runtimeAuthToken);
        runtimeAuthToken = "";
        setAuthRequired(true);
        setError(hadAuthToken ? "访问口令不正确。" : null);
      } else {
        setError(apiError.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function unlock(event: FormEvent) {
    event.preventDefault();
    const token = authInput.trim();
    if (!token) {
      setError("请输入访问口令。");
      window.requestAnimationFrame(() => authInputRef.current?.focus({ preventScroll: true }));
      return;
    }

    runtimeAuthToken = token;
    setAuthRequired(false);
    setAuthInput("");
    setError(null);
    await loadInitial();
  }

  function lockApp() {
    runtimeAuthToken = "";
    browserStorage()?.removeItem(legacyAuthTokenStorageKey);
    setSettingsOpen(false);
    setWalletImportOpen(false);
    setAssetGroupPanelOpen(false);
    setDeleteIntent(null);
    setAuthInput("");
    setError(null);
    setAuthRequired(true);
    window.requestAnimationFrame(() => authInputRef.current?.focus({ preventScroll: true }));
  }

  function navigate(nextPage: "overview" | "wallets") {
    const path = nextPage === "wallets" ? "/wallets" : "/";
    setSettingsOpen(false);
    setWalletImportOpen(false);
    setAssetGroupPanelOpen(false);
    setDeleteIntent(null);
    window.history.pushState({}, "", path);
    setAppPage(nextPage);
    setQuery("");
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  async function persistPortfolio(
    nextWallets: WalletRecord[],
    nextAssetGroups: AssetGroup[],
    nextAssignments: AssetGroupAssignments,
    nextMessage: string,
    successAction?: PortfolioSuccessAction
  ) {
    const normalizedWallets = normalizeWalletRecords(nextWallets);
    const normalizedAssetGroups = normalizeAssetGroups(nextAssetGroups);
    const state = normalizePortfolioState({
      version: 2,
      wallets: normalizedWallets,
      assetGroups: normalizedAssetGroups,
      assignments: nextAssignments,
      updatedAt: new Date().toISOString()
    });
    writeStoredPortfolioState(state);
    setWallets(normalizedWallets);
    setAssetGroups(state.assetGroups);
    setAssetGroupAssignments(state.assignments);
    setSnapshot((current) => {
      const nextSnapshot = applyWalletsToSnapshot(current, normalizedWallets);
      if (nextSnapshot) {
        writeStoredSnapshot(nextSnapshot);
      } else {
        removeStoredSnapshot();
      }
      return nextSnapshot;
    });
    setError(null);

    try {
      const payload = await api<{ state: PortfolioState; persistence: "vercel-blob" | "local-file" }>("/api/state", {
        method: "PUT",
        body: JSON.stringify(state)
      });
      const syncedState = normalizePortfolioState(payload.state);
      writeStoredPortfolioState(syncedState);
      setPersistence(payload.persistence);
      toast.success(nextMessage, {
        action: successAction
          ? {
              label: successAction.label,
              onClick: () => successAction.onClick(syncedState.wallets)
            }
          : undefined,
        id: "portfolio-operation"
      });
    } catch (nextError) {
      setError(`已保存在当前浏览器，但云端同步失败：${(nextError as Error).message}`);
    }
  }

  function persistWallets(
    nextWallets: WalletRecord[],
    nextMessage: string,
    nextAssignments: AssetGroupAssignments = assetGroupAssignments,
    successAction?: PortfolioSuccessAction
  ) {
    void persistPortfolio(nextWallets, assetGroups, nextAssignments, nextMessage, successAction);
  }

  async function refresh(activeWallets: WalletRecord[] = wallets) {
    setRefreshing(true);
    toast.dismiss("portfolio-refresh");
    setError(null);
    try {
      const nextSnapshot = await api<Snapshot>("/api/refresh", {
        method: "POST",
        body: JSON.stringify({
          chains: selectedChains,
          includeRisk,
          wallets: activeWallets
        })
      });
      const hydratedSnapshot = applyWalletsToSnapshot(nextSnapshot, activeWallets) || nextSnapshot;
      writeStoredSnapshot(hydratedSnapshot);
      setSnapshot(hydratedSnapshot);
      const historyPayload = await api<SnapshotHistoryPoint[]>("/api/history").catch(() => null);
      setSnapshotHistory((current) => mergeSnapshotHistory(historyPayload || current, hydratedSnapshot));
      if (hydratedSnapshot.needsLogin) {
        toast.warning("刷新需要登录", {
          description: "登录 OKX Onchain OS 后才能恢复完整资产数据。",
          id: "portfolio-refresh"
        });
      } else if (hydratedSnapshot.errors.length) {
        toast.warning("刷新部分完成", {
          description: `${hydratedSnapshot.errors.length} 个钱包刷新失败，请查看刷新质量。`,
          id: "portfolio-refresh"
        });
      } else if (hydratedSnapshot.stale?.length) {
        toast.warning("资产快照已保存", {
          description: `${hydratedSnapshot.stale.length} 个钱包沿用上次成功数据。`,
          id: "portfolio-refresh"
        });
      } else {
        toast.success("资产快照已刷新并保存。", { id: "portfolio-refresh" });
      }
    } catch (nextError) {
      setError((nextError as Error).message);
    } finally {
      setRefreshing(false);
    }
  }

  function importWallets(event: FormEvent) {
    event.preventDefault();
    const analysis = analyzeWalletImport(walletImportText, wallets, walletGroups.length);
    if (!analysis.lineCount) {
      rejectWalletImport("请输入至少一个钱包地址。");
      return;
    }

    if (!analysis.wallets.length) {
      rejectWalletImport(
        analysis.issues
          .slice(0, 4)
          .map((issue) => `第 ${issue.lineNumber} 行${issue.message}`)
          .join("；") || "没有可添加的钱包地址。"
      );
      return;
    }

    const nextWallets = [...wallets, ...analysis.wallets];
    persistWallets(
      nextWallets,
      analysis.issues.length
        ? `已添加 ${analysis.wallets.length} 个地址，跳过 ${analysis.issues.length} 行。`
        : `已添加 ${analysis.wallets.length} 个地址并保存。`,
      assetGroupAssignments,
      {
        label: (
          <ToastActionLabel icon={<RefreshCw />}>
            刷新资产
          </ToastActionLabel>
        ),
        onClick: (syncedWallets) => {
          navigate("overview");
          void refresh(syncedWallets);
        }
      }
    );
    setWalletImportError(null);
    setWalletImportText("");
    setWalletImportOpen(false);
  }

  function rejectWalletImport(message: string) {
    setWalletImportError(message);
    window.requestAnimationFrame(() => walletImportInputRef.current?.focus({ preventScroll: true }));
  }

  async function deleteWallet(address: string) {
    await persistPortfolio(
      wallets.filter((wallet) => wallet.address !== address),
      assetGroups,
      assetGroupAssignments,
      "钱包地址已删除并保存。"
    );
    return true;
  }

  function saveGroupLabel(groupKey: string) {
    const label = editingGroupLabel.trim();
    if (!label) {
      setError("钱包名称不能为空。");
      return false;
    }
    persistWallets(
      wallets.map((wallet) => (walletRecordGroupKey(wallet) === groupKey ? { ...wallet, groupLabel: label } : wallet)),
      "钱包名称已更新并保存。"
    );
    setEditingGroupKey(null);
    setEditingGroupLabel("");
    return true;
  }

  function walletPairOptions(wallet: WalletRecord) {
    const currentGroupKey = walletRecordGroupKey(wallet);
    return walletGroups.filter(
      (group) => group.key === currentGroupKey || !group.addressTypes.includes(wallet.addressType)
    );
  }

  function updateWalletPair(address: string, nextGroupKey: string) {
    const transition = reassignWalletPairing(wallets, address, nextGroupKey, assetGroupAssignments);
    if (!transition.changed) {
      return;
    }
    persistWallets(
      transition.wallets,
      "EVM/SOL 配对已更新并保存。",
      transition.assignments
    );
  }

  function saveLabel(address: string) {
    const label = editingLabel.trim();
    if (!label) {
      setError("标签不能为空。");
      return false;
    }
    persistWallets(
      wallets.map((wallet) => (wallet.address === address ? { ...wallet, label } : wallet)),
      "钱包标签已更新并保存。"
    );
    setEditingAddress(null);
    setEditingLabel("");
    return true;
  }

  function createAssetGroup(event: FormEvent) {
    event.preventDefault();
    const name = newAssetGroupName.trim();
    if (!name) {
      setError("资产组名称不能为空。");
      return;
    }
    if (assetGroups.some((group) => group.name.toLowerCase() === name.toLowerCase())) {
      setError("已经存在同名资产组。");
      return;
    }

    const group: AssetGroup = {
      id: `asset-group-${Date.now().toString(36)}`,
      name,
      color: newAssetGroupColor,
      order: Math.max(0, ...assetGroups.filter((item) => !item.system).map((item) => item.order)) + 10,
      createdAt: new Date().toISOString()
    };
    void persistPortfolio(wallets, [...assetGroups, group], assetGroupAssignments, `资产组“${name}”已创建。`);
    setNewAssetGroupName("");
    setNewAssetGroupColor(assetGroupColorForIndex(assetGroups.length + 1));
    selectManagementAssetGroup(group.id);
  }

  function selectManagementAssetGroup(assetGroupId: string) {
    setManagementAssetGroupId(assetGroupId);
    setSelectedWalletGroupKeys([]);
    setEditingAssetGroupId(null);
    setEditingAssetGroupName("");
    setEditingAssetGroupColor("gray");
    setAssetGroupPanelOpen(false);
  }

  function saveAssetGroup(assetGroupId: string) {
    const name = editingAssetGroupName.trim();
    if (!name) {
      setError("资产组名称不能为空。");
      return false;
    }
    if (assetGroups.some((group) => group.id !== assetGroupId && group.name.toLowerCase() === name.toLowerCase())) {
      setError("已经存在同名资产组。");
      return false;
    }

    void persistPortfolio(
      wallets,
      assetGroups.map((group) => (
        group.id === assetGroupId ? { ...group, name, color: editingAssetGroupColor } : group
      )),
      assetGroupAssignments,
      "资产组已更新。"
    );
    setEditingAssetGroupId(null);
    setEditingAssetGroupName("");
    setEditingAssetGroupColor("gray");
    return true;
  }

  async function deleteAssetGroup(assetGroup: AssetGroup) {
    if (assetGroup.system || assetGroup.id === UNCLASSIFIED_ASSET_GROUP_ID) {
      return false;
    }

    const nextAssignments = Object.fromEntries(
      Object.entries(assetGroupAssignments).map(([walletGroupId, assignedGroupId]) => [
        walletGroupId,
        assignedGroupId === assetGroup.id ? UNCLASSIFIED_ASSET_GROUP_ID : assignedGroupId
      ])
    );
    await persistPortfolio(
      wallets,
      assetGroups.filter((group) => group.id !== assetGroup.id),
      nextAssignments,
      `资产组“${assetGroup.name}”已删除，原有钱包已移到未分类。`
    );
    if (managementAssetGroupId === assetGroup.id) {
      setManagementAssetGroupId(UNCLASSIFIED_ASSET_GROUP_ID);
    }
    if (selectedAssetGroupId === assetGroup.id) {
      setSelectedAssetGroupId("all");
    }
    return true;
  }

  async function confirmDeleteIntent() {
    if (!deleteIntent) {
      return false;
    }
    if (deleteIntent.kind === "asset-group") {
      return deleteAssetGroup(deleteIntent.assetGroup);
    }
    return deleteWallet(deleteIntent.wallet.address);
  }

  function assignWalletGroups(walletGroupKeys: string[], assetGroupId: string) {
    if (!walletGroupKeys.length || !assetGroups.some((group) => group.id === assetGroupId)) {
      return;
    }
    const changedWalletGroupKeys = walletGroupKeys.filter(
      (walletGroupKey) =>
        (assetGroupAssignments[walletGroupKey] || UNCLASSIFIED_ASSET_GROUP_ID) !== assetGroupId
    );
    if (!changedWalletGroupKeys.length) {
      return;
    }
    const nextAssignments = { ...assetGroupAssignments };
    for (const walletGroupKey of changedWalletGroupKeys) {
      nextAssignments[walletGroupKey] = assetGroupId;
    }
    const assetGroup = assetGroups.find((group) => group.id === assetGroupId)!;
    void persistPortfolio(
      wallets,
      assetGroups,
      nextAssignments,
      `${changedWalletGroupKeys.length} 个钱包已移到“${assetGroup.name}”。`
    );
    setSelectedWalletGroupKeys([]);
  }

  function restoreWalletSelectionFocus(walletGroupKey?: string) {
    window.requestAnimationFrame(() => {
      const walletCheckbox = walletGroupKey
        ? document.getElementById(walletGroupSelectId(walletGroupKey))
        : null;
      if (walletCheckbox instanceof HTMLElement) {
        walletCheckbox.focus({ preventScroll: true });
        return;
      }
      managementSearchRef.current?.focus({ preventScroll: true });
    });
  }

  function clearWalletGroupSelection() {
    const focusWalletGroupKey = managementWalletPage.find((group) =>
      selectedWalletGroupKeys.includes(group.key)
    )?.key;
    setSelectedWalletGroupKeys([]);
    restoreWalletSelectionFocus(focusWalletGroupKey);
  }

  function moveSelectedWalletGroups() {
    const focusWalletGroupKey = managementWalletPage.find((group) =>
      selectedWalletGroupKeys.includes(group.key)
    )?.key;
    assignWalletGroups(selectedWalletGroupKeys, batchAssetGroupId);
    restoreWalletSelectionFocus(focusWalletGroupKey);
  }

  function toggleWalletGroupSelection(walletGroupKey: string) {
    setSelectedWalletGroupKeys((current) =>
      current.includes(walletGroupKey)
        ? current.filter((item) => item !== walletGroupKey)
        : [...current, walletGroupKey]
    );
  }

  function toggleWalletGroupExpanded(walletGroupKey: string) {
    setExpandedWalletGroupKeys((current) =>
      current.includes(walletGroupKey)
        ? current.filter((item) => item !== walletGroupKey)
        : [...current, walletGroupKey]
    );
  }

  function openRefreshSettings() {
    setDraftSelectedChains(selectedChains);
    setDraftIncludeRisk(includeRisk);
    setSettingsOpen(true);
  }

  function applyRefreshSettings() {
    setSelectedChains(draftSelectedChains);
    setIncludeRisk(draftIncludeRisk);
    setSettingsOpen(false);
  }

  function toggleDraftChain(chain: string) {
    setDraftSelectedChains((current) =>
      current.includes(chain) ? current.filter((item) => item !== chain) : [...current, chain]
    );
  }

  function openWalletImport() {
    setWalletImportError(null);
    if (appPage !== "wallets") {
      navigate("wallets");
      window.requestAnimationFrame(() => setWalletImportOpen(true));
      return;
    }
    setWalletImportOpen(true);
  }

  function clearOverviewAssetSearch() {
    setQuery("");
    window.requestAnimationFrame(() => overviewSearchRef.current?.focus({ preventScroll: true }));
  }

  function clearWalletFilters() {
    const shouldFocusStatusFilter = walletRefreshFilter !== "all";
    setQuery("");
    setWalletRefreshFilter("all");
    window.requestAnimationFrame(() => {
      (shouldFocusStatusFilter ? walletRefreshFilterRef.current : overviewSearchRef.current)?.focus({
        preventScroll: true
      });
    });
  }

  function clearManagementWalletSearch() {
    setQuery("");
    setSelectedWalletGroupKeys([]);
    window.requestAnimationFrame(() => managementSearchRef.current?.focus({ preventScroll: true }));
  }

  function clearManagementWalletFilters() {
    const shouldFocusStatusFilter = managementRefreshFilter !== "all";
    setQuery("");
    setManagementRefreshFilter("all");
    setSelectedWalletGroupKeys([]);
    window.requestAnimationFrame(() => {
      (shouldFocusStatusFilter ? managementRefreshFilterRef.current : managementSearchRef.current)?.focus({
        preventScroll: true
      });
    });
  }

  function selectAssetView(view: AssetView) {
    if (view !== activeView) {
      setQuery("");
      setWalletRefreshFilter("all");
    }
    if (view === "groups") {
      setSelectedAssetGroupId("all");
    }
    setActiveView(view);
  }

  function inspectWalletIssues() {
    setSelectedAssetGroupId("all");
    selectAssetView("wallets");
    setWalletRefreshFilter("issues");
    window.requestAnimationFrame(() => {
      const panel = walletIssuesPanelRef.current;
      panel?.focus({ preventScroll: true });
      panel?.scrollIntoView({ behavior: "auto", block: "start" });
    });
  }

  const walletGroups = useMemo(() => groupWalletRecords(wallets), [wallets]);
  const assetGroupSummaries = useMemo(
    () => summarizeAssetGroups(assetGroups, assetGroupAssignments, walletGroups, snapshot?.walletSummary || []),
    [assetGroupAssignments, assetGroups, snapshot, walletGroups]
  );
  const scopedWalletSummaries = useMemo(() => {
    const summaries = (snapshot?.walletSummary || [])
      .map((summary, index) => ({ summary, index }))
      .sort(compareWalletSummaries)
      .map((item) => item.summary);
    if (selectedAssetGroupId === "all") {
      return summaries;
    }
    return summaries.filter(
      (summary) =>
        (assetGroupAssignments[walletSummaryGroupKey(summary)] || UNCLASSIFIED_ASSET_GROUP_ID) ===
        selectedAssetGroupId
    );
  }, [assetGroupAssignments, selectedAssetGroupId, snapshot]);
  const scopedAssetWalletSummaries = useMemo(
    () => scopedWalletSummaries.filter((summary) => walletRefreshHasAssetData(summary.status)),
    [scopedWalletSummaries]
  );
  const scopedTokenSummaries = useMemo(
    () => aggregateTokenSummariesFromWallets(scopedAssetWalletSummaries),
    [scopedAssetWalletSummaries]
  );
  const scopedEstimate = useMemo(
    () => calculateConservativeEstimate(scopedTokenSummaries),
    [scopedTokenSummaries]
  );
  const scopedChainSummaries = useMemo(
    () => summarizeChains(scopedAssetWalletSummaries),
    [scopedAssetWalletSummaries]
  );
  const scopedWalletGroups = useMemo(() => {
    if (selectedAssetGroupId === "all") {
      return walletGroups;
    }
    return walletGroups.filter(
      (group) => (assetGroupAssignments[group.key] || UNCLASSIFIED_ASSET_GROUP_ID) === selectedAssetGroupId
    );
  }, [assetGroupAssignments, selectedAssetGroupId, walletGroups]);

  const filteredTokens = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const tokens = scopedTokenSummaries.filter((token) => token.totalUsd >= minVisibleUsd);
    if (!needle) {
      return tokens;
    }
    return tokens.filter((token) => {
      return (
        token.symbol.toLowerCase().includes(needle) ||
        token.contracts.some((contract) => contract.toLowerCase().includes(needle))
      );
    });
  }, [query, scopedTokenSummaries]);

  const filteredChains = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return scopedChainSummaries;
    }
    return scopedChainSummaries.filter(
      (chain) =>
        chain.chainName.toLowerCase().includes(needle) ||
        chain.chainKey.toLowerCase().includes(needle) ||
        chain.topTokens.some((token) => token.symbol.toLowerCase().includes(needle))
    );
  }, [query, scopedChainSummaries]);

  const walletSummariesByGroupKey = useMemo(
    () => new Map((snapshot?.walletSummary || []).map((summary) => [walletSummaryGroupKey(summary), summary])),
    [snapshot]
  );

  const scopedWalletRefreshCounts = useMemo(() => {
    return countWalletRefreshStates(
      scopedWalletGroups.map((walletGroup) => walletSummariesByGroupKey.get(walletGroup.key)?.status)
    );
  }, [scopedWalletGroups, walletSummariesByGroupKey]);

  const filteredWalletGroups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return scopedWalletGroups.filter((walletGroup) => {
      const summary = walletSummariesByGroupKey.get(walletGroup.key);
      if (!walletRefreshMatchesFilter(summary?.status, walletRefreshFilter)) {
        return false;
      }
      if (!needle) {
        return true;
      }
      const visibleTokens = summary && walletRefreshHasAssetData(summary.status)
        ? visibleTokenGroups(summary.holdings)
        : [];
      return (
        walletGroup.displayLabel.toLowerCase().includes(needle) ||
        walletGroup.label.toLowerCase().includes(needle) ||
        walletGroup.wallets.some(
          (wallet) =>
            wallet.label.toLowerCase().includes(needle) ||
            wallet.address.toLowerCase().includes(needle) ||
            walletDisplayLabel(wallet).toLowerCase().includes(needle)
        ) ||
        visibleTokens.some((token) => token.symbol.toLowerCase().includes(needle))
      );
    });
  }, [query, scopedWalletGroups, walletRefreshFilter, walletSummariesByGroupKey]);

  const managementAssetGroupItems = useMemo<AssetGroupManagerItem[]>(() => {
    const walletCounts = new Map<string, number>();
    for (const walletGroup of walletGroups) {
      const assetGroupId = assetGroupAssignments[walletGroup.key] || UNCLASSIFIED_ASSET_GROUP_ID;
      walletCounts.set(assetGroupId, (walletCounts.get(assetGroupId) || 0) + 1);
    }
    return assetGroups.map((group) => ({ group, walletCount: walletCounts.get(group.id) || 0 }));
  }, [assetGroupAssignments, assetGroups, walletGroups]);

  const managementWalletCandidates = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return walletGroups.filter((group) => {
      const matchesAssetGroup =
        managementAssetGroupId === "all" ||
        (assetGroupAssignments[group.key] || UNCLASSIFIED_ASSET_GROUP_ID) === managementAssetGroupId;
      const matchesQuery =
        !needle ||
        group.displayLabel.toLowerCase().includes(needle) ||
        group.wallets.some(
          (wallet) => wallet.label.toLowerCase().includes(needle) || wallet.address.toLowerCase().includes(needle)
        );
      return matchesAssetGroup && matchesQuery;
    });
  }, [assetGroupAssignments, managementAssetGroupId, query, walletGroups]);

  const managementRefreshCounts = useMemo(() => {
    return countWalletRefreshStates(
      managementWalletCandidates.map((walletGroup) => walletSummariesByGroupKey.get(walletGroup.key)?.status)
    );
  }, [managementWalletCandidates, walletSummariesByGroupKey]);

  const managementWalletGroups = useMemo(() => {
    const matchingGroups = managementWalletCandidates.filter((walletGroup) =>
      walletRefreshMatchesFilter(
        walletSummariesByGroupKey.get(walletGroup.key)?.status,
        managementRefreshFilter
      )
    );

    if (managementSort === "assets-desc") {
      return [...matchingGroups].sort((left, right) => {
        const leftSummary = walletSummariesByGroupKey.get(left.key);
        const rightSummary = walletSummariesByGroupKey.get(right.key);
        const leftHasAssets = walletRefreshHasAssetData(leftSummary?.status);
        const rightHasAssets = walletRefreshHasAssetData(rightSummary?.status);
        if (leftHasAssets !== rightHasAssets) {
          return rightHasAssets ? 1 : -1;
        }
        const assetDifference =
          (rightHasAssets ? rightSummary?.totalUsd || 0 : 0) -
          (leftHasAssets ? leftSummary?.totalUsd || 0 : 0);
        return assetDifference || walletGroupSortRank(left, 999) - walletGroupSortRank(right, 999);
      });
    }

    if (managementSort === "name") {
      return [...matchingGroups].sort((left, right) =>
        left.displayLabel.localeCompare(right.displayLabel, "zh-CN", { numeric: true })
      );
    }

    return matchingGroups;
  }, [
    managementRefreshFilter,
    managementSort,
    managementWalletCandidates,
    walletSummariesByGroupKey
  ]);

  const managementPageCount = Math.max(1, Math.ceil(managementWalletGroups.length / managementPageSize));
  const activeManagementPage = Math.min(managementPage, managementPageCount);
  const managementPageStart = (activeManagementPage - 1) * managementPageSize;
  const managementPageEnd = Math.min(managementPageStart + managementPageSize, managementWalletGroups.length);
  const managementPageRangeStart = managementWalletGroups.length ? managementPageStart + 1 : 0;
  const managementWalletPage = managementWalletGroups.slice(managementPageStart, managementPageEnd);

  useEffect(() => {
    if (appPage === "wallets") {
      setManagementPage(1);
    }
  }, [appPage, managementAssetGroupId, managementRefreshFilter, managementSort, query]);

  useEffect(() => {
    setManagementPage((current) => Math.min(current, managementPageCount));
  }, [managementPageCount]);

  function changeManagementPage(nextPage: number) {
    const clampedPage = Math.min(Math.max(1, nextPage), managementPageCount);
    if (clampedPage === activeManagementPage) {
      return;
    }

    const firstWallet = managementWalletGroups[(clampedPage - 1) * managementPageSize];
    setManagementPage(clampedPage);
    window.requestAnimationFrame(() => {
      const table = document.getElementById("wallet-management-table");
      table?.closest<HTMLElement>("[data-slot='table-container']")?.scrollTo({ top: 0, behavior: "auto" });
      table?.scrollIntoView({ block: "start", behavior: "auto" });
      if (firstWallet) {
        document.getElementById(walletGroupSelectId(firstWallet.key))?.focus({ preventScroll: true });
      }
    });
  }

  const walletImportAnalysis = useMemo(
    () => analyzeWalletImport(walletImportText, wallets, walletGroups.length),
    [walletGroups.length, walletImportText, wallets]
  );
  const commonRefreshChains = config.availableChains.filter((chain) => config.defaultChains.includes(chain));
  const extendedRefreshChains = config.availableChains.filter((chain) => !config.defaultChains.includes(chain));
  const solanaWalletCount = wallets.filter((wallet) => wallet.addressType === "solana").length;
  const visibleTokenCount = scopedTokenSummaries.filter((token) => token.totalUsd >= minVisibleUsd).length;
  const scopedTotalUsd = scopedAssetWalletSummaries.reduce((sum, summary) => sum + summary.totalUsd, 0);
  const scopedAddressCount = scopedWalletGroups.reduce((sum, group) => sum + group.wallets.length, 0);
  const scopedSolanaAddressCount = scopedWalletGroups.reduce(
    (sum, group) => sum + group.wallets.filter((wallet) => wallet.addressType === "solana").length,
    0
  );
  const scopedPairedWalletCount = scopedWalletGroups.filter(
    (group) => group.addressTypes.includes("evm") && group.addressTypes.includes("solana")
  ).length;
  const scopedStandaloneSolanaCount = scopedWalletGroups.filter(
    (group) => group.addressTypes.length === 1 && group.addressTypes[0] === "solana"
  ).length;
  const tracksSolana = selectedChains.includes("solana");
  const walletMeta = tracksSolana
    ? `${scopedAddressCount} 地址 · SOL ${scopedSolanaAddressCount}`
    : `${scopedAddressCount} 个地址`;
  const walletMetaLabel = tracksSolana
    ? `共 ${scopedAddressCount} 个链上地址；Solana ${scopedSolanaAddressCount} 个，其中 EVM/SOL 配对 ${scopedPairedWalletCount} 组，独立 Solana 钱包 ${scopedStandaloneSolanaCount} 个`
    : undefined;
  const selectedAssetGroup = assetGroups.find((group) => group.id === selectedAssetGroupId);
  const scopedCoveredWalletCount = scopedAssetWalletSummaries.length;
  const scopedAssetDataAvailable = scopedWalletGroups.length === 0 || scopedAssetWalletSummaries.length > 0;
  const scopedCoverageIncomplete =
    scopedWalletGroups.length > 0 && scopedCoveredWalletCount < scopedWalletGroups.length;
  const summaryScopeLabel = !scopedAssetDataAvailable
    ? selectedAssetGroup
      ? `${selectedAssetGroup.name} 资产数据`
      : "资产数据"
    : scopedCoverageIncomplete
      ? selectedAssetGroup
        ? `${selectedAssetGroup.name} 已覆盖资产`
        : "已覆盖资产"
      : selectedAssetGroup
        ? `${selectedAssetGroup.name} 总资产`
        : "全部资产";
  const refreshCounts = useMemo(() => {
    const counts = countWalletRefreshStates(
      walletGroups.map((walletGroup) => walletSummariesByGroupKey.get(walletGroup.key)?.status)
    );
    return {
      ok: counts.ok,
      stale: counts.stale,
      error: counts.error,
      skipped: counts.skipped,
      missing: counts.missing
    };
  }, [walletGroups, walletSummariesByGroupKey]);
  const selectedManagementWalletCount = managementWalletGroups.filter((group) =>
    selectedWalletGroupKeys.includes(group.key)
  ).length;
  const allManagementWalletsSelected =
    managementWalletGroups.length > 0 && selectedManagementWalletCount === managementWalletGroups.length;
  const someManagementWalletsSelected =
    selectedManagementWalletCount > 0 && !allManagementWalletsSelected;
  const batchTargetAssetGroup = assetGroups.find((group) => group.id === batchAssetGroupId);
  const batchMovableWalletCount = walletGroups.filter(
    (group) =>
      selectedWalletGroupKeys.includes(group.key) &&
      (assetGroupAssignments[group.key] || UNCLASSIFIED_ASSET_GROUP_ID) !== batchAssetGroupId
  ).length;
  const batchMoveDisabled = selectedWalletGroupKeys.length > 0 && batchMovableWalletCount === 0;
  const batchMoveDisabledReason = batchTargetAssetGroup
    ? `已选钱包都在“${batchTargetAssetGroup.name}”中，无需移动。`
    : "请选择有效的目标资产组。";
  const deleteFallbackFocusIds = deleteIntent?.kind === "asset-group"
    ? [
        assetGroupActionsId(deleteIntent.assetGroup.id, "dialog"),
        assetGroupActionsId(deleteIntent.assetGroup.id),
        assetGroupButtonId(UNCLASSIFIED_ASSET_GROUP_ID, "dialog"),
        assetGroupButtonId(UNCLASSIFIED_ASSET_GROUP_ID),
        assetGroupButtonId("all", "dialog"),
        assetGroupButtonId("all")
      ]
    : deleteIntent?.kind === "wallet-address"
      ? [walletGroupToggleId(deleteIntent.walletGroupKey), "wallet-management-search"]
      : [];
  const isInitialLoading = loading && persistence === null;

  function renderAssetView(view: AssetView) {
    if (isInitialLoading) {
      return (
        <EmptyState
          title="正在载入资产数据"
          description="正在读取钱包与资产快照，请稍候。"
          variant="loading"
        />
      );
    }

    if (view === "groups") {
      return (
        <AssetGroupTable
          summaries={assetGroupSummaries}
          portfolioTotalUsd={scopedTotalUsd}
          onOpen={(summary) => {
            if (summary.walletCount) {
              setSelectedAssetGroupId(summary.group.id);
              selectAssetView("wallets");
              return;
            }
            setManagementAssetGroupId(summary.group.id);
            navigate("wallets");
          }}
          onManage={() => navigate("wallets")}
        />
      );
    }

    if (view === "chains") {
      return (
        <>
          <ChainExposure
            chains={scopedChainSummaries}
            totalUsd={scopedTotalUsd}
            scannedChainCount={selectedChains.length}
          />
          <ChainTable
            chains={filteredChains}
            portfolioTotalUsd={scopedTotalUsd}
            emptyMessage={query.trim() ? "没有匹配的链或币种。" : undefined}
            onClearSearch={clearOverviewAssetSearch}
          />
        </>
      );
    }

    if (view === "tokens") {
      return (
        <TokenTable
          tokens={filteredTokens}
          emptyMessage={query.trim() ? "没有匹配的币种或合约。" : undefined}
          onClearSearch={clearOverviewAssetSearch}
        />
      );
    }

    return (
      <WalletTable
        walletGroups={filteredWalletGroups}
        walletSummariesByGroupKey={walletSummariesByGroupKey}
        assignments={assetGroupAssignments}
        assetGroups={assetGroups}
        emptyMessage={
          query.trim()
            ? "没有匹配的钱包或币种。"
            : walletRefreshFilter !== "all"
              ? "没有符合当前刷新状态的钱包。"
              : undefined
        }
        emptyActionLabel={walletRefreshFilter === "all" ? "清除搜索" : "清除筛选"}
        onAddWallet={openWalletImport}
        onClearFilters={clearWalletFilters}
      />
    );
  }

  if (authRequired) {
    return (
      <main className="shell auth-shell">
        <form className="auth-panel" onSubmit={(event) => void unlock(event)}>
          <div className="brand auth-brand">
            <div className="brand-mark">
              <WalletCards size={24} />
            </div>
            <div>
              <h1>个人资产追踪</h1>
              <p>请输入访问口令</p>
            </div>
          </div>
          {error ? (
            <Notice id="auth-error" title="无法验证访问口令" tone="danger">{error}</Notice>
          ) : null}
          <PasswordField
            ref={authInputRef}
            aria-describedby={error ? "auth-error" : undefined}
            autoComplete="off"
            autoFocus
            invalid={Boolean(error)}
            label="访问口令"
            value={authInput}
            onChange={(event) => setAuthInput(event.target.value)}
            placeholder="访问口令"
          />
          <Button variant="primary" type="submit">
            验证并进入
          </Button>
        </form>
      </main>
    );
  }

  return (
    <main className="shell">
      <ToastViewport />
      <section className="topbar">
        <div className="topbar-left">
          <div className="brand">
            <div className="brand-mark">
              <WalletCards size={24} />
            </div>
            <div>
              <h1>个人资产追踪</h1>
              <p>{appPage === "overview" ? "资产总览与分组统计" : "钱包、地址与资产组管理"}</p>
            </div>
          </div>
          <RouteNavigation
            items={[
              { value: "overview", href: "/", icon: <LayoutDashboard />, label: "资产总览" },
              { value: "wallets", href: "/wallets", icon: <FolderKanban />, label: "钱包管理" }
            ]}
            label="主导航"
            onNavigate={navigate}
            value={appPage}
          />
        </div>
        <div className="top-actions" data-page={appPage}>
          {persistence ? (
            <Badge className="sync-label" icon={<Database />} tone="success">
              {persistence === "vercel-blob" ? "云端已同步" : "本地文件"}
            </Badge>
          ) : null}
          {config.authRequired ? (
            <IconButton
              className="app-lock-action"
              label="锁定应用"
              onClick={lockApp}
            >
              <LockKeyhole />
            </IconButton>
          ) : null}
          <Button
            className={appPage === "overview" ? "desktop-overview-secondary-action" : undefined}
            loading={loading}
            loadingLabel="正在重新载入资产数据"
            variant="secondary"
            onClick={() => void loadInitial(true)}
          >
            <Database size={16} />
            重新载入
          </Button>
          {appPage === "overview" ? (
            <>
              <Button
                aria-haspopup="dialog"
                className="desktop-overview-secondary-action"
                disabled={isInitialLoading}
                disabledReason="钱包配置载入完成后即可添加"
                id="overview-wallet-import-trigger"
                variant="secondary"
                onClick={openWalletImport}
              >
                <Plus size={16} />
                添加钱包
              </Button>
              <Button
                aria-haspopup="dialog"
                className="desktop-overview-secondary-action"
                disabled={isInitialLoading}
                disabledReason="资产配置载入完成后即可调整刷新范围"
                id="refresh-settings-trigger"
                variant="secondary"
                onClick={openRefreshSettings}
              >
                <Settings2 size={16} />
                刷新范围
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <IconButton
                    className="mobile-overview-action-menu"
                    disabled={isInitialLoading}
                    id="mobile-overview-action-menu-trigger"
                    label="更多资产操作"
                    tooltip={false}
                  >
                    <MoreHorizontal />
                  </IconButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent aria-label="更多资产操作">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>钱包</DropdownMenuLabel>
                    <DropdownMenuItem icon={<Plus />} onSelect={openWalletImport}>
                      添加钱包
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>资产数据</DropdownMenuLabel>
                    <DropdownMenuItem
                      icon={<Database />}
                      loading={loading}
                      loadingLabel="正在重新载入"
                      onSelect={() => void loadInitial(true)}
                    >
                      重新载入
                    </DropdownMenuItem>
                    <DropdownMenuItem icon={<Settings2 />} onSelect={openRefreshSettings}>
                      刷新范围
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                className="overview-refresh-action"
                disabled={isInitialLoading}
                disabledReason="资产配置载入完成后即可刷新"
                loading={refreshing}
                loadingLabel="正在刷新资产"
                variant="primary"
                onClick={() => void refresh()}
              >
                <RefreshCw size={16} />
                刷新资产
              </Button>
            </>
          ) : (
            <Button
              aria-haspopup="dialog"
              disabled={isInitialLoading}
              disabledReason="钱包配置载入完成后即可添加"
              id="wallet-import-trigger"
              variant="primary"
              onClick={openWalletImport}
            >
              <Plus size={16} />
              添加钱包
            </Button>
          )}
        </div>
      </section>

      {error ? <Notice title="操作未完成" tone="danger">{error}</Notice> : null}

      {appPage === "overview" && snapshot?.needsLogin ? (
        <Notice title="需要重新登录" tone="warning">
          <span>OKX Onchain OS 登录态已过期。请先在终端执行：</span>
          <code>{snapshot.loginCommand}</code>
        </Notice>
      ) : null}

      {appPage === "overview" && snapshot?.stale?.length ? (
        <Notice title={`${snapshot.stale.length} 个钱包沿用旧数据`} tone="warning">
          <span>
            本轮刷新失败，已保留上次成功数据；数量和金额不会再因限流被当作 0。
          </span>
        </Notice>
      ) : null}

      <Dialog
        closeLabel="关闭刷新范围"
        fallbackFocusIds={["mobile-overview-action-menu-trigger", "refresh-settings-trigger"]}
        open={appPage === "overview" && settingsOpen}
        size="lg"
        onOpenChange={setSettingsOpen}
      >
        <DialogHeader
          description="选择下一次资产刷新需要扫描的网络。应用前的修改不会影响当前范围。"
          icon={<Settings2 />}
          title="刷新范围"
        />
        <DialogBody className="refresh-dialog-body">
          <FieldSet className="refresh-chain-fieldset">
            <FieldLegend>扫描网络</FieldLegend>
            <div className="refresh-chain-fieldset-header">
              <FieldDescription>至少保留一条网络，减少无效请求。</FieldDescription>
              <Badge tone="neutral">
                <CountPair first={draftSelectedChains.length} second={config.availableChains.length} />
              </Badge>
            </div>
            <FieldGroup className="refresh-chain-groups">
              <ChainChoiceGroup
                chains={commonRefreshChains}
                label="常用网络"
                labelId="common-refresh-chains"
                selectedChains={draftSelectedChains}
                onCheckedChange={toggleDraftChain}
              />

              {extendedRefreshChains.length ? (
                <ChainChoiceGroup
                  chains={extendedRefreshChains}
                  label="扩展网络"
                  labelId="extended-refresh-chains"
                  selectedChains={draftSelectedChains}
                  onCheckedChange={toggleDraftChain}
                />
              ) : null}
            </FieldGroup>
          </FieldSet>
          <div className="dialog-setting-row">
            <Switch
              checked={draftIncludeRisk}
              description="开启后会把风险标记或自定义 token 纳入刷新结果。"
              label="包含风险/自定义 token"
              onChange={(event) => setDraftIncludeRisk(event.target.checked)}
            />
          </div>
        </DialogBody>
        <DialogFooter meta={`已选择 ${draftSelectedChains.length} 条网络`}>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setDraftSelectedChains(config.defaultChains);
              setDraftIncludeRisk(false);
            }}
          >
            <RotateCcw size={16} />
            恢复常用
          </Button>
          <Button
            disabled={!draftSelectedChains.length}
            size="sm"
            variant="primary"
            onClick={applyRefreshSettings}
          >
            <CheckCircle2 size={16} />
            应用范围
          </Button>
        </DialogFooter>
      </Dialog>

      {appPage === "overview" && tracksSolana && !solanaWalletCount ? (
        <Notice
          action={(
            <Button size="sm" variant="secondary" onClick={() => navigate("wallets")}>
              管理钱包
            </Button>
          )}
          title="未配置 Solana 地址"
          tone="warning"
        >
          刷新范围已包含 Solana，但当前没有可追踪地址。
        </Notice>
      ) : null}

      {appPage === "overview" ? (
        <>
          {isInitialLoading ? (
            <PortfolioSummarySkeleton />
          ) : (
            <PortfolioSummary
              assetDataAvailable={scopedAssetDataAvailable}
              scopeLabel={summaryScopeLabel}
              totalUsd={scopedTotalUsd}
              conservativeTotalUsd={scopedEstimate.conservativeTotalUsd}
              stablecoinUsd={scopedEstimate.stablecoinUsd}
              volatileAssetUsd={scopedEstimate.volatileAssetUsd}
              walletCount={scopedWalletGroups.length}
              coveredWalletCount={scopedCoveredWalletCount}
              addressCount={scopedAddressCount}
              walletMeta={walletMeta}
              walletMetaLabel={walletMetaLabel}
              tokenCount={visibleTokenCount}
              activeChainCount={scopedChainSummaries.length}
              scannedChainCount={selectedChains.length}
              updatedAt={snapshot?.generatedAt}
            />
          )}

          <Tabs
            activationMode="automatic"
            className="content overview-content"
            value={activeView}
            onValueChange={(value) => selectAssetView(value as AssetView)}
          >
            <div className="toolbar">
              <div className="overview-view-primary">
                <TabsList aria-label="资产汇总视图" layout="adaptive">
                  <TabsTrigger icon={<FolderKanban />} value="groups">
                    资产组
                  </TabsTrigger>
                  <TabsTrigger icon={<Network />} value="chains">
                    链
                  </TabsTrigger>
                  <TabsTrigger icon={<CircleDollarSign />} value="tokens">
                    币种
                  </TabsTrigger>
                  <TabsTrigger icon={<WalletCards />} value="wallets">
                    钱包
                  </TabsTrigger>
                </TabsList>

                <DownloadButton
                  className="overview-export"
                  label="导出资产快照"
                  variant="secondary"
                  disabled={!snapshot}
                  disabledReason="刷新资产后即可导出资产快照"
                  content={snapshot ? `${JSON.stringify(snapshot, null, 2)}\n` : ""}
                  errorLabel="无法导出资产快照"
                  filename={timestampedFilename(
                    "asset-snapshot",
                    snapshot?.generatedAt || new Date(0),
                    "json"
                  )}
                  mimeType="application/json;charset=utf-8"
                  pendingLabel="正在准备资产快照"
                  successLabel="资产快照导出已开始"
                  visibleLabel="导出"
                />
              </div>

              {activeView !== "groups" ? (
                <div className="toolbar-filters">
                  <Select
                    className="group-filter"
                    label="筛选资产组"
                    value={selectedAssetGroupId}
                    onValueChange={setSelectedAssetGroupId}
                    options={[
                      {
                        value: "all",
                        label: "全部资产组",
                        icon: <AssetGroupMark size="xs" tone="all" />
                      },
                      ...assetGroups.map((group) => assetGroupSelectOption(group))
                    ]}
                  />
                  {activeView === "wallets" ? (
                    <WalletRefreshFilterSelect
                      ref={walletRefreshFilterRef}
                      className="status-filter"
                      counts={scopedWalletRefreshCounts}
                      value={walletRefreshFilter}
                      onValueChange={setWalletRefreshFilter}
                    />
                  ) : null}
                  <SearchField
                    className="overview-search"
                    id="overview-asset-search"
                    label="搜索资产"
                    ref={overviewSearchRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onClear={clearOverviewAssetSearch}
                    placeholder={
                      activeView === "chains"
                        ? "搜索链或币种"
                        : activeView === "tokens"
                          ? "搜索币种或合约"
                          : "搜索钱包或币种"
                    }
                  />
                </div>
              ) : null}

            </div>

            {assetViews.map((view) => (
              <TabsContent
                className="overview-tabpanel"
                key={view}
                ref={view === "wallets" ? walletIssuesPanelRef : undefined}
                tabIndex={0}
                value={view}
              >
                {renderAssetView(view)}
              </TabsContent>
            ))}
          </Tabs>

          <RefreshHealth
            className="overview-refresh-health"
            scopeLabel={selectedAssetGroup ? "全局刷新质量" : "刷新质量"}
            generatedAt={snapshot?.generatedAt}
            totalWallets={walletGroups.length}
            counts={refreshCounts}
            history={snapshotHistory}
            onInspectIssues={inspectWalletIssues}
          />
        </>
      ) : (
        <section className="wallet-management-page">
          <div className="page-heading">
            <div>
              <span className="eyebrow">钱包配置</span>
              <h2>钱包与资产组</h2>
              {isInitialLoading ? (
                <WalletManagementHeadingSkeleton />
              ) : (
                <p>
                  <CountValue value={walletGroups.length} /> 个逻辑钱包，
                  <CountValue value={wallets.length} /> 个链上地址
                </p>
              )}
            </div>
          </div>

          <Dialog
            className="wallet-import-dialog"
            closeLabel="关闭添加钱包"
            fallbackFocusIds={["wallet-import-trigger"]}
            initialFocus="first-control"
            open={appPage === "wallets" && walletImportOpen}
            size="lg"
            onOpenChange={setWalletImportOpen}
          >
            <DialogHeader
              description="添加一个或批量粘贴钱包地址，每行一个 EVM 或 Solana 地址。"
              icon={<WalletCards />}
              title="添加钱包地址"
            />
            <DialogBody className="wallet-import-dialog-body">
              <form
                className="wallet-import-dialog-form"
                id="wallet-import-form"
                onSubmit={(event) => void importWallets(event)}
              >
                <Field className="wallet-import-field" invalid={Boolean(walletImportError)}>
                  <FieldHeader>
                    <FieldLabel htmlFor="wallet-import-addresses">钱包名称与地址</FieldLabel>
                    <Badge tone={walletImportAnalysis.lineCount ? "accent" : "neutral"}>
                      <CountValue value={walletImportAnalysis.lineCount} /> 行
                    </Badge>
                  </FieldHeader>
                  <div className="wallet-import-workspace">
                    <LineTextarea
                      ref={walletImportInputRef}
                      id="wallet-import-addresses"
                      value={walletImportText}
                      onChange={(event) => {
                        setWalletImportText(event.target.value);
                        setWalletImportError(null);
                      }}
                      aria-describedby={
                        walletImportError
                          ? "wallet-import-error wallet-import-review-status"
                          : walletImportAnalysis.lineCount
                            ? "wallet-import-description wallet-import-review-status"
                            : "wallet-import-review-status"
                      }
                      aria-invalid={Boolean(walletImportError) || undefined}
                      autoCapitalize="off"
                      autoCorrect="off"
                      placeholder={[
                        "钱包 1 0xef49...dd50",
                        "钱包 2 0x3521...cc30",
                        "SOL 1 AvJUE...HoVZ"
                      ].join("\n")}
                      spellCheck={false}
                    />
                    <WalletImportReview
                      issues={walletImportAnalysis.issues}
                      lineCount={walletImportAnalysis.lineCount}
                      pairCount={walletImportAnalysis.pairCount}
                      validCount={walletImportAnalysis.wallets.length}
                    />
                  </div>
                  {walletImportError ? (
                    <FieldError id="wallet-import-error">{walletImportError}</FieldError>
                  ) : walletImportAnalysis.lineCount ? (
                    <FieldDescription id="wallet-import-description">
                      同编号会自动配对，例如“EVM 17”与“SOL 17”会合并为“钱包 17”。
                    </FieldDescription>
                  ) : null}
                </Field>
              </form>
            </DialogBody>
            <DialogFooter meta="支持 EVM 与 Solana 地址">
              <Button size="sm" variant="secondary" onClick={() => setWalletImportOpen(false)}>
                取消
              </Button>
              <Button
                disabled={!walletImportAnalysis.wallets.length}
                form="wallet-import-form"
                size="sm"
                type="submit"
                variant="primary"
              >
                <Plus size={16} />
                {walletImportAnalysis.wallets.length
                  ? `添加 ${walletImportAnalysis.wallets.length} 个地址`
                  : "添加地址"}
              </Button>
            </DialogFooter>
          </Dialog>

          <ConfirmDialog
            confirmLabel={deleteIntent?.kind === "asset-group" ? "删除资产组" : "删除地址"}
            description={
              deleteIntent?.kind === "asset-group"
                ? "资产组会从分类中移除，其中的钱包不会被删除。"
                : "该地址会停止资产扫描，但不会发起链上交易，也不会影响钱包中的资产。"
            }
            fallbackFocusIds={deleteFallbackFocusIds}
            open={appPage === "wallets" && Boolean(deleteIntent)}
            pendingLabel={deleteIntent?.kind === "asset-group" ? "正在删除资产组" : "正在删除地址"}
            title={
              deleteIntent?.kind === "asset-group"
                ? `删除“${deleteIntent.assetGroup.name}”？`
                : `删除这个 ${deleteIntent ? addressTypeLabel(deleteIntent.wallet) : "钱包"} 地址？`
            }
            onConfirm={confirmDeleteIntent}
            onOpenChange={(open) => {
              if (!open) setDeleteIntent(null);
            }}
          >
            {deleteIntent?.kind === "asset-group" ? (
              <ConfirmDialogImpact
                ariaLabel="删除资产组的影响"
                items={[
                  {
                    label: "受影响钱包",
                    value: <><CountValue value={deleteIntent.walletCount} /> 个</>
                  },
                  {
                    label: "删除后归类",
                    value: "移至“未分类”"
                  }
                ]}
              />
            ) : deleteIntent?.kind === "wallet-address" ? (
              <ConfirmDialogTarget
                ariaLabel="将删除的钱包地址"
                marker={<Badge tone="outline">{addressTypeLabel(deleteIntent.wallet)}</Badge>}
                name={deleteIntent.walletGroupLabel}
                value={deleteIntent.wallet.address}
              />
            ) : null}
          </ConfirmDialog>

          {isInitialLoading ? (
            <WalletManagementSkeleton />
          ) : (
          <div className="management-workspace">
            <AssetGroupManager
              activeId={managementAssetGroupId}
              editingColor={editingAssetGroupColor}
              editingId={editingAssetGroupId}
              editingName={editingAssetGroupName}
              items={managementAssetGroupItems}
              newColor={newAssetGroupColor}
              newName={newAssetGroupName}
              open={assetGroupPanelOpen}
              totalWalletCount={walletGroups.length}
              onBeginEdit={(group) => {
                setEditingAssetGroupId(group.id);
                setEditingAssetGroupName(group.name);
                setEditingAssetGroupColor(group.color);
              }}
              onCancelEdit={() => {
                setEditingAssetGroupId(null);
                setEditingAssetGroupName("");
                setEditingAssetGroupColor("gray");
              }}
              onCreate={createAssetGroup}
              onDelete={(assetGroup) => {
                const walletCount = managementAssetGroupItems.find(
                  (item) => item.group.id === assetGroup.id
                )?.walletCount || 0;
                setDeleteIntent({ kind: "asset-group", assetGroup, walletCount });
              }}
              onEditingColorChange={setEditingAssetGroupColor}
              onEditingNameChange={setEditingAssetGroupName}
              onNewColorChange={setNewAssetGroupColor}
              onNewNameChange={setNewAssetGroupName}
              onOpenChange={setAssetGroupPanelOpen}
              onSaveEdit={saveAssetGroup}
              onSelect={selectManagementAssetGroup}
            />

            <section className="content management-content">
              <div className="management-toolbar">
                <div className="management-list-summary">
                  <strong><CountValue value={managementWalletGroups.length} /> 个钱包</strong>
                  <span>
                    {managementAssetGroupId === "all"
                      ? "全部资产组"
                      : assetGroups.find((group) => group.id === managementAssetGroupId)?.name || "当前资产组"}
                  </span>
                </div>
                <div className="management-view-tools">
                  <Checkbox
                    className="mobile-select-all"
                    checked={allManagementWalletsSelected}
                    indeterminate={someManagementWalletsSelected}
                    label={allManagementWalletsSelected ? "取消全选" : "全选当前"}
                    onChange={() =>
                      setSelectedWalletGroupKeys(
                        allManagementWalletsSelected ? [] : managementWalletGroups.map((group) => group.key)
                      )
                    }
                  />
                  <Select
                    className="management-sort"
                    icon={<ArrowUpDown />}
                    label="钱包排序"
                    value={managementSort}
                    onValueChange={(value) => setManagementSort(value as ManagementSort)}
                    options={[
                      { value: "sequence", label: "钱包顺序" },
                      { value: "assets-desc", label: "资产从高到低" },
                      { value: "name", label: "钱包名称" }
                    ]}
                  />
                  <WalletRefreshFilterSelect
                    ref={managementRefreshFilterRef}
                    className="management-refresh-filter"
                    counts={managementRefreshCounts}
                    value={managementRefreshFilter}
                    onValueChange={(value) => {
                      setManagementRefreshFilter(value);
                      setSelectedWalletGroupKeys([]);
                    }}
                  />
                  <SearchField
                    className="management-search"
                    id="wallet-management-search"
                    label="搜索钱包"
                    ref={managementSearchRef}
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setSelectedWalletGroupKeys([]);
                    }}
                    onClear={clearManagementWalletSearch}
                    placeholder="搜索钱包名或地址"
                  />
                </div>
              </div>

              {selectedWalletGroupKeys.length ? (
                <div className="management-selection-bar">
                  <div className="selection-count" aria-live="polite">
                    <CheckSquare2 size={17} />
                    <strong>已选 <CountValue value={selectedWalletGroupKeys.length} /> 个钱包</strong>
                  </div>
                  <div className="selection-actions">
                    <Select
                      className="selection-group-select"
                      label="目标资产组"
                      value={batchAssetGroupId}
                      onValueChange={setBatchAssetGroupId}
                      options={assetGroups.map((group) => assetGroupSelectOption(group, `移到 ${group.name}`))}
                    />
                    <Button
                      aria-label={batchMoveDisabled ? batchMoveDisabledReason : "移动所选钱包"}
                      disabled={batchMoveDisabled}
                      disabledReason={batchMoveDisabledReason}
                      variant="secondary"
                      size="sm"
                      onClick={moveSelectedWalletGroups}
                    >
                      {batchMoveDisabled ? <CheckCircle2 size={16} /> : <FolderInput size={16} />}
                      {batchMoveDisabled ? "已在此组" : "移动"}
                    </Button>
                    <IconButton
                      label="清除选择"
                      size="sm"
                      onClick={clearWalletGroupSelection}
                    >
                      <X size={16} />
                    </IconButton>
                  </div>
                </div>
              ) : null}

              <Table
                className="management-table"
                containerClassName="management-table-container"
                id="wallet-management-table"
              >
                <TableCaption className="sr-only">
                  当前筛选范围内共 {managementWalletGroups.length} 个钱包，当前显示 {managementPageRangeStart}-
                  {managementPageEnd}
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Checkbox
                        checked={allManagementWalletsSelected}
                        indeterminate={someManagementWalletsSelected}
                        onChange={() =>
                          setSelectedWalletGroupKeys(
                            allManagementWalletsSelected ? [] : managementWalletGroups.map((group) => group.key)
                          )
                        }
                        aria-label={allManagementWalletsSelected ? "取消全选" : "全选当前钱包"}
                      />
                    </TableHead>
                    <TableHead>钱包</TableHead>
                    <TableHead>资产组</TableHead>
                    <TableHead numeric>最近资产</TableHead>
                    <TableHead>状态</TableHead>
                    {!compactManagementLayout ? (
                      <TableHead aria-label="操作" className="ui-table-action" />
                    ) : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {managementWalletPage.map((group) => {
                    const summary = walletSummariesByGroupKey.get(group.key);
                    const isExpanded = expandedWalletGroupKeys.includes(group.key);
                    return (
                      <Fragment key={group.key}>
                        <TableRow
                          data-editing={editingGroupKey === group.key || undefined}
                          selected={selectedWalletGroupKeys.includes(group.key)}
                        >
                          <TableCell>
                            <Checkbox
                              id={walletGroupSelectId(group.key)}
                              checked={selectedWalletGroupKeys.includes(group.key)}
                              onChange={() => toggleWalletGroupSelection(group.key)}
                              aria-label={`选择 ${group.displayLabel}`}
                            />
                          </TableCell>
                          <TableRowHead>
                            <div className="asset-cell">
                              <IdentityMark aria-hidden="true" className="wallet-badge" kind="text">
                                {walletBadgeText(group.displayLabel)}
                              </IdentityMark>
                              <div className="wallet-management-cell-content">
                                {editingGroupKey === group.key ? (
                                  <InlineEdit
                                    actionSize={compactManagementLayout ? "md" : "xs"}
                                    actionsAttached={!compactManagementLayout}
                                    className="wallet-name-inline-edit"
                                    emptyMessage="钱包名称不能为空"
                                    inputLabel={`编辑${group.displayLabel}钱包名称`}
                                    inputProps={{ maxLength: 40, required: true }}
                                    originalValue={group.displayLabel}
                                    returnFocusId={walletGroupEditId(group.key)}
                                    value={editingGroupLabel}
                                    saveLabel="保存钱包名称"
                                    cancelLabel="取消编辑钱包名称"
                                    onCancel={() => {
                                      setEditingGroupKey(null);
                                      setEditingGroupLabel("");
                                    }}
                                    onSave={() => saveGroupLabel(group.key)}
                                    onValueChange={setEditingGroupLabel}
                                  />
                                ) : (
                                  <strong>{group.displayLabel}</strong>
                                )}
                                {compactManagementLayout && editingGroupKey !== group.key ? (
                                  <WalletManagementActions
                                    expanded={isExpanded}
                                    groupKey={group.key}
                                    label={group.displayLabel}
                                    layout="mobile"
                                    onEdit={() => {
                                      setEditingGroupKey(group.key);
                                      setEditingGroupLabel(group.displayLabel);
                                    }}
                                    onToggle={() => toggleWalletGroupExpanded(group.key)}
                                  />
                                ) : null}
                                <WalletAddressList
                                  aria-label={`${group.displayLabel}地址`}
                                  items={group.wallets.map((wallet) => ({
                                    address: wallet.address,
                                    kind: addressTypeLabel(wallet)
                                  }))}
                                />
                              </div>
                            </div>
                          </TableRowHead>
                          <TableCell>
                            <Select
                              className="row-group-select"
                              label={`设置${group.displayLabel}的资产组`}
                              value={assetGroupAssignments[group.key] || UNCLASSIFIED_ASSET_GROUP_ID}
                              onValueChange={(value) => assignWalletGroups([group.key], value)}
                              options={assetGroups.map((assetGroup) => assetGroupSelectOption(assetGroup))}
                            />
                          </TableCell>
                          <TableCell className="amount" numeric>
                            {summary && walletRefreshHasAssetData(summary.status) ? (
                              <CurrencyValue value={summary.totalUsd} />
                            ) : (
                              <ValuePlaceholder label="暂无资产数据" />
                            )}
                          </TableCell>
                          <TableCell>
                            <WalletRefreshStatusBadge status={summary?.status} />
                          </TableCell>
                          {!compactManagementLayout ? (
                            <TableCell className="ui-table-action">
                              {editingGroupKey !== group.key ? (
                                <WalletManagementActions
                                  expanded={isExpanded}
                                  groupKey={group.key}
                                  label={group.displayLabel}
                                  layout="desktop"
                                  onEdit={() => {
                                    setEditingGroupKey(group.key);
                                    setEditingGroupLabel(group.displayLabel);
                                  }}
                                  onToggle={() => toggleWalletGroupExpanded(group.key)}
                                />
                              ) : null}
                            </TableCell>
                          ) : null}
                        </TableRow>
                        <TableRow
                          className="wallet-detail-row"
                          data-state={isExpanded ? "open" : "closed"}
                          hidden={!isExpanded}
                          id={walletGroupDetailsId(group.key)}
                          key={`${group.key}-details`}
                        >
                          <TableCell colSpan={compactManagementLayout ? 5 : 6}>
                            <WalletAddressDetailList aria-label={`${group.displayLabel}地址详情`}>
                              {group.wallets.map((wallet) => {
                                const addressActionTarget = `${group.displayLabel} 的 ${addressTypeLabel(wallet)} 地址`;
                                const addressActionSize = compactManagementLayout ? "md" : "sm";
                                return (
                                  <WalletAddressDetailItem
                                    address={wallet.address}
                                    key={wallet.address}
                                    kind={addressTypeLabel(wallet)}
                                    label={editingAddress === wallet.address ? (
                                      <InlineEdit
                                        actionSize={addressActionSize}
                                        actionsAttached={!compactManagementLayout}
                                        className="address-label-inline-edit"
                                        emptyMessage="地址标签不能为空"
                                        inputLabel={`编辑${addressActionTarget}标签`}
                                        inputProps={{ maxLength: 40, required: true }}
                                        originalValue={wallet.label}
                                        returnFocusId={walletAddressEditId(wallet.address)}
                                        value={editingLabel}
                                        saveLabel="保存地址标签"
                                        cancelLabel="取消编辑地址标签"
                                        onCancel={() => {
                                          setEditingAddress(null);
                                          setEditingLabel("");
                                        }}
                                        onSave={() => saveLabel(wallet.address)}
                                        onValueChange={setEditingLabel}
                                      />
                                    ) : (
                                      <strong>{wallet.label}</strong>
                                    )}
                                    pairing={(
                                      <div className="pair-control detail-pair-control">
                                        <span>配对到</span>
                                        <Select
                                          label={`设置${wallet.label}的配对钱包`}
                                          value={walletRecordGroupKey(wallet)}
                                          onValueChange={(value) => updateWalletPair(wallet.address, value)}
                                          options={[
                                            ...walletPairOptions(wallet).map((option) => ({
                                              value: option.key,
                                              label: option.displayLabel
                                            })),
                                            ...(canDetachWalletFromPair(wallet, wallets)
                                              ? [{
                                                  value: INDEPENDENT_WALLET_GROUP_VALUE,
                                                  label: "设为独立钱包",
                                                  icon: <Unlink />
                                                }]
                                              : [])
                                          ]}
                                        />
                                      </div>
                                    )}
                                    actions={(
                                      <ButtonGroup
                                        aria-label={`${addressActionTarget}操作`}
                                        className="row-actions"
                                        data-slot="wallet-address-actions"
                                      >
                                        {editingAddress !== wallet.address ? (
                                          <IconButton
                                            id={walletAddressEditId(wallet.address)}
                                            label={`编辑${addressActionTarget}标签`}
                                            size={addressActionSize}
                                            onClick={() => {
                                              setEditingAddress(wallet.address);
                                              setEditingLabel(wallet.label);
                                            }}
                                          >
                                            <Edit3 size={15} />
                                          </IconButton>
                                        ) : null}
                                        <CopyButton
                                          copiedLabel={`${addressActionTarget}已复制`}
                                          errorLabel={`无法复制${addressActionTarget}`}
                                          label={`复制${addressActionTarget}`}
                                          size={addressActionSize}
                                          text={wallet.address}
                                        />
                                        <IconButton
                                          label={`删除${addressActionTarget}`}
                                          size={addressActionSize}
                                          variant="danger"
                                          onClick={() => setDeleteIntent({
                                            kind: "wallet-address",
                                            wallet,
                                            walletGroupKey: group.key,
                                            walletGroupLabel: group.displayLabel
                                          })}
                                        >
                                          <Trash2 size={15} />
                                        </IconButton>
                                      </ButtonGroup>
                                    )}
                                  />
                                );
                              })}
                            </WalletAddressDetailList>
                          </TableCell>
                        </TableRow>
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
              <Pagination
                aria-label="钱包列表分页"
                controlsId="wallet-management-table"
                itemLabel="钱包"
                page={activeManagementPage}
                pageSize={managementPageSize}
                totalItems={managementWalletGroups.length}
                onPageChange={changeManagementPage}
              />
              {!managementWalletGroups.length ? (
                <EmptyState
                  className="compact-empty"
                  icon={query.trim() || managementRefreshFilter !== "all" ? undefined : <WalletCards />}
                  title={
                    query.trim()
                      ? "没有匹配的钱包"
                      : managementRefreshFilter !== "all"
                        ? "没有符合当前刷新状态的钱包"
                      : managementAssetGroupId === "all"
                        ? "还没有钱包"
                        : "这个资产组还没有钱包"
                  }
                  description={
                    query.trim()
                      ? "请调整钱包名称或地址关键词。"
                      : managementRefreshFilter !== "all"
                        ? "可以切换刷新状态，或清除筛选查看全部钱包。"
                      : managementAssetGroupId === "all"
                        ? "添加 EVM 或 Solana 地址后即可开始追踪。"
                        : "可以从全部钱包中选择，并归类到当前资产组。"
                  }
                  variant={query.trim() || managementRefreshFilter !== "all" ? "no-results" : "empty"}
                  action={
                    managementRefreshFilter !== "all" ? (
                      <ClearSearchAction label="清除筛选" onClear={clearManagementWalletFilters} />
                    ) : query.trim() ? (
                      <ClearSearchAction onClear={clearManagementWalletSearch} />
                    ) : managementAssetGroupId === "all" ? (
                      <Button size="sm" variant="primary" onClick={openWalletImport}>
                        <Plus aria-hidden="true" />
                        添加钱包
                      </Button>
                    ) : (
                      <Button size="sm" variant="secondary" onClick={() => selectManagementAssetGroup("all")}>
                        <WalletCards aria-hidden="true" />
                        查看全部钱包
                      </Button>
                    )
                  }
                />
              ) : null}
            </section>
          </div>
          )}
        </section>
      )}
    </main>
  );
}

function ClearSearchAction({ label = "清除搜索", onClear }: { label?: string; onClear: () => void }) {
  return (
    <Button size="sm" variant="secondary" onClick={onClear}>
      <X aria-hidden="true" />
      {label}
    </Button>
  );
}

function assetGroupCoverageState(summary: AssetGroupSummary) {
  if (!summary.coveredWalletCount) {
    return "missing";
  }
  return summary.coveredWalletCount < summary.walletCount ? "partial" : "complete";
}

function AssetGroupCurrencyValue({
  summary,
  value
}: {
  summary: AssetGroupSummary;
  value: number;
}) {
  return summary.coveredWalletCount ? (
    <CurrencyValue value={value} />
  ) : (
    <ValuePlaceholder label="暂无资产数据" />
  );
}

function AssetGroupHoldings({ summary }: { summary: AssetGroupSummary }) {
  const emptyText = !summary.coveredWalletCount
    ? "暂无资产数据"
    : summary.totalUsd > 0
      ? "小额已省略"
      : summary.coveredWalletCount < summary.walletCount
        ? "覆盖范围内暂无持仓"
        : "暂无持仓";

  return <TokenHoldingList emptyText={emptyText} tokens={summary.topTokens} />;
}

function AssetGroupStatusBadge({ summary }: { summary: AssetGroupSummary }) {
  if (summary.missingWalletCount && summary.issueCount === summary.missingWalletCount) {
    return (
      <StatusBadge status="missing">
        <CountValue value={summary.missingWalletCount} /> 个缺失
      </StatusBadge>
    );
  }
  if (summary.issueCount) {
    return (
      <StatusBadge status="stale">
        <CountValue value={summary.issueCount} /> 个待检查
      </StatusBadge>
    );
  }
  return <StatusBadge status="ok">正常</StatusBadge>;
}

function AssetGroupTable({
  summaries,
  portfolioTotalUsd,
  onOpen,
  onManage
}: {
  summaries: AssetGroupSummary[];
  portfolioTotalUsd: number;
  onOpen: (summary: AssetGroupSummary) => void;
  onManage: () => void;
}) {
  const activeSummaries = summaries.filter((summary) => summary.walletCount > 0);
  const inactiveSummaries = summaries.filter((summary) => summary.walletCount === 0);
  const coverageComplete = activeSummaries.every(
    (summary) => summary.coveredWalletCount === summary.walletCount
  );
  const amountLabel = coverageComplete ? "总资产" : "已覆盖资产";
  const shareLabel = coverageComplete ? "占总资产" : "占已覆盖资产";

  return (
    <div className="asset-group-ledger">
      {activeSummaries.length ? (
        <>
          <Table className="group-table" containerClassName="desktop-ledger-table">
            <TableCaption className="sr-only">按资产组汇总的个人加密资产</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>资产组</TableHead>
                <TableHead numeric>{amountLabel}</TableHead>
                <TableHead numeric>保守估值</TableHead>
                <TableHead numeric>稳定币</TableHead>
                <TableHead numeric>钱包 / 地址</TableHead>
                <TableHead>主要持仓</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeSummaries.map((summary) => (
                <TableRow
                  className="group-data-row"
                  data-coverage={assetGroupCoverageState(summary)}
                  key={summary.group.id}
                >
                  <TableRowHead>
                    <Button className="group-open-button" variant="quiet" onClick={() => onOpen(summary)}>
                      <AssetGroupMark size="lg" tone={summary.group.color} />
                      <span>
                        <strong>{summary.group.name}</strong>
                        <small><CountValue value={summary.walletCount} /> 个逻辑钱包</small>
                      </span>
                      <ChevronRight size={16} />
                    </Button>
                  </TableRowHead>
                  <TableCell className="amount group-amount" numeric>
                    <strong><AssetGroupCurrencyValue summary={summary} value={summary.totalUsd} /></strong>
                    {summary.coveredWalletCount && summary.totalUsd > 0 ? (
                      <ShareMeter label={shareLabel} value={summary.totalUsd} total={portfolioTotalUsd} />
                    ) : null}
                  </TableCell>
                  <TableCell numeric>
                    <AssetGroupCurrencyValue summary={summary} value={summary.conservativeTotalUsd} />
                  </TableCell>
                  <TableCell numeric>
                    <AssetGroupCurrencyValue summary={summary} value={summary.stablecoinUsd} />
                  </TableCell>
                  <TableCell numeric>
                    <CountPair first={summary.walletCount} second={summary.addressCount} />
                  </TableCell>
                  <TableCell>
                    <AssetGroupHoldings summary={summary} />
                  </TableCell>
                  <TableCell>
                    <AssetGroupStatusBadge summary={summary} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ItemGroup aria-label="资产组列表" className="mobile-ledger-list">
            {activeSummaries.map((summary) => (
              <LedgerItem
                data-coverage={assetGroupCoverageState(summary)}
                key={summary.group.id}
                media={(
                  <AssetGroupMark size="lg" tone={summary.group.color} />
                )}
                title={summary.group.name}
                description={(
                  <>
                    <CountValue value={summary.walletCount} /> 个逻辑钱包 ·{" "}
                    <CountValue value={summary.addressCount} /> 个地址
                  </>
                )}
                amount={<AssetGroupCurrencyValue summary={summary} value={summary.totalUsd} />}
                amountLabel={
                  summary.coveredWalletCount === summary.walletCount ? "总资产" : "已覆盖资产"
                }
                amountMeta={summary.coveredWalletCount && summary.totalUsd > 0 ? (
                  <ShareMeter label={shareLabel} value={summary.totalUsd} total={portfolioTotalUsd} />
                ) : null}
                action={(
                  <IconButton
                    label={`查看${summary.group.name}`}
                    size="sm"
                    tooltip={false}
                    variant="ghost"
                    onClick={() => onOpen(summary)}
                  >
                    <ChevronRight aria-hidden="true" />
                  </IconButton>
                )}
                facts={[
                  {
                    label: "保守估值",
                    value: <AssetGroupCurrencyValue summary={summary} value={summary.conservativeTotalUsd} />,
                    valueKind: "number"
                  },
                  {
                    label: "稳定币",
                    value: <AssetGroupCurrencyValue summary={summary} value={summary.stablecoinUsd} />,
                    valueKind: "number"
                  },
                  {
                    label: "状态",
                    value: <AssetGroupStatusBadge summary={summary} />
                  }
                ]}
                details={(
                  <LedgerDetail label="主要持仓">
                    <AssetGroupHoldings summary={summary} />
                  </LedgerDetail>
                )}
              />
            ))}
          </ItemGroup>
        </>
      ) : (
        <EmptyState
          className="group-empty-state"
          icon={<FolderKanban />}
          title="暂无已归类钱包"
          description="请前往钱包管理，将钱包放入对应资产组。"
          action={(
            <Button size="sm" variant="secondary" onClick={onManage}>
              <FolderInput aria-hidden="true" />
              管理钱包归类
            </Button>
          )}
        />
      )}

      {inactiveSummaries.length ? (
        <Collapsible className="inactive-groups">
          <CollapsibleTrigger asChild>
            <Button
              aria-controls="inactive-asset-groups-panel"
              className="inactive-groups-trigger"
              variant="ghost"
            >
              <span className="inactive-groups-heading">
                <FolderInput aria-hidden="true" size={17} />
                <span>
                  <strong><CountValue value={inactiveSummaries.length} /> 个待配置资产组</strong>
                  <small>没有钱包和资产，不计入主账本</small>
                </span>
              </span>
              <span className="inactive-groups-toggle">
                <span className="inactive-toggle-label when-closed">查看</span>
                <span className="inactive-toggle-label when-open">收起</span>
                <CollapsibleChevron />
              </span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="inactive-groups-content" id="inactive-asset-groups-panel">
            <div className="inactive-group-list">
              {inactiveSummaries.map((summary) => (
                <Button key={summary.group.id} variant="ghost" onClick={() => onOpen(summary)}>
                  <AssetGroupMark tone={summary.group.color} />
                  <span>
                    <strong>{summary.group.name}</strong>
                    <small>前往钱包管理配置</small>
                  </span>
                  <ChevronRight aria-hidden="true" size={16} />
                </Button>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </div>
  );
}

function ChainTable({
  chains,
  portfolioTotalUsd,
  emptyMessage,
  onClearSearch
}: {
  chains: ChainExposureSummary[];
  portfolioTotalUsd: number;
  emptyMessage?: string;
  onClearSearch: () => void;
}) {
  if (!chains.length) {
    return (
      <EmptyState
        icon={emptyMessage ? undefined : <Network />}
        title={emptyMessage ? "没有匹配结果" : "暂无链上资产"}
        description={emptyMessage || "当前范围还没有价值不低于 $1 的链上资产。"}
        variant={emptyMessage ? "no-results" : "empty"}
        action={emptyMessage ? <ClearSearchAction onClear={onClearSearch} /> : undefined}
      />
    );
  }

  return (
    <>
      <Table className="chain-table" containerClassName="desktop-ledger-table">
        <TableCaption className="sr-only">按链汇总的个人加密资产</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>链</TableHead>
            <TableHead numeric>总资产</TableHead>
            <TableHead numeric>保守估值</TableHead>
            <TableHead numeric>稳定币</TableHead>
            <TableHead numeric>钱包</TableHead>
            <TableHead numeric>币种</TableHead>
            <TableHead>主要持仓</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {chains.map((chain) => (
            <TableRow key={chain.chainKey}>
              <TableRowHead><ChainIdentity chain={chain} /></TableRowHead>
              <TableCell className="amount chain-amount" numeric>
                <strong><CurrencyValue value={chain.totalUsd} /></strong>
                <ShareMeter value={chain.totalUsd} total={portfolioTotalUsd} />
              </TableCell>
              <TableCell numeric><CurrencyValue value={chain.conservativeTotalUsd} /></TableCell>
              <TableCell numeric><CurrencyValue value={chain.stablecoinUsd} /></TableCell>
              <TableCell numeric><CountValue value={chain.walletCount} /></TableCell>
              <TableCell numeric><CountValue value={chain.tokenCount} /></TableCell>
              <TableCell>
                <TokenHoldingList showBalance tokens={chain.topTokens} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ItemGroup aria-label="链资产列表" className="mobile-ledger-list">
        {chains.map((chain) => (
          <LedgerItem
            key={chain.chainKey}
            media={(
              <IdentityMark
                aria-hidden="true"
                className={`chain-badge ${chainTone(chain.chainKey, chain.chainName)}`}
                kind="icon"
              >
                <Network aria-hidden="true" />
              </IdentityMark>
            )}
            title={chain.chainName}
            description={chain.chainKey === chain.chainName ? "已识别网络" : `链 ID ${chain.chainKey}`}
            amount={<CurrencyValue value={chain.totalUsd} />}
            amountMeta={<ShareMeter value={chain.totalUsd} total={portfolioTotalUsd} />}
            facts={[
              { label: "保守估值", value: <CurrencyValue value={chain.conservativeTotalUsd} />, valueKind: "number" },
              { label: "稳定币", value: <CurrencyValue value={chain.stablecoinUsd} />, valueKind: "number" },
              {
                label: "钱包 / 币种",
                value: <CountPair first={chain.walletCount} second={chain.tokenCount} />,
                valueKind: "number"
              }
            ]}
            details={(
              <LedgerDetail label="主要持仓">
                <TokenHoldingList showBalance tokens={chain.topTokens} />
              </LedgerDetail>
            )}
          />
        ))}
      </ItemGroup>
    </>
  );
}

function TokenTable({
  tokens,
  emptyMessage,
  onClearSearch
}: {
  tokens: TokenSummary[];
  emptyMessage?: string;
  onClearSearch: () => void;
}) {
  if (!tokens.length) {
    return (
      <EmptyState
        icon={emptyMessage ? undefined : <CircleDollarSign />}
        title={emptyMessage ? "没有匹配结果" : "暂无币种数据"}
        description={emptyMessage || "刷新资产后会在这里汇总。"}
        variant={emptyMessage ? "no-results" : "empty"}
        action={emptyMessage ? <ClearSearchAction onClear={onClearSearch} /> : undefined}
      />
    );
  }

  return (
    <>
      <Table className="token-table" containerClassName="desktop-ledger-table">
        <TableCaption className="sr-only">按币种汇总的个人加密资产</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>币种</TableHead>
            <TableHead numeric>总金额</TableHead>
            <TableHead numeric>单价</TableHead>
            <TableHead numeric>数量</TableHead>
            <TableHead numeric>钱包</TableHead>
            <TableHead>链分布</TableHead>
            <TableHead>合约</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tokens.map((token, index) => (
            <TableRow key={`${token.symbol}-${token.contracts.join("-")}-${index}`}>
              <TableRowHead>
                <div className="asset-cell">
                  <TokenIcon iconUrl={token.iconUrl} symbol={token.symbol} />
                  <div>
                    <strong>{token.symbol}</strong>
                    <span><CountValue value={token.holdingCount} /> 笔持仓</span>
                  </div>
                </div>
              </TableRowHead>
              <TableCell className="amount" numeric><CurrencyValue value={token.totalUsd} /></TableCell>
              <TableCell numeric>
                <TokenPriceValue aria-label={`${token.symbol} 单价`} value={tokenUnitPrice(token)} />
              </TableCell>
              <TableCell numeric>
                <QuantityValue aria-label={`${token.symbol} 数量`} value={token.totalBalance} />
              </TableCell>
              <TableCell numeric><CountValue value={token.walletCount} /></TableCell>
              <TableCell>
                <TokenChainBreakdownList items={token.chainBreakdown} minimumUsd={minVisibleUsd} />
              </TableCell>
              <TableCell>
                <TokenContractList contracts={token.contracts} riskCount={token.riskCount} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ItemGroup aria-label="币种资产列表" className="mobile-ledger-list">
        {tokens.map((token, index) => (
          <LedgerItem
            key={`${token.symbol}-${token.contracts.join("-")}-${index}`}
            media={<TokenIcon iconUrl={token.iconUrl} symbol={token.symbol} />}
            title={token.symbol}
            description={<><CountValue value={token.holdingCount} /> 笔持仓</>}
            amount={<CurrencyValue value={token.totalUsd} />}
            amountLabel="总金额"
            amountMeta={(
              <span className="token-unit-price-meta">
                <span>单价</span>
                <TokenPriceValue aria-label={`${token.symbol} 单价`} value={tokenUnitPrice(token)} />
              </span>
            )}
            facts={[
              {
                label: "数量",
                value: <QuantityValue aria-label={`${token.symbol} 数量`} value={token.totalBalance} />,
                valueKind: "number"
              },
              { label: "钱包", value: <CountValue value={token.walletCount} />, valueKind: "number" },
              { label: "链", value: <CountValue value={token.chainBreakdown.length} />, valueKind: "number" }
            ]}
            details={(
              <>
                <LedgerDetail label="链分布">
                  <TokenChainBreakdownList items={token.chainBreakdown} minimumUsd={minVisibleUsd} />
                </LedgerDetail>
                <LedgerDetail label="合约">
                  <TokenContractList contracts={token.contracts} riskCount={token.riskCount} />
                </LedgerDetail>
              </>
            )}
          />
        ))}
      </ItemGroup>
    </>
  );
}

function walletStatusBadge(summary?: WalletSummary) {
  if (!summary) {
    return (
      <WalletRefreshStatusBadge
        className="wallet-status-detail"
        title="当前资产快照缺少这个钱包的数据"
      />
    );
  }
  if (summary.status === "ok") {
    return <WalletRefreshStatusBadge status="ok" />;
  }
  if (summary.status === "stale") {
    const detail = `旧数据 · ${formatDateTime(summary.updatedAt)} · ${summary.staleReason || "等待重新刷新"}`;
    return (
      <WalletRefreshStatusBadge status="stale" className="wallet-status-detail" title={detail} truncate>
        {detail}
      </WalletRefreshStatusBadge>
    );
  }
  if (summary.status === "skipped") {
    const detail = summary.error || "跳过";
    return (
      <WalletRefreshStatusBadge status="skipped" className="wallet-status-detail" title={detail} truncate>
        {detail}
      </WalletRefreshStatusBadge>
    );
  }
  const detail = summary.error || "刷新失败";
  return (
    <WalletRefreshStatusBadge status="error" className="wallet-status-detail" title={detail} truncate>
      {detail}
    </WalletRefreshStatusBadge>
  );
}

function WalletTable({
  walletGroups,
  walletSummariesByGroupKey,
  assignments,
  assetGroups,
  emptyMessage,
  emptyActionLabel,
  onAddWallet,
  onClearFilters
}: {
  walletGroups: WalletGroup[];
  walletSummariesByGroupKey: Map<string, WalletSummary>;
  assignments: AssetGroupAssignments;
  assetGroups: AssetGroup[];
  emptyMessage?: string;
  emptyActionLabel?: string;
  onAddWallet: () => void;
  onClearFilters: () => void;
}) {
  if (!walletGroups.length) {
    return (
      <EmptyState
        icon={emptyMessage ? undefined : <WalletCards />}
        title={emptyMessage ? "没有匹配结果" : "暂无钱包"}
        description={emptyMessage || "添加 EVM 或 Solana 地址后会在这里汇总。"}
        variant={emptyMessage ? "no-results" : "empty"}
        action={emptyMessage ? (
          <ClearSearchAction label={emptyActionLabel} onClear={onClearFilters} />
        ) : (
          <Button size="sm" variant="primary" onClick={onAddWallet}>
            <Plus size={16} />
            添加钱包
          </Button>
        )}
      />
    );
  }

  const walletRows = walletGroups.map((walletGroup) => {
    const members = walletGroup.wallets;
    const label = walletGroup.displayLabel;
    const summary = walletSummariesByGroupKey.get(walletGroup.key);
    const assetSummary = summary && walletRefreshHasAssetData(summary.status) ? summary : undefined;
    const visibleTokens = assetSummary ? visibleTokenGroups(assetSummary.holdings) : [];
    const assetGroupId = assignments[walletGroup.key] || UNCLASSIFIED_ASSET_GROUP_ID;
    const assetGroup = assetGroups.find((group) => group.id === assetGroupId);
    return { assetGroup, assetSummary, label, members, summary, visibleTokens, walletGroup };
  });

  return (
    <>
      <Table className="wallet-table" containerClassName="desktop-ledger-table">
        <TableCaption className="sr-only">按钱包汇总的个人加密资产</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>钱包</TableHead>
            <TableHead>资产组</TableHead>
            <TableHead numeric>总金额</TableHead>
            <TableHead numeric>币种数</TableHead>
            <TableHead>主要持仓</TableHead>
            <TableHead>状态</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {walletRows.map(({
            assetGroup,
            assetSummary,
            label,
            members,
            summary,
            visibleTokens,
            walletGroup
          }) => (
            <TableRow data-refresh-state={walletRefreshState(summary?.status)} key={walletGroup.key}>
              <TableRowHead>
                <div className="asset-cell">
                  <IdentityMark aria-hidden="true" className="wallet-badge" kind="text">
                    {walletBadgeText(label)}
                  </IdentityMark>
                  <div>
                    <strong>
                      {label}
                      {members.some((wallet) => wallet.source === "okx-agentic-wallet") ? (
                        <Badge tone="accent">OKX</Badge>
                      ) : null}
                    </strong>
                    <WalletAddressList
                      aria-label={`${label}地址`}
                      items={members.map((wallet) => ({
                        address: wallet.address,
                        kind: addressTypeLabel(wallet)
                      }))}
                    />
                  </div>
                </div>
              </TableRowHead>
              <TableCell>
                <AssetGroupLabel
                  name={assetGroup?.name || "未分类"}
                  tone={assetGroup?.color || "gray"}
                />
              </TableCell>
              <TableCell className="amount" numeric>
                {assetSummary
                  ? <CurrencyValue value={assetSummary.totalUsd} />
                  : <ValuePlaceholder label="暂无资产数据" />}
              </TableCell>
              <TableCell numeric>
                {assetSummary
                  ? <CountValue value={visibleTokens.length} />
                  : <ValuePlaceholder label="暂无资产数据" />}
              </TableCell>
              <TableCell>
                <TokenHoldingList
                  emptyText={!assetSummary
                    ? "暂无资产数据"
                    : assetSummary.totalUsd > 0
                      ? "小额已省略"
                      : "暂无持仓"}
                  showBalance
                  tokens={visibleTokens.slice(0, 6)}
                />
              </TableCell>
              <TableCell>
                {walletStatusBadge(summary)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ItemGroup aria-label="钱包资产列表" className="mobile-ledger-list">
        {walletRows.map(({
          assetGroup,
          assetSummary,
          label,
          members,
          summary,
          visibleTokens,
          walletGroup
        }) => (
          <LedgerItem
            className="wallet-ledger-item"
            data-refresh-state={walletRefreshState(summary?.status)}
            key={walletGroup.key}
            media={(
              <IdentityMark aria-hidden="true" className="wallet-badge" kind="text">
                {walletBadgeText(label)}
              </IdentityMark>
            )}
            title={(
              <>
                <span>{label}</span>
                {members.some((wallet) => wallet.source === "okx-agentic-wallet") ? (
                  <Badge tone="accent">OKX</Badge>
                ) : null}
              </>
            )}
            description={(
              <WalletAddressList
                aria-label={`${label}地址`}
                items={members.map((wallet) => ({
                  address: wallet.address,
                  kind: addressTypeLabel(wallet)
                }))}
              />
            )}
            amount={assetSummary
              ? <CurrencyValue value={assetSummary.totalUsd} />
              : <ValuePlaceholder label="暂无资产数据" />}
            amountLabel={assetSummary ? "总金额" : "资产数据"}
            facts={[
              {
                label: "资产组",
                value: (
                  <AssetGroupLabel
                    name={assetGroup?.name || "未分类"}
                    tone={assetGroup?.color || "gray"}
                  />
                )
              },
              {
                label: "币种",
                value: assetSummary
                  ? <CountValue value={visibleTokens.length} />
                  : <ValuePlaceholder label="暂无资产数据" />,
                valueKind: "number"
              },
              { label: "状态", value: walletStatusBadge(summary) }
            ]}
            details={assetSummary ? (
              <LedgerDetail label="主要持仓">
                <TokenHoldingList
                  emptyText={assetSummary.totalUsd > 0 ? "小额已省略" : "暂无持仓"}
                  showBalance
                  tokens={visibleTokens.slice(0, 6)}
                />
              </LedgerDetail>
            ) : undefined}
          />
        ))}
      </ItemGroup>
    </>
  );
}
