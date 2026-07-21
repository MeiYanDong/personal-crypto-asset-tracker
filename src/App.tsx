import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Copy,
  Database,
  Download,
  Edit3,
  Folder,
  FolderKanban,
  LayoutDashboard,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Trash2,
  Wallet,
  WalletCards,
  X
} from "lucide-react";
import { Fragment, FormEvent, useEffect, useMemo, useState } from "react";
import { calculateConservativeEstimate } from "../shared/asset-estimate";
import PortfolioSummary, { AssetShareBar } from "./components/PortfolioSummary";
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

type WalletGroup = {
  key: string;
  label: string;
  displayLabel: string;
  wallets: WalletRecord[];
  addressTypes: Array<WalletRecord["addressType"]>;
};

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
const authTokenStorageKey = "asset-tracker-token";
const snapshotStorageKey = "asset-tracker-snapshot-v1";
const walletsStorageKey = "asset-tracker-wallets-v1";
const portfolioStateStorageKey = "asset-tracker-state-v2";
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

function walletSummaryTypes(summary: WalletSummary) {
  return summary.addressTypes?.length
    ? summary.addressTypes
    : Array.from(new Set(walletSummaryMembers(summary).map((wallet) => wallet.addressType)));
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
  const [config, setConfig] = useState<Config>({ defaultChains: [], availableChains: [] });
  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  const [includeRisk, setIncludeRisk] = useState(false);
  const [appPage, setAppPage] = useState<"overview" | "wallets">(appPageFromPath);
  const [activeView, setActiveView] = useState<"groups" | "tokens" | "wallets">("groups");
  const [selectedAssetGroupId, setSelectedAssetGroupId] = useState("all");
  const [query, setQuery] = useState("");
  const [walletImportText, setWalletImportText] = useState("");
  const [walletImportOpen, setWalletImportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedWalletGroupKeys, setSelectedWalletGroupKeys] = useState<string[]>([]);
  const [expandedWalletGroupKeys, setExpandedWalletGroupKeys] = useState<string[]>([]);
  const [managementAssetGroupId, setManagementAssetGroupId] = useState("all");
  const [batchAssetGroupId, setBatchAssetGroupId] = useState(UNCLASSIFIED_ASSET_GROUP_ID);
  const [newAssetGroupName, setNewAssetGroupName] = useState("");
  const [editingAssetGroupId, setEditingAssetGroupId] = useState<string | null>(null);
  const [editingAssetGroupName, setEditingAssetGroupName] = useState("");
  const [editingGroupKey, setEditingGroupKey] = useState<string | null>(null);
  const [editingGroupLabel, setEditingGroupLabel] = useState("");
  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [authInput, setAuthInput] = useState("");
  const [persistence, setPersistence] = useState<"vercel-blob" | "local-file" | null>(null);

  useEffect(() => {
    void loadInitial();
  }, []);

  useEffect(() => {
    const handlePopState = () => setAppPage(appPageFromPath());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  async function loadInitial() {
    setLoading(true);
    setError(null);
    try {
      const [configPayload, statePayload, snapshotPayload] = await Promise.all([
        api<Config>("/api/config"),
        api<{ state: PortfolioState; persistence: "vercel-blob" | "local-file" }>("/api/state"),
        api<Snapshot | null>("/api/snapshot")
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
      return;
    }

    browserStorage()?.setItem(authTokenStorageKey, token);
    setAuthRequired(false);
    setAuthInput("");
    await loadInitial();
  }

  function navigate(nextPage: "overview" | "wallets") {
    const path = nextPage === "wallets" ? "/wallets" : "/";
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
    setMessage(nextMessage);

    try {
      const payload = await api<{ state: PortfolioState; persistence: "vercel-blob" | "local-file" }>("/api/state", {
        method: "PUT",
        body: JSON.stringify(state)
      });
      const syncedState = normalizePortfolioState(payload.state);
      writeStoredPortfolioState(syncedState);
      setPersistence(payload.persistence);
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
    setMessage(null);
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
      setMessage(
        hydratedSnapshot.needsLogin
          ? "需要先登录 OKX Onchain OS。"
          : hydratedSnapshot.errors.length
            ? `刷新完成，但 ${hydratedSnapshot.errors.length} 个钱包失败。`
          : hydratedSnapshot.stale?.length
            ? `资产快照已刷新并保存，${hydratedSnapshot.stale.length} 个钱包沿用上次成功数据。`
            : "资产快照已刷新并保存。"
      );
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
      setError("请输入至少一个钱包地址。");
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
      setError(skipped.slice(0, 4).join("；") || "没有可导入的钱包地址。");
      return;
    }

    persistWallets(
      [...wallets, ...nextWallets],
      skipped.length
        ? `已导入 ${nextWallets.length} 个地址，跳过 ${skipped.length} 行。`
        : `已导入 ${nextWallets.length} 个地址并保存。`
    );
    setWalletImportText("");
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
    setManagementAssetGroupId(group.id);
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
    if (!window.confirm(`删除资产组“${assetGroup.name}”？组内钱包会移到“未分类”。`)) {
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

  function toggleChain(chain: string) {
    setSelectedChains((current) =>
      current.includes(chain) ? current.filter((item) => item !== chain) : [...current, chain]
    );
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

  const managementWalletGroups = useMemo(() => {
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

  const walletSummariesByGroupKey = useMemo(
    () => new Map((snapshot?.walletSummary || []).map((summary) => [walletSummaryGroupKey(summary), summary])),
    [snapshot]
  );

  const walletImportLineCount = walletImportText.split(/\n+/).filter((line) => line.trim()).length;
  const solanaWalletCount = wallets.filter((wallet) => wallet.addressType === "solana").length;
  const visibleTokenCount = scopedTokenSummaries.filter((token) => token.totalUsd >= minVisibleUsd).length;
  const scopedTotalUsd = scopedWalletSummaries.reduce((sum, summary) => sum + summary.totalUsd, 0);
  const scopedAddressCount = scopedWalletGroups.reduce((sum, group) => sum + group.wallets.length, 0);
  const selectedAssetGroup = assetGroups.find((group) => group.id === selectedAssetGroupId);
  const scopedIssueCount = selectedAssetGroupId === "all"
    ? assetGroupSummaries.reduce((sum, summary) => sum + summary.issueCount, 0)
    : assetGroupSummaries.find((summary) => summary.group.id === selectedAssetGroupId)?.issueCount || 0;
  const pairedWalletCount = walletGroups.filter(
    (group) => group.addressTypes.includes("evm") && group.addressTypes.includes("solana")
  ).length;
  const standaloneSolanaCount = walletGroups.filter(
    (group) => group.addressTypes.length === 1 && group.addressTypes[0] === "solana"
  ).length;
  const allManagementWalletsSelected =
    managementWalletGroups.length > 0 &&
    managementWalletGroups.every((group) => selectedWalletGroupKeys.includes(group.key));

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
            <div className="notice error">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          ) : null}
          <input
            autoFocus
            value={authInput}
            onChange={(event) => setAuthInput(event.target.value)}
            placeholder="访问口令"
            type="password"
          />
          <button className="primary-button" type="submit">
            解锁
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="shell">
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
          <nav className="main-nav" aria-label="主导航">
            <button
              className={appPage === "overview" ? "active" : ""}
              type="button"
              onClick={() => navigate("overview")}
            >
              <LayoutDashboard size={16} />
              资产总览
            </button>
            <button
              className={appPage === "wallets" ? "active" : ""}
              type="button"
              onClick={() => navigate("wallets")}
            >
              <FolderKanban size={16} />
              钱包管理
            </button>
          </nav>
        </div>
        <div className="top-actions">
          {persistence ? (
            <span className="sync-label">
              <Database size={14} />
              {persistence === "vercel-blob" ? "云端已同步" : "本地文件"}
            </span>
          ) : null}
          <button className="ghost-button" type="button" onClick={() => void loadInitial()}>
            <Database size={16} />
            重新载入
          </button>
          {appPage === "overview" ? (
            <>
              <button className="ghost-button" type="button" onClick={() => setSettingsOpen((current) => !current)}>
                <Settings2 size={16} />
                刷新范围
              </button>
              <button className="primary-button" type="button" onClick={() => void refresh()} disabled={refreshing}>
                {refreshing ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
                刷新资产
              </button>
            </>
          ) : (
            <button className="primary-button" type="button" onClick={() => setWalletImportOpen((current) => !current)}>
              <Plus size={16} />
              批量导入
            </button>
          )}
        </div>
      </section>

      {error ? (
        <div className="notice error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      ) : null}

      {message ? (
        <div className="notice">
          <CheckCircle2 size={18} />
          <span>{message}</span>
        </div>
      ) : null}

      {appPage === "overview" && snapshot?.needsLogin ? (
        <div className="notice warning">
          <AlertTriangle size={18} />
          <span>OKX Onchain OS 登录态过期。先在终端执行：</span>
          <code>{snapshot.loginCommand}</code>
        </div>
      ) : null}

      {appPage === "overview" && snapshot?.stale?.length ? (
        <div className="notice warning">
          <AlertTriangle size={18} />
          <span>
            {snapshot.stale.length} 个钱包本轮刷新失败，已沿用上次成功数据；数量和金额不会再因限流被当作 0。
          </span>
        </div>
      ) : null}

      {appPage === "overview" && settingsOpen ? (
        <section className="refresh-settings">
          <div className="refresh-settings-head">
            <div>
              <strong>刷新范围</strong>
              <span>选择需要扫描的链，设置会用于下一次资产刷新。</span>
            </div>
            <button className="text-button" type="button" onClick={() => setSelectedChains(config.defaultChains)}>
              重置默认
            </button>
          </div>
          <div className="chain-grid wide">
            {config.availableChains.map((chain) => (
              <button
                key={chain}
                type="button"
                className={selectedChains.includes(chain) ? "chain selected" : "chain"}
                onClick={() => toggleChain(chain)}
              >
                {selectedChains.includes(chain) ? <CheckCircle2 size={14} /> : <X size={14} />}
                {chain}
              </button>
            ))}
          </div>
          <label className="toggle inline-toggle">
            <input
              type="checkbox"
              checked={includeRisk}
              onChange={(event) => setIncludeRisk(event.target.checked)}
            />
            <span>包含风险/自定义 token</span>
          </label>
        </section>
      ) : null}

      {appPage === "overview" && selectedChains.includes("solana") ? (
        <div className={solanaWalletCount ? "notice" : "notice warning"}>
          <Wallet size={18} />
          <span>
            EVM/SOL 已配对 {pairedWalletCount} 组；独立 Solana 钱包 {standaloneSolanaCount} 个，合计追踪{" "}
            {solanaWalletCount} 个 Solana 地址。
          </span>
        </div>
      ) : null}

      {appPage === "overview" ? (
        <>
          <PortfolioSummary
            scopeLabel={selectedAssetGroup ? `${selectedAssetGroup.name} 总资产` : "全部资产"}
            totalUsd={scopedTotalUsd}
            conservativeTotalUsd={scopedEstimate.conservativeTotalUsd}
            stablecoinUsd={scopedEstimate.stablecoinUsd}
            volatileAssetUsd={scopedEstimate.volatileAssetUsd}
            walletCount={scopedWalletGroups.length}
            addressCount={scopedAddressCount}
            tokenCount={visibleTokenCount}
            chainCount={selectedChains.length}
            updatedAtLabel={formatDate(snapshot?.generatedAt)}
            issueCount={scopedIssueCount}
          />

          <section className="content overview-content">
            <div className="toolbar">
              <div className="tabs" role="tablist" aria-label="资产汇总视图">
                <button
                  type="button"
                  className={activeView === "groups" ? "active" : ""}
                  onClick={() => setActiveView("groups")}
                >
                  <FolderKanban size={16} />
                  资产组
                </button>
                <button
                  type="button"
                  className={activeView === "tokens" ? "active" : ""}
                  onClick={() => setActiveView("tokens")}
                >
                  <CircleDollarSign size={16} />
                  币种
                </button>
                <button
                  type="button"
                  className={activeView === "wallets" ? "active" : ""}
                  onClick={() => setActiveView("wallets")}
                >
                  <WalletCards size={16} />
                  钱包
                </button>
              </div>

              <div className="toolbar-filters">
                <select
                  className="group-filter"
                  value={selectedAssetGroupId}
                  onChange={(event) => setSelectedAssetGroupId(event.target.value)}
                  aria-label="筛选资产组"
                >
                  <option value="all">全部资产组</option>
                  {assetGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                {activeView !== "groups" ? (
                  <label className="search">
                    <Search size={16} />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="搜索币种、合约或钱包"
                    />
                  </label>
                ) : null}
              </div>

              <button
                className="ghost-button"
                type="button"
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
                <Download size={16} />
                导出
              </button>
            </div>

            {loading ? (
              <div className="empty-state">
                <Loader2 className="spin" size={26} />
                <span>正在载入资产数据</span>
              </div>
            ) : activeView === "groups" ? (
              <AssetGroupTable
                summaries={assetGroupSummaries}
                portfolioTotalUsd={scopedTotalUsd}
                onOpen={(summary) => {
                  if (summary.walletCount) {
                    setSelectedAssetGroupId(summary.group.id);
                    setActiveView("wallets");
                    setQuery("");
                    return;
                  }
                  setManagementAssetGroupId(summary.group.id);
                  navigate("wallets");
                }}
              />
            ) : activeView === "tokens" ? (
              <TokenTable tokens={filteredTokens} />
            ) : (
              <WalletTable wallets={filteredWallets} assignments={assetGroupAssignments} assetGroups={assetGroups} />
            )}
          </section>
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

          {walletImportOpen ? (
            <form className="wallet-import management-import" onSubmit={(event) => void importWallets(event)}>
              <div className="wallet-import-head">
                <div>
                  <strong>批量导入钱包地址</strong>
                  <span>支持「名称 地址」，相同数字会自动配对为同一个 EVM/SOL 钱包。</span>
                </div>
                <strong>{walletImportLineCount || wallets.length} 行</strong>
              </div>
              <textarea
                value={walletImportText}
                onChange={(event) => setWalletImportText(event.target.value)}
                placeholder={[
                  "1 0xef49efa4042609b7d84ee2b538dcff4d9953dd50",
                  "2 0x35217ad88c31db4c95e67b77e68795ea4d54cc30",
                  "SOL 1 AvJUEJSaMcxMSQe5Nc7wQ3aL1ubX533W57LqyqiHHoVZ"
                ].join("\n")}
              />
              <div className="wallet-import-actions">
                <span>支持一行一个地址，也支持「名称 地址」。数字相同会自动配为同一个钱包。</span>
                <div className="inline-actions">
                  <button className="ghost-button compact" type="button" onClick={() => setWalletImportOpen(false)}>
                    取消
                  </button>
                  <button className="primary-button compact" type="submit">
                    <Plus size={16} />
                    导入地址
                  </button>
                </div>
              </div>
            </form>
          ) : null}

          <div className="management-workspace">
            <aside className="asset-group-sidebar">
              <div className="asset-group-sidebar-head">
                <div>
                  <span className="eyebrow">资产组</span>
                  <strong>归类</strong>
                </div>
                <span>{assetGroups.length}</span>
              </div>
              <div className="asset-group-list">
                <button
                  className={managementAssetGroupId === "all" ? "asset-group-item active" : "asset-group-item"}
                  type="button"
                  onClick={() => setManagementAssetGroupId("all")}
                >
                  <span className="asset-group-icon all"><FolderKanban size={16} /></span>
                  <span>全部钱包</span>
                  <strong>{walletGroups.length}</strong>
                </button>
                {assetGroups.map((assetGroup) => {
                  const count = walletGroups.filter(
                    (group) =>
                      (assetGroupAssignments[group.key] || UNCLASSIFIED_ASSET_GROUP_ID) === assetGroup.id
                  ).length;
                  return (
                    <div
                      className={managementAssetGroupId === assetGroup.id ? "asset-group-item-row active" : "asset-group-item-row"}
                      key={assetGroup.id}
                    >
                      {editingAssetGroupId === assetGroup.id ? (
                        <div className="asset-group-item">
                          <span className={`asset-group-icon ${assetGroup.color}`}><Folder size={16} /></span>
                          <input
                            autoFocus
                            value={editingAssetGroupName}
                            onChange={(event) => setEditingAssetGroupName(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                saveAssetGroupName(assetGroup.id);
                              }
                            }}
                          />
                          <strong>{count}</strong>
                        </div>
                      ) : (
                        <button
                          className="asset-group-item"
                          type="button"
                          onClick={() => setManagementAssetGroupId(assetGroup.id)}
                        >
                          <span className={`asset-group-icon ${assetGroup.color}`}><Folder size={16} /></span>
                          <span>{assetGroup.name}</span>
                          <strong>{count}</strong>
                        </button>
                      )}
                      <div className="asset-group-actions">
                        {editingAssetGroupId === assetGroup.id ? (
                          <button className="icon-button mini" type="button" aria-label="保存资产组名称" onClick={() => saveAssetGroupName(assetGroup.id)}>
                            <CheckCircle2 size={14} />
                          </button>
                        ) : (
                          <button
                            className="icon-button mini"
                            type="button"
                            aria-label="编辑资产组"
                            onClick={() => {
                              setEditingAssetGroupId(assetGroup.id);
                              setEditingAssetGroupName(assetGroup.name);
                            }}
                          >
                            <Edit3 size={13} />
                          </button>
                        )}
                        {!assetGroup.system ? (
                          <button className="icon-button mini danger" type="button" aria-label="删除资产组" onClick={() => deleteAssetGroup(assetGroup)}>
                            <Trash2 size={13} />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
              <form className="new-asset-group" onSubmit={createAssetGroup}>
                <input
                  value={newAssetGroupName}
                  onChange={(event) => setNewAssetGroupName(event.target.value)}
                  placeholder="新资产组名称"
                />
                <button className="icon-button add" type="submit" aria-label="添加资产组">
                  <Plus size={16} />
                </button>
              </form>
            </aside>

            <section className="content management-content">
              <div className="management-toolbar">
                <div className="batch-tools">
                  <label className="select-all">
                    <input
                      type="checkbox"
                      checked={allManagementWalletsSelected}
                      onChange={() =>
                        setSelectedWalletGroupKeys(
                          allManagementWalletsSelected ? [] : managementWalletGroups.map((group) => group.key)
                        )
                      }
                    />
                    <span>{selectedWalletGroupKeys.length ? `已选 ${selectedWalletGroupKeys.length}` : "全选"}</span>
                  </label>
                  <select value={batchAssetGroupId} onChange={(event) => setBatchAssetGroupId(event.target.value)}>
                    {assetGroups.map((group) => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                  <button
                    className="ghost-button compact"
                    type="button"
                    disabled={!selectedWalletGroupKeys.length}
                    onClick={() => assignWalletGroups(selectedWalletGroupKeys, batchAssetGroupId)}
                  >
                    移动
                  </button>
                </div>
                <label className="search management-search">
                  <Search size={16} />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索钱包名或地址" />
                </label>
              </div>

              <div className="table-wrap">
                <table className="data-table management-table">
                  <thead>
                    <tr>
                      <th aria-label="选择" />
                      <th>钱包</th>
                      <th>资产组</th>
                      <th>最近资产</th>
                      <th>状态</th>
                      <th aria-label="操作" />
                    </tr>
                  </thead>
                  <tbody>
                    {managementWalletGroups.map((group) => {
                      const summary = walletSummariesByGroupKey.get(group.key);
                      const isExpanded = expandedWalletGroupKeys.includes(group.key);
                      return (
                        <Fragment key={group.key}>
                          <tr>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedWalletGroupKeys.includes(group.key)}
                                onChange={() => toggleWalletGroupSelection(group.key)}
                                aria-label={`选择 ${group.displayLabel}`}
                              />
                            </td>
                            <td>
                              <div className="asset-cell">
                                <span className="wallet-badge">{walletBadgeText(group.displayLabel)}</span>
                                <div>
                                  {editingGroupKey === group.key ? (
                                    <div className="inline-edit">
                                      <input
                                        autoFocus
                                        value={editingGroupLabel}
                                        onChange={(event) => setEditingGroupLabel(event.target.value)}
                                        onKeyDown={(event) => {
                                          if (event.key === "Enter") saveGroupLabel(group.key);
                                        }}
                                      />
                                      <button className="icon-button mini" type="button" aria-label="保存钱包名称" onClick={() => saveGroupLabel(group.key)}>
                                        <CheckCircle2 size={14} />
                                      </button>
                                    </div>
                                  ) : (
                                    <strong>{group.displayLabel}</strong>
                                  )}
                                  <div className="address-stack">
                                    {group.wallets.map((wallet) => (
                                      <span key={wallet.address}>{addressTypeLabel(wallet)} · {shortAddress(wallet.address)}</span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <select
                                className="row-group-select"
                                value={assetGroupAssignments[group.key] || UNCLASSIFIED_ASSET_GROUP_ID}
                                onChange={(event) => assignWalletGroups([group.key], event.target.value)}
                              >
                                {assetGroups.map((assetGroup) => (
                                  <option key={assetGroup.id} value={assetGroup.id}>{assetGroup.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="amount">{currency(summary?.totalUsd || 0)}</td>
                            <td>
                              {summary?.status === "ok" ? (
                                <span className="status ok">正常</span>
                              ) : summary?.status === "stale" ? (
                                <span className="status stale">旧数据</span>
                              ) : summary?.status === "error" ? (
                                <span className="status error">异常</span>
                              ) : (
                                <span className="status skipped">未刷新</span>
                              )}
                            </td>
                            <td>
                              <div className="row-actions">
                                <button
                                  className="icon-button"
                                  type="button"
                                  aria-label="编辑钱包名称"
                                  title="编辑钱包名称"
                                  onClick={() => {
                                    setEditingGroupKey(group.key);
                                    setEditingGroupLabel(group.displayLabel);
                                  }}
                                >
                                  <Edit3 size={15} />
                                </button>
                                <button
                                  className="icon-button"
                                  type="button"
                                  aria-label={isExpanded ? "收起地址" : "展开地址"}
                                  title={isExpanded ? "收起地址" : "展开地址"}
                                  onClick={() => toggleWalletGroupExpanded(group.key)}
                                >
                                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded ? (
                            <tr className="wallet-detail-row" key={`${group.key}-details`}>
                              <td colSpan={6}>
                                <div className="wallet-detail-list">
                                  {group.wallets.map((wallet) => (
                                    <div className="wallet-detail-item" key={wallet.address}>
                                      <span className="address-type">{addressTypeLabel(wallet)}</span>
                                      <div className="wallet-detail-copy">
                                        {editingAddress === wallet.address ? (
                                          <input
                                            autoFocus
                                            value={editingLabel}
                                            onChange={(event) => setEditingLabel(event.target.value)}
                                            onKeyDown={(event) => {
                                              if (event.key === "Enter") saveLabel(wallet.address);
                                            }}
                                          />
                                        ) : (
                                          <strong>{wallet.label}</strong>
                                        )}
                                        <code>{wallet.address}</code>
                                      </div>
                                      <label className="pair-control detail-pair-control">
                                        <span>配对到</span>
                                        <select
                                          value={walletRecordGroupKey(wallet)}
                                          onChange={(event) => updateWalletPair(wallet.address, event.target.value)}
                                        >
                                          {walletPairOptions(wallet).map((option) => (
                                            <option key={option.key} value={option.key}>{option.displayLabel}</option>
                                          ))}
                                          {walletRecordGroupKey(wallet) !== wallet.id ? <option value="__new__">独立钱包</option> : null}
                                        </select>
                                      </label>
                                      <div className="row-actions">
                                        {editingAddress === wallet.address ? (
                                          <button className="icon-button" type="button" aria-label="保存地址标签" onClick={() => saveLabel(wallet.address)}>
                                            <CheckCircle2 size={15} />
                                          </button>
                                        ) : (
                                          <button
                                            className="icon-button"
                                            type="button"
                                            aria-label="编辑地址标签"
                                            onClick={() => {
                                              setEditingAddress(wallet.address);
                                              setEditingLabel(wallet.label);
                                            }}
                                          >
                                            <Edit3 size={15} />
                                          </button>
                                        )}
                                        <button className="icon-button" type="button" aria-label="复制地址" onClick={() => void navigator.clipboard.writeText(wallet.address)}>
                                          <Copy size={15} />
                                        </button>
                                        <button
                                          className="icon-button danger"
                                          type="button"
                                          aria-label="删除地址"
                                          onClick={() => {
                                            if (window.confirm(`删除地址 ${shortAddress(wallet.address)}？`)) deleteWallet(wallet.address);
                                          }}
                                        >
                                          <Trash2 size={15} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
                {!managementWalletGroups.length ? (
                  <div className="empty-state compact-empty">
                    <WalletCards size={24} />
                    <span>这个资产组还没有钱包。</span>
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        </section>
      )}
    </main>
  );
}

function AssetGroupTable({
  summaries,
  portfolioTotalUsd,
  onOpen
}: {
  summaries: AssetGroupSummary[];
  portfolioTotalUsd: number;
  onOpen: (summary: AssetGroupSummary) => void;
}) {
  return (
    <div className="table-wrap">
      <table className="data-table group-table">
        <thead>
          <tr>
            <th>资产组</th>
            <th>总资产</th>
            <th>保守估值</th>
            <th>稳定币</th>
            <th>钱包 / 地址</th>
            <th>主要持仓</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          {summaries.map((summary) => (
            <tr
              className={summary.walletCount ? "clickable-row" : "clickable-row empty-group"}
              key={summary.group.id}
              onClick={() => onOpen(summary)}
            >
              <td>
                <div className="asset-cell">
                  <span className={`asset-group-icon large ${summary.group.color}`}>
                    <Folder size={18} />
                  </span>
                  <div>
                    <strong>{summary.group.name}</strong>
                    <span>{summary.walletCount ? `${summary.walletCount} 个逻辑钱包` : "前往钱包管理配置"}</span>
                  </div>
                </div>
              </td>
              <td className="amount group-amount">
                <strong>{currency(summary.totalUsd)}</strong>
                {summary.totalUsd > 0 ? (
                  <AssetShareBar value={summary.totalUsd} total={portfolioTotalUsd} />
                ) : null}
              </td>
              <td>{currency(summary.conservativeTotalUsd)}</td>
              <td>{currency(summary.stablecoinUsd)}</td>
              <td>{summary.walletCount} / {summary.addressCount}</td>
              <td>
                <div className="token-stack">
                  {summary.topTokens.length ? summary.topTokens.map((token, index) => (
                    <span className="token-pill" key={`${token.symbol}-${index}`}>
                      <TokenIcon iconUrl={token.iconUrl} small symbol={token.symbol} />
                      {token.symbol} · {currency(token.totalUsd)}
                    </span>
                  )) : <span>暂无持仓</span>}
                </div>
              </td>
              <td>
                {!summary.walletCount ? (
                  <span className="status skipped">空组</span>
                ) : summary.issueCount ? (
                  <span className="status stale">{summary.issueCount} 个待检查</span>
                ) : (
                  <span className="status ok">正常</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TokenTable({ tokens }: { tokens: TokenSummary[] }) {
  if (!tokens.length) {
    return (
      <div className="empty-state">
        <CircleDollarSign size={26} />
        <span>还没有币种数据，刷新资产后会在这里汇总。</span>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="data-table token-table">
        <thead>
          <tr>
            <th>币种</th>
            <th>总金额</th>
            <th>数量</th>
            <th>钱包</th>
            <th>链分布</th>
            <th>合约</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((token, index) => (
            <tr key={`${token.symbol}-${token.contracts.join("-")}-${index}`}>
              <td>
                <div className="asset-cell">
                  <TokenIcon iconUrl={token.iconUrl} symbol={token.symbol} />
                  <div>
                    <strong>{token.symbol}</strong>
                    <span>{token.holdingCount} 笔持仓</span>
                  </div>
                </div>
              </td>
              <td className="amount">{currency(token.totalUsd)}</td>
              <td>{fullNumber(token.totalBalance)}</td>
              <td>{token.walletCount}</td>
              <td>
                <div className="breakdown">
                  {token.chainBreakdown.slice(0, 4).map((chain) => (
                    <span key={chain.chainName}>
                      {chain.chainName} · {currency(chain.totalUsd)}
                    </span>
                  ))}
                </div>
              </td>
              <td>
                <div className="contracts">
                  {token.contracts.slice(0, 3).map((contract) => (
                    <code key={contract}>{shortAddress(contract)}</code>
                  ))}
                  {token.riskCount ? <span className="risk">风险 {token.riskCount}</span> : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WalletTable({
  wallets,
  assignments,
  assetGroups
}: {
  wallets: WalletSummary[];
  assignments: AssetGroupAssignments;
  assetGroups: AssetGroup[];
}) {
  if (!wallets.length) {
    return (
      <div className="empty-state">
        <WalletCards size={26} />
        <span>还没有钱包资产数据，刷新资产后会在这里汇总。</span>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="data-table wallet-table">
        <thead>
          <tr>
            <th>钱包</th>
            <th>资产组</th>
            <th>总金额</th>
            <th>币种数</th>
            <th>主要持仓</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          {wallets.map((summary) => {
            const members = walletSummaryMembers(summary);
            const label = walletDisplayLabel(summary.wallet);
            const visibleTokens = visibleTokenGroups(summary.holdings);
            const assetGroupId = assignments[walletSummaryGroupKey(summary)] || UNCLASSIFIED_ASSET_GROUP_ID;
            const assetGroup = assetGroups.find((group) => group.id === assetGroupId);
            return (
              <tr key={summary.wallet.groupId || summary.wallet.address}>
                <td>
                  <div className="asset-cell">
                    <span className="wallet-badge">{walletBadgeText(label)}</span>
                    <div>
                      <strong>
                        {label}
                        {walletSummaryTypes(summary).map((type) => (
                          <span className="address-type" key={type}>
                            {type === "solana" ? "SOL" : "EVM"}
                          </span>
                        ))}
                        {members.some((wallet) => wallet.source === "okx-agentic-wallet") ? (
                          <span className="address-type">OKX</span>
                        ) : null}
                      </strong>
                      <div className="address-stack">
                        {members.map((wallet) => (
                          <span key={wallet.address}>
                            {addressTypeLabel(wallet)} · {shortAddress(wallet.address)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </td>
              <td>
                <span className="group-name-cell">
                  <span className={`asset-group-dot ${assetGroup?.color || "gray"}`} />
                  {assetGroup?.name || "未分类"}
                </span>
              </td>
              <td className="amount">{currency(summary.totalUsd)}</td>
              <td>{visibleTokens.length}</td>
              <td>
                <div className="token-stack">
                  {visibleTokens.length ? (
                    visibleTokens.slice(0, 6).map((token) => (
                      <span className="token-pill" key={token.symbol}>
                        <TokenIcon iconUrl={token.iconUrl} small symbol={token.symbol} />
                        {token.symbol} · {compactNumber(token.totalBalance)} · {currency(token.totalUsd)}
                      </span>
                    ))
                  ) : (
                    <span>{summary.totalUsd > 0 ? "小额已省略" : "暂无持仓"}</span>
                  )}
                </div>
              </td>
              <td>
                {summary.status === "ok" ? (
                  <span className="status ok">正常</span>
                ) : summary.status === "stale" ? (
                  <span className="status stale">
                    旧数据 · {formatDate(summary.updatedAt)} · {summary.staleReason}
                  </span>
                ) : summary.status === "skipped" ? (
                  <span className="status skipped">{summary.error}</span>
                ) : (
                  <span className="status error">{summary.error}</span>
                )}
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
