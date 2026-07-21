import {
  ArrowUpDown,
  CheckCircle2,
  CheckSquare2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Copy,
  Database,
  Download,
  Edit3,
  FolderInput,
  FolderKanban,
  LayoutDashboard,
  Network,
  Plus,
  RefreshCw,
  Settings2,
  Trash2,
  Wallet,
  WalletCards,
  X
} from "lucide-react";
import { Fragment, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { calculateConservativeEstimate } from "../shared/asset-estimate";
import AssetGroupManager, { type AssetGroupManagerItem } from "./components/AssetGroupManager";
import { AssetGroupLabel, AssetGroupMark } from "./components/AssetGroupIdentity";
import ChainExposure, {
  ChainIdentity,
  chainTone,
  type ChainExposureSummary,
  type ChainTokenSummary
} from "./components/ChainExposure";
import LedgerItem, { LedgerDetail } from "./components/LedgerItem";
import PortfolioSummary, { AssetShareBar } from "./components/PortfolioSummary";
import RefreshHealth, { type SnapshotHistoryPoint } from "./components/RefreshHealth";
import {
  WalletAddressDetailItem,
  WalletAddressDetailList,
  WalletAddressList
} from "./components/WalletAddressList";
import { Badge, StatusBadge } from "./components/ui/Badge";
import { Button, IconButton } from "./components/ui/Button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./components/ui/Collapsible";
import { ConfirmDialog } from "./components/ui/ConfirmDialog";
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "./components/ui/Dialog";
import { EmptyState, Notice } from "./components/ui/Feedback";
import { Field, FieldError, FieldHeader, FieldLabel } from "./components/ui/Field";
import { Checkbox, Input, LineTextarea, SearchField, Switch } from "./components/ui/FormControls";
import { HoldingItem, HoldingList } from "./components/ui/Holding";
import { IdentityMark } from "./components/ui/IdentityMark";
import { ItemGroup } from "./components/ui/Item";
import { RouteNavigation } from "./components/ui/RouteNavigation";
import { Select } from "./components/ui/Select";
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
import { ToastViewport, toast } from "./components/ui/Toast";
import {
  type AssetGroup,
  type AssetGroupAssignments,
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
  status: "ok" | "stale" | "error" | "skipped";
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
const assetViews = ["groups", "chains", "tokens", "wallets"] as const;
type AssetView = (typeof assetViews)[number];
const authTokenStorageKey = "asset-tracker-token";
const snapshotStorageKey = "asset-tracker-snapshot-v1";
const walletsStorageKey = "asset-tracker-wallets-v1";
const portfolioStateStorageKey = "asset-tracker-state-v2";
const desktopManagementMediaQuery = "(min-width: 981px)";
const tokenIconSlugs: Record<string, string> = {
  ARB: "arb",
  AVAX: "avax",
  BNB: "bnb",
  BTCB: "btc",
  BTC: "btc",
  ETH: "eth",
  MATIC: "matic",
  OKB: "okb",
  OP: "op",
  POL: "pol",
  SOL: "sol",
  USDC: "usdc",
  USDT: "usdt",
  WAVAX: "avax",
  WBNB: "bnb",
  WBTC: "btc",
  WETH: "eth"
};

const directTokenIconUrls: Record<string, string> = {
  AIDOG: "https://assets.geckoterminal.com/g140ujr84eicv4wpcu1jn97rg9ym",
  ARB: "https://coin-images.coingecko.com/coins/images/16547/large/arb.jpg",
  AUBRAI: "https://coin-images.coingecko.com/coins/images/68736/large/avatar-dex_2.png?1756954661",
  FLOCK: "https://coin-images.coingecko.com/coins/images/53178/large/FLock_Token_Logo.png?1735561398",
  OKB: "https://coin-images.coingecko.com/coins/images/4463/large/WeChat_Image_20220118095654.png",
  OP: "https://coin-images.coingecko.com/coins/images/25244/large/Token.png",
  PEPE: "https://coin-images.coingecko.com/coins/images/29850/large/pepe-token.jpeg?1696528776",
  POL: "https://coin-images.coingecko.com/coins/images/32440/large/pol.png",
  SWARMS: "https://coin-images.coingecko.com/coins/images/52988/large/swarms.jpg?1734921510",
  USDT0: "https://coin-images.coingecko.com/coins/images/53705/large/usdt0.jpg?1737086183",
  VIRTUAL: "https://coin-images.coingecko.com/coins/images/34057/large/LOGOMARK.png?1708356054"
};

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
    walletRecordGroupKey(onlyWallet) === onlyWallet.id &&
    walletRecordGroupLabel(onlyWallet) === onlyWallet.label &&
    !/^独立[：:]/.test(group.label)
  ) {
    return `独立：${group.label}`;
  }

  return group.label;
}

function walletGroupToggleId(groupKey: string) {
  return `wallet-group-toggle-${encodeURIComponent(groupKey)}`;
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

function tokenIconHash(symbol: string) {
  let hash = 0;
  for (const char of symbol || "?") {
    hash = (hash * 31 + char.codePointAt(0)!) >>> 0;
  }
  return hash;
}

function tokenIconLabel(symbol: string) {
  const normalized = symbol.trim() || "?";
  const compact = normalized.replace(/[^0-9a-zA-Z]/g, "");
  return Array.from(compact || normalized).slice(0, 2).join("").toUpperCase();
}

function escapeSvgText(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&apos;"
    };
    return entities[char] || char;
  });
}

function generatedTokenIconUrl(symbol: string) {
  const hash = tokenIconHash(symbol);
  const hue = hash % 360;
  const label = escapeSvgText(tokenIconLabel(symbol));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue},68%,52%)"/><stop offset="1" stop-color="hsl(${(hue + 42) % 360},62%,34%)"/></linearGradient></defs><rect width="64" height="64" rx="14" fill="url(#g)"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="${label.length > 2 ? 20 : 24}" font-weight="800" fill="#fff">${label}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function canonicalTokenSymbol(symbol: string) {
  return symbol.trim().toUpperCase().replace(/₮/g, "T");
}

function isGeneratedTokenIconUrl(iconUrl?: string) {
  return Boolean(iconUrl?.startsWith("data:image/svg+xml"));
}

function knownTokenIconUrl(symbol: string) {
  const key = canonicalTokenSymbol(symbol);
  const direct = directTokenIconUrls[key];
  if (direct) {
    return direct;
  }

  const slug = tokenIconSlugs[key];
  return slug ? `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/${slug}.svg` : undefined;
}

function fallbackTokenIconUrl(symbol: string) {
  return knownTokenIconUrl(symbol) || generatedTokenIconUrl(symbol);
}

function tokenIconUrl(symbol: string, iconUrl?: string) {
  if (!iconUrl || isGeneratedTokenIconUrl(iconUrl)) {
    return fallbackTokenIconUrl(symbol);
  }
  return iconUrl;
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

function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2
  }).format(value || 0);
}

function compactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 3
  }).format(value || 0);
}

function fullNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 8
  }).format(value || 0);
}

function shortAddress(address: string) {
  if (!address || address === "(native)") {
    return "(native)";
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDate(value?: string) {
  if (!value) {
    return "尚未刷新";
  }
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function refreshChainLabel(chain: string) {
  const labels: Record<string, string> = {
    ethereum: "Ethereum",
    solana: "Solana",
    base: "Base",
    robinhood: "Robinhood",
    bsc: "BSC",
    arbitrum: "Arbitrum",
    polygon: "Polygon",
    optimism: "Optimism",
    avalanche: "Avalanche",
    xlayer: "XLayer",
    linea: "Linea",
    scroll: "Scroll",
    zksync: "zkSync",
    fantom: "Fantom"
  };
  return labels[chain.trim().toLowerCase()] || chain;
}

function TokenIcon({ symbol, iconUrl, small = false }: { symbol: string; iconUrl?: string; small?: boolean }) {
  const [failed, setFailed] = useState(false);
  const fallbackSrc = generatedTokenIconUrl(symbol);
  const src = failed ? fallbackSrc : tokenIconUrl(symbol, iconUrl);
  const label = symbol.slice(0, small ? 2 : 4).toUpperCase();

  return src ? (
    <span className={small ? "token-icon small" : "token-icon"}>
      <img alt="" src={src} onError={() => setFailed(true)} />
    </span>
  ) : (
    <span className={small ? "token-icon small fallback" : "token-icon fallback"}>{label}</span>
  );
}

type TokenHoldingListProps = {
  emptyText?: string;
  showBalance?: boolean;
  tokens: Array<{
    symbol: string;
    iconUrl?: string;
    totalBalance: number;
    totalUsd: number;
  }>;
};

function TokenHoldingList({ emptyText, showBalance = false, tokens }: TokenHoldingListProps) {
  return (
    <HoldingList aria-label="主要持仓" emptyText={emptyText}>
      {tokens.map((token, index) => (
        <HoldingItem
          balance={showBalance ? compactNumber(token.totalBalance) : undefined}
          icon={<TokenIcon iconUrl={token.iconUrl} small symbol={token.symbol} />}
          key={`${token.symbol}-${index}`}
          marketValue={currency(token.totalUsd)}
          symbol={token.symbol}
        />
      ))}
    </HoldingList>
  );
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
  const nextWalletSummaries: WalletSummary[] = (snapshot.walletSummary || []).flatMap((summary): WalletSummary[] => {
    const members: WalletRecord[] = walletSummaryMembers(summary)
      .map((wallet) => walletsByAddress.get(normalizeAddressInput(wallet.address)))
      .filter((wallet): wallet is WalletRecord => Boolean(wallet));
    const holdings: Holding[] = (summary.holdings || []).flatMap((holding): Holding[] => {
      const wallet = walletsByAddress.get(normalizeAddressInput(holding.walletAddress));
      return wallet
        ? [
            {
              ...holding,
              walletId: wallet.id,
              walletLabel: wallet.label,
              walletAddress: wallet.address,
              iconUrl: tokenIconUrl(holding.symbol, holding.iconUrl)
            }
          ]
        : [];
    });

    if (!members.length && !holdings.length) {
      return [];
    }

    const inferredMembers: WalletRecord[] =
      members.length > 0
        ? members
        : Array.from(new Set(holdings.map((holding) => holding.walletAddress))).flatMap((address): WalletRecord[] => {
            const wallet = walletsByAddress.get(address);
            return wallet ? [wallet] : [];
          });
    const primaryWallet = inferredMembers.find((wallet) => wallet.addressType === "evm") || inferredMembers[0];
    if (!primaryWallet) {
      return [];
    }

    const groupLabel =
      inferredMembers.find((wallet) => wallet.groupLabel)?.groupLabel ||
      primaryWallet.groupLabel ||
      primaryWallet.label;
    const wallet: WalletRecord = {
      ...primaryWallet,
      label: groupLabel,
      groupLabel,
      groupId: walletRecordGroupKey(primaryWallet)
    };
    const combinedTotalUsd = holdings.reduce((sum, holding) => sum + holding.usdValue, 0);

    return [
      {
        ...summary,
        wallet,
        wallets: inferredMembers,
        addressTypes: Array.from(new Set(inferredMembers.map((item) => item.addressType))),
        totalUsd: combinedTotalUsd,
        tokenCount: holdings.length,
        topTokens: summarizeTopTokens(holdings),
        holdings
      }
    ];
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
  const token = browserStorage()?.getItem(authTokenStorageKey) || "";
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "x-asset-tracker-token": token } : {}),
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

function managementPanelStartsOpen() {
  return typeof window === "undefined" || window.matchMedia(desktopManagementMediaQuery).matches;
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
    const tokenSummary = aggregateTokenSummariesFromWallets(summaries);
    const estimate = calculateConservativeEstimate(tokenSummary);

    return {
      group,
      totalUsd: summaries.reduce((sum, summary) => sum + summary.totalUsd, 0),
      stablecoinUsd: estimate.stablecoinUsd,
      conservativeTotalUsd: estimate.conservativeTotalUsd,
      walletCount: matchingWalletGroups.length,
      addressCount: matchingWalletGroups.reduce((sum, walletGroup) => sum + walletGroup.wallets.length, 0),
      topTokens: tokenSummary.filter((token) => token.totalUsd >= minVisibleUsd).slice(0, 5),
      issueCount:
        matchingWalletGroups.length - summaries.length + summaries.filter((summary) => summary.status !== "ok").length
    };
  }).sort((left, right) => {
    const assetPriority = Number(right.totalUsd > 0) - Number(left.totalUsd > 0);
    return assetPriority || right.totalUsd - left.totalUsd || left.group.order - right.group.order;
  });
}

export default function App() {
  const [wallets, setWallets] = useState<WalletRecord[]>([]);
  const [assetGroups, setAssetGroups] = useState<AssetGroup[]>(defaultAssetGroups);
  const [assetGroupAssignments, setAssetGroupAssignments] = useState<AssetGroupAssignments>({});
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [snapshotHistory, setSnapshotHistory] = useState<SnapshotHistoryPoint[]>([]);
  const [config, setConfig] = useState<Config>({ defaultChains: [], availableChains: [] });
  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  const [includeRisk, setIncludeRisk] = useState(false);
  const [appPage, setAppPage] = useState<"overview" | "wallets">(appPageFromPath);
  const [activeView, setActiveView] = useState<AssetView>("groups");
  const [selectedAssetGroupId, setSelectedAssetGroupId] = useState("all");
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
  const [assetGroupPanelOpen, setAssetGroupPanelOpen] = useState(managementPanelStartsOpen);
  const [managementSort, setManagementSort] = useState<ManagementSort>("sequence");
  const [batchAssetGroupId, setBatchAssetGroupId] = useState(UNCLASSIFIED_ASSET_GROUP_ID);
  const [newAssetGroupName, setNewAssetGroupName] = useState("");
  const [editingAssetGroupId, setEditingAssetGroupId] = useState<string | null>(null);
  const [editingAssetGroupName, setEditingAssetGroupName] = useState("");
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
  const managementSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void loadInitial();
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setSettingsOpen(false);
      setWalletImportOpen(false);
      setDeleteIntent(null);
      setAppPage(appPageFromPath());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const media = window.matchMedia(desktopManagementMediaQuery);
    const syncPanelState = () => setAssetGroupPanelOpen(media.matches);
    media.addEventListener("change", syncPanelState);
    return () => media.removeEventListener("change", syncPanelState);
  }, []);

  async function loadInitial() {
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

      if (portfolioStateTimestamp(nextPortfolioState) > portfolioStateTimestamp(serverState)) {
        const synced = await api<{ state: PortfolioState; persistence: "vercel-blob" | "local-file" }>("/api/state", {
          method: "PUT",
          body: JSON.stringify(nextPortfolioState)
        });
        const normalizedSyncedState = normalizePortfolioState(synced.state);
        writeStoredPortfolioState(normalizedSyncedState);
        setWallets(normalizedSyncedState.wallets);
        setAssetGroups(normalizedSyncedState.assetGroups);
        setAssetGroupAssignments(normalizedSyncedState.assignments);
        setPersistence(synced.persistence);
      }
    } catch (nextError) {
      const apiError = nextError as ApiError;
      if (apiError.status === 401) {
        setAuthRequired(true);
        setError(browserStorage()?.getItem(authTokenStorageKey) ? "访问口令不正确。" : null);
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

    browserStorage()?.setItem(authTokenStorageKey, token);
    setAuthRequired(false);
    setAuthInput("");
    await loadInitial();
  }

  function navigate(nextPage: "overview" | "wallets") {
    const path = nextPage === "wallets" ? "/wallets" : "/";
    setSettingsOpen(false);
    setWalletImportOpen(false);
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
    nextMessage: string
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
      toast.success(nextMessage, { id: "portfolio-operation" });
    } catch (nextError) {
      setError(`已保存在当前浏览器，但云端同步失败：${(nextError as Error).message}`);
    }
  }

  function persistWallets(
    nextWallets: WalletRecord[],
    nextMessage: string,
    nextAssignments: AssetGroupAssignments = assetGroupAssignments
  ) {
    void persistPortfolio(nextWallets, assetGroups, nextAssignments, nextMessage);
  }

  async function refresh() {
    setRefreshing(true);
    toast.dismiss("portfolio-refresh");
    setError(null);
    try {
      const nextSnapshot = await api<Snapshot>("/api/refresh", {
        method: "POST",
        body: JSON.stringify({
          chains: selectedChains,
          includeRisk,
          wallets
        })
      });
      const hydratedSnapshot = applyWalletsToSnapshot(nextSnapshot, wallets) || nextSnapshot;
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
    const lines = walletImportText
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (!lines.length) {
      setWalletImportError("请输入至少一个钱包地址。");
      return;
    }

    const existingAddresses = new Set(wallets.map((wallet) => wallet.address));
    const groupTypes = new Map<string, Set<WalletRecord["addressType"]>>();
    for (const wallet of wallets) {
      const groupKey = walletRecordGroupKey(wallet);
      const types = groupTypes.get(groupKey) || new Set<WalletRecord["addressType"]>();
      types.add(wallet.addressType);
      groupTypes.set(groupKey, types);
    }

    const nextWallets: WalletRecord[] = [];
    const skipped: string[] = [];
    for (const [index, line] of lines.entries()) {
      try {
        const wallet = parseWalletLine(line, walletGroups.length + nextWallets.length);
        if (existingAddresses.has(wallet.address) || nextWallets.some((item) => item.address === wallet.address)) {
          skipped.push(`第 ${index + 1} 行重复`);
          continue;
        }

        const groupKey = walletRecordGroupKey(wallet);
        const types = groupTypes.get(groupKey) || new Set<WalletRecord["addressType"]>();
        if (types.has(wallet.addressType)) {
          skipped.push(`第 ${index + 1} 行同组已有 ${addressTypeLabel(wallet)} 地址`);
          continue;
        }

        types.add(wallet.addressType);
        groupTypes.set(groupKey, types);
        nextWallets.push(wallet);
      } catch (nextError) {
        skipped.push(`第 ${index + 1} 行${(nextError as Error).message}`);
      }
    }

    if (!nextWallets.length) {
      setWalletImportError(skipped.slice(0, 4).join("；") || "没有可导入的钱包地址。");
      return;
    }

    persistWallets(
      [...wallets, ...nextWallets],
      skipped.length
        ? `已导入 ${nextWallets.length} 个地址，跳过 ${skipped.length} 行。`
        : `已导入 ${nextWallets.length} 个地址并保存。`
    );
    setWalletImportError(null);
    setWalletImportText("");
    setWalletImportOpen(false);
  }

  function deleteWallet(address: string) {
    persistWallets(
      wallets.filter((wallet) => wallet.address !== address),
      "钱包地址已删除并保存。"
    );
  }

  function saveGroupLabel(groupKey: string) {
    const label = editingGroupLabel.trim();
    if (!label) {
      setError("钱包名称不能为空。");
      return;
    }
    persistWallets(
      wallets.map((wallet) => (walletRecordGroupKey(wallet) === groupKey ? { ...wallet, groupLabel: label } : wallet)),
      "钱包名称已更新并保存。"
    );
    setEditingGroupKey(null);
    setEditingGroupLabel("");
  }

  function walletPairOptions(wallet: WalletRecord) {
    const currentGroupKey = walletRecordGroupKey(wallet);
    return walletGroups.filter(
      (group) => group.key === currentGroupKey || !group.addressTypes.includes(wallet.addressType)
    );
  }

  function updateWalletPair(address: string, nextGroupKey: string) {
    const wallet = wallets.find((item) => item.address === address);
    if (!wallet) {
      return;
    }

    const nextGroup =
      nextGroupKey === "__new__" ? undefined : walletGroups.find((group) => group.key === nextGroupKey);
    const nextGroupId = nextGroup?.key || wallet.id;
    const nextGroupLabel = nextGroup?.label || `独立：${wallet.label}`;
    const currentGroupKey = walletRecordGroupKey(wallet);
    const nextAssignments = {
      ...assetGroupAssignments,
      [nextGroupId]: nextGroup
        ? assetGroupAssignments[nextGroupId] || UNCLASSIFIED_ASSET_GROUP_ID
        : assetGroupAssignments[currentGroupKey] || UNCLASSIFIED_ASSET_GROUP_ID
    };
    persistWallets(
      wallets.map((item) =>
        item.address === address
          ? {
              ...item,
              groupId: nextGroupId,
              groupLabel: nextGroupLabel
            }
          : item
      ),
      "EVM/SOL 配对已更新并保存。",
      nextAssignments
    );
  }

  function saveLabel(address: string) {
    const label = editingLabel.trim();
    if (!label) {
      setError("标签不能为空。");
      return;
    }
    persistWallets(
      wallets.map((wallet) => (wallet.address === address ? { ...wallet, label } : wallet)),
      "钱包标签已更新并保存。"
    );
    setEditingAddress(null);
    setEditingLabel("");
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
      color: assetGroupColorForIndex(assetGroups.length),
      order: Math.max(0, ...assetGroups.filter((item) => !item.system).map((item) => item.order)) + 10,
      createdAt: new Date().toISOString()
    };
    void persistPortfolio(wallets, [...assetGroups, group], assetGroupAssignments, `资产组“${name}”已创建。`);
    setNewAssetGroupName("");
    selectManagementAssetGroup(group.id);
  }

  function selectManagementAssetGroup(assetGroupId: string) {
    setManagementAssetGroupId(assetGroupId);
    setSelectedWalletGroupKeys([]);
    setEditingAssetGroupId(null);
    setEditingAssetGroupName("");
    if (!window.matchMedia(desktopManagementMediaQuery).matches) {
      setAssetGroupPanelOpen(false);
    }
  }

  function saveAssetGroupName(assetGroupId: string) {
    const name = editingAssetGroupName.trim();
    if (!name) {
      setError("资产组名称不能为空。");
      return;
    }
    if (assetGroups.some((group) => group.id !== assetGroupId && group.name.toLowerCase() === name.toLowerCase())) {
      setError("已经存在同名资产组。");
      return;
    }

    void persistPortfolio(
      wallets,
      assetGroups.map((group) => (group.id === assetGroupId ? { ...group, name } : group)),
      assetGroupAssignments,
      "资产组名称已更新。"
    );
    setEditingAssetGroupId(null);
    setEditingAssetGroupName("");
  }

  function deleteAssetGroup(assetGroup: AssetGroup) {
    if (assetGroup.system || assetGroup.id === UNCLASSIFIED_ASSET_GROUP_ID) {
      return;
    }

    const nextAssignments = Object.fromEntries(
      Object.entries(assetGroupAssignments).map(([walletGroupId, assignedGroupId]) => [
        walletGroupId,
        assignedGroupId === assetGroup.id ? UNCLASSIFIED_ASSET_GROUP_ID : assignedGroupId
      ])
    );
    void persistPortfolio(
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
  }

  function confirmDeleteIntent() {
    if (!deleteIntent) {
      return;
    }
    if (deleteIntent.kind === "asset-group") {
      deleteAssetGroup(deleteIntent.assetGroup);
    } else {
      deleteWallet(deleteIntent.wallet.address);
    }
  }

  function assignWalletGroups(walletGroupKeys: string[], assetGroupId: string) {
    if (!walletGroupKeys.length || !assetGroups.some((group) => group.id === assetGroupId)) {
      return;
    }
    const nextAssignments = { ...assetGroupAssignments };
    for (const walletGroupKey of walletGroupKeys) {
      nextAssignments[walletGroupKey] = assetGroupId;
    }
    const assetGroup = assetGroups.find((group) => group.id === assetGroupId)!;
    void persistPortfolio(
      wallets,
      assetGroups,
      nextAssignments,
      `${walletGroupKeys.length} 个钱包已移到“${assetGroup.name}”。`
    );
    setSelectedWalletGroupKeys([]);
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
    setWalletImportOpen(true);
  }

  function clearOverviewAssetSearch() {
    setQuery("");
    window.requestAnimationFrame(() => overviewSearchRef.current?.focus({ preventScroll: true }));
  }

  function clearManagementWalletSearch() {
    setQuery("");
    setSelectedWalletGroupKeys([]);
    window.requestAnimationFrame(() => managementSearchRef.current?.focus({ preventScroll: true }));
  }

  function selectAssetView(view: AssetView) {
    if (view !== activeView) {
      setQuery("");
    }
    if (view === "groups") {
      setSelectedAssetGroupId("all");
    }
    setActiveView(view);
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
  const scopedTokenSummaries = useMemo(
    () => aggregateTokenSummariesFromWallets(scopedWalletSummaries),
    [scopedWalletSummaries]
  );
  const scopedEstimate = useMemo(
    () => calculateConservativeEstimate(scopedTokenSummaries),
    [scopedTokenSummaries]
  );
  const scopedChainSummaries = useMemo(
    () => summarizeChains(scopedWalletSummaries),
    [scopedWalletSummaries]
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

  const filteredWallets = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const summaries = scopedWalletSummaries;
    if (!needle) {
      return summaries;
    }
    return summaries.filter((summary) => {
      const members = walletSummaryMembers(summary);
      const visibleTokens = visibleTokenGroups(summary.holdings);
      return (
        summary.wallet.label.toLowerCase().includes(needle) ||
        summary.wallet.address.toLowerCase().includes(needle) ||
        walletDisplayLabel(summary.wallet).toLowerCase().includes(needle) ||
        members.some(
          (wallet) =>
            wallet.label.toLowerCase().includes(needle) ||
            wallet.address.toLowerCase().includes(needle) ||
            walletDisplayLabel(wallet).toLowerCase().includes(needle)
        ) ||
        visibleTokens.some((token) => token.symbol.toLowerCase().includes(needle))
      );
    });
  }, [query, scopedWalletSummaries]);

  const walletSummariesByGroupKey = useMemo(
    () => new Map((snapshot?.walletSummary || []).map((summary) => [walletSummaryGroupKey(summary), summary])),
    [snapshot]
  );

  const managementAssetGroupItems = useMemo<AssetGroupManagerItem[]>(() => {
    const walletCounts = new Map<string, number>();
    for (const walletGroup of walletGroups) {
      const assetGroupId = assetGroupAssignments[walletGroup.key] || UNCLASSIFIED_ASSET_GROUP_ID;
      walletCounts.set(assetGroupId, (walletCounts.get(assetGroupId) || 0) + 1);
    }
    return assetGroups.map((group) => ({ group, walletCount: walletCounts.get(group.id) || 0 }));
  }, [assetGroupAssignments, assetGroups, walletGroups]);

  const managementWalletGroups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matchingGroups = walletGroups.filter((group) => {
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

    if (managementSort === "assets-desc") {
      return [...matchingGroups].sort((left, right) => {
        const assetDifference =
          (walletSummariesByGroupKey.get(right.key)?.totalUsd || 0) -
          (walletSummariesByGroupKey.get(left.key)?.totalUsd || 0);
        return assetDifference || walletGroupSortRank(left, 999) - walletGroupSortRank(right, 999);
      });
    }

    if (managementSort === "name") {
      return [...matchingGroups].sort((left, right) =>
        left.displayLabel.localeCompare(right.displayLabel, "zh-CN", { numeric: true })
      );
    }

    return matchingGroups;
  }, [assetGroupAssignments, managementAssetGroupId, managementSort, query, walletGroups, walletSummariesByGroupKey]);

  const walletImportLineCount = walletImportText.split(/\n+/).filter((line) => line.trim()).length;
  const solanaWalletCount = wallets.filter((wallet) => wallet.addressType === "solana").length;
  const visibleTokenCount = scopedTokenSummaries.filter((token) => token.totalUsd >= minVisibleUsd).length;
  const scopedTotalUsd = scopedWalletSummaries.reduce((sum, summary) => sum + summary.totalUsd, 0);
  const scopedAddressCount = scopedWalletGroups.reduce((sum, group) => sum + group.wallets.length, 0);
  const selectedAssetGroup = assetGroups.find((group) => group.id === selectedAssetGroupId);
  const scopedCoveredWalletCount = scopedWalletSummaries.filter(
    (summary) => summary.status === "ok" || summary.status === "stale"
  ).length;
  const scopedCoverageIncomplete =
    scopedWalletGroups.length > 0 && scopedCoveredWalletCount < scopedWalletGroups.length;
  const summaryScopeLabel = scopedCoverageIncomplete
    ? selectedAssetGroup
      ? `${selectedAssetGroup.name} 已覆盖资产`
      : "已覆盖资产"
    : selectedAssetGroup
      ? `${selectedAssetGroup.name} 总资产`
      : "全部资产";
  const refreshCounts = useMemo(() => {
    const summaries = snapshot?.walletSummary || [];
    const coveredWalletGroups = new Set(summaries.map((summary) => walletSummaryGroupKey(summary)));
    return {
      ok: summaries.filter((summary) => summary.status === "ok").length,
      stale: summaries.filter((summary) => summary.status === "stale").length,
      error: summaries.filter((summary) => summary.status === "error").length,
      skipped: summaries.filter((summary) => summary.status === "skipped").length,
      missing: Math.max(0, walletGroups.length - coveredWalletGroups.size)
    };
  }, [snapshot, walletGroups]);
  const pairedWalletCount = walletGroups.filter(
    (group) => group.addressTypes.includes("evm") && group.addressTypes.includes("solana")
  ).length;
  const standaloneSolanaCount = walletGroups.filter(
    (group) => group.addressTypes.length === 1 && group.addressTypes[0] === "solana"
  ).length;
  const selectedManagementWalletCount = managementWalletGroups.filter((group) =>
    selectedWalletGroupKeys.includes(group.key)
  ).length;
  const allManagementWalletsSelected =
    managementWalletGroups.length > 0 && selectedManagementWalletCount === managementWalletGroups.length;
  const someManagementWalletsSelected =
    selectedManagementWalletCount > 0 && !allManagementWalletsSelected;
  const deleteFallbackFocusIds = deleteIntent?.kind === "asset-group"
    ? [
        "asset-group-mobile-trigger",
        `asset-group-button-${UNCLASSIFIED_ASSET_GROUP_ID}`,
        "asset-group-button-all"
      ]
    : deleteIntent?.kind === "wallet-address"
      ? [walletGroupToggleId(deleteIntent.walletGroupKey), "wallet-management-search"]
      : [];

  function renderAssetView(view: AssetView) {
    if (loading) {
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
        wallets={filteredWallets}
        assignments={assetGroupAssignments}
        assetGroups={assetGroups}
        emptyMessage={query.trim() ? "没有匹配的钱包或币种。" : undefined}
        onClearSearch={clearOverviewAssetSearch}
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
          <Input
            ref={authInputRef}
            aria-describedby={error ? "auth-error" : undefined}
            aria-label="访问口令"
            autoFocus
            invalid={Boolean(error)}
            value={authInput}
            onChange={(event) => setAuthInput(event.target.value)}
            placeholder="访问口令"
            type="password"
          />
          <Button variant="primary" type="submit">
            解锁
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
        <div className="top-actions">
          {persistence ? (
            <Badge className="sync-label" icon={<Database />} tone="success">
              {persistence === "vercel-blob" ? "云端已同步" : "本地文件"}
            </Badge>
          ) : null}
          <Button variant="secondary" onClick={() => void loadInitial()}>
            <Database size={16} />
            重新载入
          </Button>
          {appPage === "overview" ? (
            <>
              <Button
                aria-haspopup="dialog"
                variant="secondary"
                onClick={openRefreshSettings}
              >
                <Settings2 size={16} />
                刷新范围
              </Button>
              <Button
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
              variant="primary"
              onClick={openWalletImport}
            >
              <Plus size={16} />
              批量导入
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
          <div className="dialog-section-heading">
            <div>
              <strong>扫描网络</strong>
              <span>至少保留一条常用网络，减少无效请求。</span>
            </div>
            <Badge tone="neutral">{draftSelectedChains.length} / {config.availableChains.length}</Badge>
          </div>
          <div className="refresh-chain-grid">
            {config.availableChains.map((chain) => (
              <Checkbox
                checked={draftSelectedChains.includes(chain)}
                className="chain-choice"
                key={chain}
                label={refreshChainLabel(chain)}
                onChange={() => toggleDraftChain(chain)}
              />
            ))}
          </div>
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
            重置默认
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

      {appPage === "overview" && selectedChains.includes("solana") ? (
        <Notice
          icon={<Wallet />}
          title="Solana 追踪范围"
          tone={solanaWalletCount ? "info" : "warning"}
        >
          <span>
            EVM/SOL 已配对 {pairedWalletCount} 组；独立 Solana 钱包 {standaloneSolanaCount} 个，合计追踪{" "}
            {solanaWalletCount} 个 Solana 地址。
          </span>
        </Notice>
      ) : null}

      {appPage === "overview" ? (
        <>
          <PortfolioSummary
            scopeLabel={summaryScopeLabel}
            totalUsd={scopedTotalUsd}
            conservativeTotalUsd={scopedEstimate.conservativeTotalUsd}
            stablecoinUsd={scopedEstimate.stablecoinUsd}
            volatileAssetUsd={scopedEstimate.volatileAssetUsd}
            walletCount={scopedWalletGroups.length}
            coveredWalletCount={scopedCoveredWalletCount}
            addressCount={scopedAddressCount}
            tokenCount={visibleTokenCount}
            activeChainCount={scopedChainSummaries.length}
            scannedChainCount={selectedChains.length}
            updatedAtLabel={formatDate(snapshot?.generatedAt)}
          />

          <RefreshHealth
            scopeLabel={selectedAssetGroup ? "全局刷新质量" : "刷新质量"}
            generatedAt={snapshot?.generatedAt}
            totalWallets={walletGroups.length}
            counts={refreshCounts}
            history={snapshotHistory}
            onInspectIssues={() => {
              setSelectedAssetGroupId("all");
              selectAssetView("wallets");
            }}
          />

          <Tabs
            activationMode="automatic"
            className="content overview-content"
            value={activeView}
            onValueChange={(value) => selectAssetView(value as AssetView)}
          >
            <div className="toolbar">
              <div className="overview-view-primary">
                <TabsList aria-label="资产汇总视图">
                  <TabsTrigger value="groups">
                    <FolderKanban aria-hidden="true" />
                    资产组
                  </TabsTrigger>
                  <TabsTrigger value="chains">
                    <Network aria-hidden="true" />
                    链
                  </TabsTrigger>
                  <TabsTrigger value="tokens">
                    <CircleDollarSign aria-hidden="true" />
                    币种
                  </TabsTrigger>
                  <TabsTrigger value="wallets">
                    <WalletCards aria-hidden="true" />
                    钱包
                  </TabsTrigger>
                </TabsList>

                <IconButton
                  className="overview-export"
                  label="导出资产快照"
                  variant="secondary"
                  disabled={!snapshot}
                  onClick={() => {
                    const payload = JSON.stringify(snapshot, null, 2);
                    const blob = new Blob([payload], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const anchor = document.createElement("a");
                    anchor.href = url;
                    anchor.download = `asset-snapshot-${Date.now()}.json`;
                    anchor.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download aria-hidden="true" />
                </IconButton>
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
              <TabsContent className="overview-tabpanel" key={view} tabIndex={0} value={view}>
                {renderAssetView(view)}
              </TabsContent>
            ))}
          </Tabs>
        </>
      ) : (
        <section className="wallet-management-page">
          <div className="page-heading">
            <div>
              <span className="eyebrow">钱包配置</span>
              <h2>钱包与资产组</h2>
              <p>{walletGroups.length} 个逻辑钱包，{wallets.length} 个链上地址</p>
            </div>
          </div>

          <Dialog
            closeLabel="关闭批量导入"
            initialFocus="first-control"
            open={appPage === "wallets" && walletImportOpen}
            size="lg"
            onOpenChange={setWalletImportOpen}
          >
            <DialogHeader
              description="每行输入一个地址；使用「名称 地址」可直接命名，相同数字会自动配对 EVM/SOL。"
              icon={<WalletCards />}
              title="批量导入钱包"
            />
            <DialogBody className="wallet-import-dialog-body">
              <form
                className="wallet-import-dialog-form"
                id="wallet-import-form"
                onSubmit={(event) => void importWallets(event)}
              >
                <Field className="wallet-import-field" invalid={Boolean(walletImportError)}>
                  <FieldHeader>
                    <FieldLabel htmlFor="wallet-import-addresses">名称与地址</FieldLabel>
                    <Badge tone={walletImportLineCount ? "accent" : "neutral"}>{walletImportLineCount} 行</Badge>
                  </FieldHeader>
                  <LineTextarea
                    id="wallet-import-addresses"
                    value={walletImportText}
                    onChange={(event) => {
                      setWalletImportText(event.target.value);
                      setWalletImportError(null);
                    }}
                    aria-describedby={walletImportError ? "wallet-import-error" : undefined}
                    aria-invalid={Boolean(walletImportError) || undefined}
                    aria-label="批量导入钱包地址"
                    autoCapitalize="off"
                    autoCorrect="off"
                    placeholder={[
                      "钱包 1 0xef49efa4042609b7d84ee2b538dcff4d9953dd50",
                      "钱包 2 0x35217ad88c31db4c95e67b77e68795ea4d54cc30",
                      "SOL 1 AvJUEJSaMcxMSQe5Nc7wQ3aL1ubX533W57LqyqiHHoVZ"
                    ].join("\n")}
                    spellCheck={false}
                  />
                  {walletImportError ? (
                    <FieldError id="wallet-import-error">{walletImportError}</FieldError>
                  ) : null}
                </Field>
              </form>
            </DialogBody>
            <DialogFooter meta="支持 EVM 与 Solana 地址">
              <Button size="sm" variant="secondary" onClick={() => setWalletImportOpen(false)}>
                取消
              </Button>
              <Button
                disabled={!walletImportLineCount}
                form="wallet-import-form"
                size="sm"
                type="submit"
                variant="primary"
              >
                <Plus size={16} />
                导入地址
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
              <dl className="confirm-impact-grid">
                <div>
                  <dt>受影响钱包</dt>
                  <dd>{deleteIntent.walletCount} 个</dd>
                </div>
                <div>
                  <dt>删除后归类</dt>
                  <dd>移至“未分类”</dd>
                </div>
              </dl>
            ) : deleteIntent?.kind === "wallet-address" ? (
              <div className="confirm-wallet-target">
                <div>
                  <Badge tone="outline">{addressTypeLabel(deleteIntent.wallet)}</Badge>
                  <strong>{deleteIntent.walletGroupLabel}</strong>
                </div>
                <code>{deleteIntent.wallet.address}</code>
              </div>
            ) : null}
          </ConfirmDialog>

          <div className="management-workspace">
            <AssetGroupManager
              activeId={managementAssetGroupId}
              editingId={editingAssetGroupId}
              editingName={editingAssetGroupName}
              items={managementAssetGroupItems}
              newName={newAssetGroupName}
              open={assetGroupPanelOpen}
              totalWalletCount={walletGroups.length}
              onBeginEdit={(group) => {
                setEditingAssetGroupId(group.id);
                setEditingAssetGroupName(group.name);
              }}
              onCancelEdit={() => {
                setEditingAssetGroupId(null);
                setEditingAssetGroupName("");
              }}
              onCreate={createAssetGroup}
              onDelete={(assetGroup) => {
                const walletCount = managementAssetGroupItems.find(
                  (item) => item.group.id === assetGroup.id
                )?.walletCount || 0;
                setDeleteIntent({ kind: "asset-group", assetGroup, walletCount });
              }}
              onEditingNameChange={setEditingAssetGroupName}
              onNewNameChange={setNewAssetGroupName}
              onOpenChange={setAssetGroupPanelOpen}
              onSaveEdit={saveAssetGroupName}
              onSelect={selectManagementAssetGroup}
            />

            <section className="content management-content">
              <div className="management-toolbar">
                <div className="management-list-summary">
                  <strong>{managementWalletGroups.length} 个钱包</strong>
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
                    <strong>已选 {selectedWalletGroupKeys.length} 个钱包</strong>
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
                      variant="secondary"
                      size="sm"
                      onClick={() => assignWalletGroups(selectedWalletGroupKeys, batchAssetGroupId)}
                    >
                      <FolderInput size={16} />
                      移动
                    </Button>
                    <IconButton
                      label="清除选择"
                      size="sm"
                      onClick={() => setSelectedWalletGroupKeys([])}
                    >
                      <X size={16} />
                    </IconButton>
                  </div>
                </div>
              ) : null}

              <Table
                className="management-table"
                containerClassName="management-table-container"
              >
                <TableCaption className="sr-only">
                  当前筛选范围内 {managementWalletGroups.length} 个钱包的配置与资产状态
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
                    <TableHead aria-label="操作" className="ui-table-action" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {managementWalletGroups.map((group) => {
                    const summary = walletSummariesByGroupKey.get(group.key);
                    const isExpanded = expandedWalletGroupKeys.includes(group.key);
                    return (
                      <Fragment key={group.key}>
                        <TableRow selected={selectedWalletGroupKeys.includes(group.key)}>
                          <TableCell>
                            <Checkbox
                              checked={selectedWalletGroupKeys.includes(group.key)}
                              onChange={() => toggleWalletGroupSelection(group.key)}
                              aria-label={`选择 ${group.displayLabel}`}
                            />
                          </TableCell>
                          <TableRowHead>
                            <div className="asset-cell">
                              <IdentityMark aria-hidden="true" className="wallet-badge">
                                {walletBadgeText(group.displayLabel)}
                              </IdentityMark>
                              <div>
                                {editingGroupKey === group.key ? (
                                  <div className="inline-edit">
                                    <Input
                                      autoFocus
                                      aria-label="编辑钱包名称"
                                      value={editingGroupLabel}
                                      onChange={(event) => setEditingGroupLabel(event.target.value)}
                                      onKeyDown={(event) => {
                                        if (event.key === "Enter") saveGroupLabel(group.key);
                                      }}
                                    />
                                    <IconButton label="保存钱包名称" size="xs" onClick={() => saveGroupLabel(group.key)}>
                                      <CheckCircle2 size={14} />
                                    </IconButton>
                                  </div>
                                ) : (
                                  <strong>{group.displayLabel}</strong>
                                )}
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
                          <TableCell className="amount" numeric>{currency(summary?.totalUsd || 0)}</TableCell>
                          <TableCell>
                            {summary?.status === "ok" ? (
                              <StatusBadge status="ok">正常</StatusBadge>
                            ) : summary?.status === "stale" ? (
                              <StatusBadge status="stale">旧数据</StatusBadge>
                            ) : summary?.status === "error" ? (
                              <StatusBadge status="error">异常</StatusBadge>
                            ) : (
                              <StatusBadge status="skipped">未刷新</StatusBadge>
                            )}
                          </TableCell>
                          <TableCell className="ui-table-action">
                            <div className="row-actions">
                              <IconButton
                                label="编辑钱包名称"
                                size="sm"
                                onClick={() => {
                                  setEditingGroupKey(group.key);
                                  setEditingGroupLabel(group.displayLabel);
                                }}
                              >
                                <Edit3 size={15} />
                              </IconButton>
                              <IconButton
                                id={walletGroupToggleId(group.key)}
                                label={isExpanded ? "收起地址" : "展开地址"}
                                size="sm"
                                aria-expanded={isExpanded}
                                onClick={() => toggleWalletGroupExpanded(group.key)}
                              >
                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              </IconButton>
                            </div>
                          </TableCell>
                        </TableRow>
                        {isExpanded ? (
                          <TableRow className="wallet-detail-row" key={`${group.key}-details`}>
                            <TableCell colSpan={6}>
                              <WalletAddressDetailList aria-label={`${group.displayLabel}地址详情`}>
                                {group.wallets.map((wallet) => (
                                  <WalletAddressDetailItem
                                    address={wallet.address}
                                    key={wallet.address}
                                    kind={addressTypeLabel(wallet)}
                                    label={editingAddress === wallet.address ? (
                                      <Input
                                        autoFocus
                                        aria-label="编辑地址标签"
                                        value={editingLabel}
                                        onChange={(event) => setEditingLabel(event.target.value)}
                                        onKeyDown={(event) => {
                                          if (event.key === "Enter") saveLabel(wallet.address);
                                        }}
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
                                            ...(walletRecordGroupKey(wallet) !== wallet.id
                                              ? [{ value: "__new__", label: "独立钱包" }]
                                              : [])
                                          ]}
                                        />
                                      </div>
                                    )}
                                    actions={(
                                      <div className="row-actions">
                                        {editingAddress === wallet.address ? (
                                          <IconButton label="保存地址标签" size="sm" onClick={() => saveLabel(wallet.address)}>
                                            <CheckCircle2 size={15} />
                                          </IconButton>
                                        ) : (
                                          <IconButton
                                            label="编辑地址标签"
                                            size="sm"
                                            onClick={() => {
                                              setEditingAddress(wallet.address);
                                              setEditingLabel(wallet.label);
                                            }}
                                          >
                                            <Edit3 size={15} />
                                          </IconButton>
                                        )}
                                        <IconButton label="复制地址" size="sm" onClick={() => void navigator.clipboard.writeText(wallet.address)}>
                                          <Copy size={15} />
                                        </IconButton>
                                        <IconButton
                                          label="删除地址"
                                          size="sm"
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
                                      </div>
                                    )}
                                  />
                                ))}
                              </WalletAddressDetailList>
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
              {!managementWalletGroups.length ? (
                <EmptyState
                  className="compact-empty"
                  icon={query.trim() ? undefined : <WalletCards />}
                  title={
                    query.trim()
                      ? "没有匹配的钱包"
                      : managementAssetGroupId === "all"
                        ? "还没有钱包"
                        : "这个资产组还没有钱包"
                  }
                  description={
                    query.trim()
                      ? "请调整钱包名称或地址关键词。"
                      : managementAssetGroupId === "all"
                        ? "批量导入 EVM 或 Solana 地址后即可开始追踪。"
                        : "可以从全部钱包中选择，并归类到当前资产组。"
                  }
                  variant={query.trim() ? "no-results" : "empty"}
                  action={
                    query.trim() ? (
                      <ClearSearchAction onClear={clearManagementWalletSearch} />
                    ) : managementAssetGroupId === "all" ? (
                      <Button size="sm" variant="primary" onClick={openWalletImport}>
                        <Plus aria-hidden="true" />
                        批量导入
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
        </section>
      )}
    </main>
  );
}

function ClearSearchAction({ onClear }: { onClear: () => void }) {
  return (
    <Button size="sm" variant="secondary" onClick={onClear}>
      <X aria-hidden="true" />
      清除搜索
    </Button>
  );
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

  return (
    <div className="asset-group-ledger">
      {activeSummaries.length ? (
        <>
          <Table className="group-table" containerClassName="desktop-ledger-table">
            <TableCaption className="sr-only">按资产组汇总的个人加密资产</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>资产组</TableHead>
                <TableHead numeric>总资产</TableHead>
                <TableHead numeric>保守估值</TableHead>
                <TableHead numeric>稳定币</TableHead>
                <TableHead numeric>钱包 / 地址</TableHead>
                <TableHead>主要持仓</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeSummaries.map((summary) => (
                <TableRow className="group-data-row" key={summary.group.id}>
                  <TableRowHead>
                    <Button className="group-open-button" variant="quiet" onClick={() => onOpen(summary)}>
                      <AssetGroupMark size="lg" tone={summary.group.color} />
                      <span>
                        <strong>{summary.group.name}</strong>
                        <small>{summary.walletCount} 个逻辑钱包</small>
                      </span>
                      <ChevronRight size={16} />
                    </Button>
                  </TableRowHead>
                  <TableCell className="amount group-amount" numeric>
                    <strong>{currency(summary.totalUsd)}</strong>
                    {summary.totalUsd > 0 ? (
                      <AssetShareBar value={summary.totalUsd} total={portfolioTotalUsd} />
                    ) : null}
                  </TableCell>
                  <TableCell numeric>{currency(summary.conservativeTotalUsd)}</TableCell>
                  <TableCell numeric>{currency(summary.stablecoinUsd)}</TableCell>
                  <TableCell numeric>{summary.walletCount} / {summary.addressCount}</TableCell>
                  <TableCell>
                    <TokenHoldingList tokens={summary.topTokens} />
                  </TableCell>
                  <TableCell>
                    {summary.issueCount ? (
                      <StatusBadge status="stale">{summary.issueCount} 个待检查</StatusBadge>
                    ) : (
                      <StatusBadge status="ok">正常</StatusBadge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ItemGroup aria-label="资产组列表" className="mobile-ledger-list">
            {activeSummaries.map((summary) => (
              <LedgerItem
                key={summary.group.id}
                media={(
                  <AssetGroupMark size="lg" tone={summary.group.color} />
                )}
                title={summary.group.name}
                description={`${summary.walletCount} 个逻辑钱包 · ${summary.addressCount} 个地址`}
                amount={currency(summary.totalUsd)}
                amountMeta={summary.totalUsd > 0 ? (
                  <AssetShareBar value={summary.totalUsd} total={portfolioTotalUsd} />
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
                  { label: "保守估值", value: currency(summary.conservativeTotalUsd) },
                  { label: "稳定币", value: currency(summary.stablecoinUsd) },
                  {
                    label: "状态",
                    value: summary.issueCount ? (
                      <StatusBadge status="stale">{summary.issueCount} 个待检查</StatusBadge>
                    ) : (
                      <StatusBadge status="ok">正常</StatusBadge>
                    )
                  }
                ]}
                details={(
                  <LedgerDetail label="主要持仓">
                    <TokenHoldingList tokens={summary.topTokens} />
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
                  <strong>{inactiveSummaries.length} 个待配置资产组</strong>
                  <small>没有钱包和资产，不计入主账本</small>
                </span>
              </span>
              <span className="inactive-groups-toggle">
                <span className="inactive-toggle-label when-closed">查看</span>
                <span className="inactive-toggle-label when-open">收起</span>
                <ChevronRight aria-hidden="true" size={16} />
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
                <strong>{currency(chain.totalUsd)}</strong>
                <AssetShareBar value={chain.totalUsd} total={portfolioTotalUsd} />
              </TableCell>
              <TableCell numeric>{currency(chain.conservativeTotalUsd)}</TableCell>
              <TableCell numeric>{currency(chain.stablecoinUsd)}</TableCell>
              <TableCell numeric>{chain.walletCount}</TableCell>
              <TableCell numeric>{chain.tokenCount}</TableCell>
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
              >
                <Network aria-hidden="true" />
              </IdentityMark>
            )}
            title={chain.chainName}
            description={chain.chainKey === chain.chainName ? "已识别网络" : `链 ID ${chain.chainKey}`}
            amount={currency(chain.totalUsd)}
            amountMeta={<AssetShareBar value={chain.totalUsd} total={portfolioTotalUsd} />}
            facts={[
              { label: "保守估值", value: currency(chain.conservativeTotalUsd) },
              { label: "稳定币", value: currency(chain.stablecoinUsd) },
              { label: "钱包 / 币种", value: `${chain.walletCount} / ${chain.tokenCount}` }
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
                    <span>{token.holdingCount} 笔持仓</span>
                  </div>
                </div>
              </TableRowHead>
              <TableCell className="amount" numeric>{currency(token.totalUsd)}</TableCell>
              <TableCell numeric>{fullNumber(token.totalBalance)}</TableCell>
              <TableCell numeric>{token.walletCount}</TableCell>
              <TableCell>
                <div className="breakdown">
                  {token.chainBreakdown.slice(0, 4).map((chain) => (
                    <span key={chain.chainName}>
                      {chain.chainName} · {currency(chain.totalUsd)}
                    </span>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className="contracts">
                  {token.contracts.slice(0, 3).map((contract) => (
                    <code key={contract}>{shortAddress(contract)}</code>
                  ))}
                  {token.riskCount ? <Badge tone="warning">风险 {token.riskCount}</Badge> : null}
                </div>
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
            description={`${token.holdingCount} 笔持仓`}
            amount={currency(token.totalUsd)}
            amountLabel="总金额"
            facts={[
              { label: "数量", value: fullNumber(token.totalBalance) },
              { label: "钱包", value: token.walletCount },
              { label: "链", value: token.chainBreakdown.length }
            ]}
            details={(
              <>
                <LedgerDetail label="链分布">
                  <div className="breakdown">
                    {token.chainBreakdown.slice(0, 4).map((chain) => (
                      <span key={chain.chainName}>{chain.chainName} · {currency(chain.totalUsd)}</span>
                    ))}
                  </div>
                </LedgerDetail>
                <LedgerDetail label="合约">
                  <div className="contracts">
                    {token.contracts.slice(0, 3).map((contract) => (
                      <code key={contract}>{shortAddress(contract)}</code>
                    ))}
                    {token.riskCount ? <Badge tone="warning">风险 {token.riskCount}</Badge> : null}
                  </div>
                </LedgerDetail>
              </>
            )}
          />
        ))}
      </ItemGroup>
    </>
  );
}

function walletStatusBadge(summary: WalletSummary) {
  if (summary.status === "ok") {
    return <StatusBadge status="ok">正常</StatusBadge>;
  }
  if (summary.status === "stale") {
    const detail = `旧数据 · ${formatDate(summary.updatedAt)} · ${summary.staleReason || "等待重新刷新"}`;
    return (
      <StatusBadge status="stale" className="wallet-status-detail" title={detail} truncate>
        {detail}
      </StatusBadge>
    );
  }
  if (summary.status === "skipped") {
    const detail = summary.error || "未刷新";
    return (
      <StatusBadge status="skipped" className="wallet-status-detail" title={detail} truncate>
        {detail}
      </StatusBadge>
    );
  }
  const detail = summary.error || "刷新失败";
  return (
    <StatusBadge status="error" className="wallet-status-detail" title={detail} truncate>
      {detail}
    </StatusBadge>
  );
}

function WalletTable({
  wallets,
  assignments,
  assetGroups,
  emptyMessage,
  onClearSearch
}: {
  wallets: WalletSummary[];
  assignments: AssetGroupAssignments;
  assetGroups: AssetGroup[];
  emptyMessage?: string;
  onClearSearch: () => void;
}) {
  if (!wallets.length) {
    return (
      <EmptyState
        icon={emptyMessage ? undefined : <WalletCards />}
        title={emptyMessage ? "没有匹配结果" : "暂无钱包资产"}
        description={emptyMessage || "刷新资产后会在这里汇总。"}
        variant={emptyMessage ? "no-results" : "empty"}
        action={emptyMessage ? <ClearSearchAction onClear={onClearSearch} /> : undefined}
      />
    );
  }

  const walletRows = wallets.map((summary) => {
    const members = walletSummaryMembers(summary);
    const label = walletDisplayLabel(summary.wallet);
    const visibleTokens = visibleTokenGroups(summary.holdings);
    const assetGroupId = assignments[walletSummaryGroupKey(summary)] || UNCLASSIFIED_ASSET_GROUP_ID;
    const assetGroup = assetGroups.find((group) => group.id === assetGroupId);
    return { assetGroup, label, members, summary, visibleTokens };
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
          {walletRows.map(({ assetGroup, label, members, summary, visibleTokens }) => (
            <TableRow key={summary.wallet.groupId || summary.wallet.address}>
              <TableRowHead>
                <div className="asset-cell">
                  <IdentityMark aria-hidden="true" className="wallet-badge">
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
              <TableCell className="amount" numeric>{currency(summary.totalUsd)}</TableCell>
              <TableCell numeric>{visibleTokens.length}</TableCell>
              <TableCell>
                <TokenHoldingList
                  emptyText={summary.totalUsd > 0 ? "小额已省略" : "暂无持仓"}
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
        {walletRows.map(({ assetGroup, label, members, summary, visibleTokens }) => (
          <LedgerItem
            key={summary.wallet.groupId || summary.wallet.address}
            media={(
              <IdentityMark aria-hidden="true" className="wallet-badge">
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
            amount={currency(summary.totalUsd)}
            amountLabel="总金额"
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
              { label: "币种", value: visibleTokens.length }
            ]}
            details={(
              <>
                <LedgerDetail label="主要持仓">
                  <TokenHoldingList
                    emptyText={summary.totalUsd > 0 ? "小额已省略" : "暂无持仓"}
                    showBalance
                    tokens={visibleTokens.slice(0, 6)}
                  />
                </LedgerDetail>
                <LedgerDetail label="刷新状态">{walletStatusBadge(summary)}</LedgerDetail>
              </>
            )}
          />
        ))}
      </ItemGroup>
    </>
  );
}
