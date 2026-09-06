import express from "express";
import { get as getBlob, put as putBlob } from "@vercel/blob";
import { execFile } from "node:child_process";
import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { calculateConservativeEstimate } from "../shared/asset-estimate.js";
import {
  buildDefiProtocols,
  defiProtocolTotalUsd,
  defiReceiptTokenAddresses,
  defiStableAssetBreakdown,
  parseDefiOverview,
  parseDefiPositionDetails,
  type DefiProtocolPosition
} from "../shared/defi-position.js";
import {
  type AssetGroup,
  type AssetGroupAssignments,
  defaultAssetGroups,
  inferAssetGroupId,
  normalizeAssetGroups
} from "../shared/portfolio-state.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "data");
const walletsPath = path.join(dataDir, "wallets.json");
const snapshotPath = path.join(dataDir, "snapshot.json");
const snapshotHistoryPath = path.join(dataDir, "snapshot-history.json");
const portfolioStatePath = path.join(dataDir, "portfolio-state.json");
const portfolioStateBlobPath = "asset-tracker/portfolio-state.json";
const snapshotBlobPath = "asset-tracker/snapshot.json";
const snapshotHistoryBlobPath = "asset-tracker/snapshot-history.json";

const PORT = Number(process.env.PORT || 8787);
const IS_VERCEL = Boolean(process.env.VERCEL);
const ACCESS_TOKEN = process.env.ASSET_TRACKER_TOKEN || process.env.ASSET_TRACKER_PASSWORD || "";
const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const SOLANA_ADDRESS_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const SOLANA_CHAINS = new Set(["solana", "501"]);
const OKX_BASE_URL = "https://web3.okx.com";
const OKX_BALANCE_PATH = "/api/v6/dex/balance/all-token-balances-by-address";
const OKX_DEFI_OVERVIEW_PATH = "/api/v6/defi/user/asset/platform/list";
const OKX_DEFI_DETAIL_PATH = "/api/v6/defi/user/asset/platform/detail";
const MIN_DEFI_DETAIL_USD = 1;
const OKX_DEFI_REQUEST_INTERVAL_MS = 1050;
const DEFAULT_CHAINS = [
  "ethereum",
  "solana",
  "base",
  "robinhood",
  "bsc",
  "arbitrum",
  "polygon",
  "optimism",
  "avalanche",
  "xlayer"
];

type Wallet = {
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
  rawBalance: string;
  tokenPrice: number;
  usdValue: number;
  isRiskToken: boolean;
};

type WalletPortfolio = {
  wallet: Wallet;
  status: "ok" | "stale" | "error" | "skipped";
  totalUsd: number;
  tokenCount: number;
  holdings: Holding[];
  defiTotalUsd: number;
  defiPositionCount: number;
  defiProtocols: DefiProtocolPosition[];
  defiStatus: "ok" | "partial" | "stale" | "error" | "skipped";
  defiError?: string;
  updatedAt?: string;
  staleReason?: string;
  error?: string;
};

type RefreshOptions = {
  chains: string[];
  includeRisk: boolean;
  includeDefi: boolean;
  refreshRequestId?: string;
  wallets?: Wallet[];
};

type PortfolioState = {
  version: 2;
  wallets: Wallet[];
  assetGroups: AssetGroup[];
  assignments: AssetGroupAssignments;
  updatedAt: string;
};

type Snapshot = {
  generatedAt: string;
  refreshRequestId?: string;
  chains: string[];
  includeRisk: boolean;
  includeDefi: boolean;
  walletCount: number;
  totalUsd: number;
  defiTotalUsd: number;
  defiProtocolCount: number;
  defiPositionCount: number;
  stableAssetUsd: number;
  stablecoinUsd: number;
  volatileAssetUsd: number;
  conservativeTotalUsd: number;
  needsLogin: boolean;
  loginCommand: string;
  tokenSummary: ReturnType<typeof aggregateByToken>;
  walletSummary: ReturnType<typeof aggregateByWallet>;
  errors: Array<{ wallet: Wallet; error?: string }>;
  stale: Array<{ wallet: Wallet; error?: string; updatedAt?: string }>;
  skipped: Array<{ wallet: Wallet; reason?: string }>;
  defiErrors: Array<{ wallet: Wallet; error?: string }>;
};

type SnapshotHistoryPoint = {
  generatedAt: string;
  walletCount: number;
  totalUsd: number;
  stableAssetUsd: number;
  stablecoinUsd: number;
  volatileAssetUsd: number;
  conservativeTotalUsd: number;
  defiTotalUsd: number;
  okCount: number;
  staleCount: number;
  errorCount: number;
  skippedCount: number;
};

const chainNames: Record<string, string> = {
  "1": "Ethereum",
  "56": "BSC",
  "137": "Polygon",
  "8453": "Base",
  "4663": "Robinhood",
  "10": "Optimism",
  "42161": "Arbitrum",
  "43114": "Avalanche",
  "196": "XLayer",
  "501": "Solana",
  ethereum: "Ethereum",
  solana: "Solana",
  bsc: "BSC",
  polygon: "Polygon",
  base: "Base",
  robinhood: "Robinhood",
  optimism: "Optimism",
  arbitrum: "Arbitrum",
  avalanche: "Avalanche",
  xlayer: "XLayer"
};

const chainIds: Record<string, string> = {
  ethereum: "1",
  eth: "1",
  bsc: "56",
  polygon: "137",
  base: "8453",
  robinhood: "4663",
  optimism: "10",
  arbitrum: "42161",
  avalanche: "43114",
  avax: "43114",
  xlayer: "196",
  solana: "501",
  linea: "59144",
  scroll: "534352",
  zksync: "324",
  fantom: "250"
};

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

const geckoTerminalNetworks: Record<string, string> = {
  "1": "eth",
  ethereum: "eth",
  eth: "eth",
  "56": "bsc",
  bsc: "bsc",
  "137": "polygon_pos",
  polygon: "polygon_pos",
  "8453": "base",
  base: "base",
  "10": "optimism",
  optimism: "optimism",
  "42161": "arbitrum",
  arbitrum: "arbitrum",
  "43114": "avax",
  avalanche: "avax",
  avax: "avax",
  "196": "x-layer",
  xlayer: "x-layer",
  "x-layer": "x-layer",
  "501": "solana",
  solana: "solana"
};

const dexScreenerChains: Record<string, string> = {
  "1": "ethereum",
  ethereum: "ethereum",
  eth: "ethereum",
  "56": "bsc",
  bsc: "bsc",
  "137": "polygon",
  polygon: "polygon",
  "8453": "base",
  base: "base",
  "4663": "robinhood",
  robinhood: "robinhood",
  "10": "optimism",
  optimism: "optimism",
  "42161": "arbitrum",
  arbitrum: "arbitrum",
  "43114": "avalanche",
  avalanche: "avalanche",
  avax: "avalanche",
  "196": "xlayer",
  xlayer: "xlayer",
  "501": "solana",
  solana: "solana"
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

const MIN_EXTERNAL_ICON_USD = 1;
const TOKEN_ICON_METADATA_TIMEOUT_MS = 3500;
const tokenIconMetadataCache = new Map<string, { iconUrl?: string; expiresAt: number }>();

let volatileSnapshot: Snapshot | null = null;

const app = express();
app.use(express.json({ limit: "1mb" }));

app.use("/api", (request, response, next) => {
  if (!ACCESS_TOKEN) {
    next();
    return;
  }

  const authHeader = request.header("authorization") || "";
  const headerToken = request.header("x-asset-tracker-token") || "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : "";
  const providedToken = bearerToken || headerToken;
  if (providedToken === ACCESS_TOKEN) {
    next();
    return;
  }

  response.status(401).json({
    error: "需要访问口令。"
  });
});

async function ensureDataDir() {
  await fs.mkdir(dataDir, { recursive: true });
}

async function readWallets(): Promise<Wallet[]> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(walletsPath, "utf8");
    const wallets = JSON.parse(raw) as Wallet[];
    return wallets.map((wallet, index) => ({
      ...wallet,
      id: wallet.id || `wallet-${String(index + 1).padStart(3, "0")}`,
      label: wallet.label || `钱包 ${index + 1}`,
      address: normalizeAddress(wallet.address),
      addressType: wallet.addressType || getAddressType(wallet.address)
    }));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      await writeJsonFile(walletsPath, []);
      return [];
    }
    throw error;
  }
}

async function writeWallets(wallets: Wallet[]) {
  await ensureDataDir();
  await writeJsonFile(walletsPath, wallets);
}

async function writeJsonFile(filePath: string, payload: unknown) {
  try {
    await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  } catch (error) {
    if (isReadOnlyFsError(error)) {
      throw new HttpError(
        503,
        "当前部署没有配置持久化存储，无法写入钱包或快照。请在本地修改，或接入 Vercel Blob/Postgres 后重试。"
      );
    }
    throw error;
  }
}

function blobStorageEnabled() {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
      (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN)
  );
}

async function readBlobJson<T>(pathname: string): Promise<T | null> {
  if (!blobStorageEnabled()) {
    return null;
  }

  const result = await getBlob(pathname, { access: "private", useCache: false });
  if (!result || result.statusCode === 304 || !result.stream) {
    return null;
  }

  return JSON.parse(await new Response(result.stream).text()) as T;
}

async function writeBlobJson(pathname: string, payload: unknown) {
  await putBlob(pathname, `${JSON.stringify(payload, null, 2)}\n`, {
    access: "private",
    allowOverwrite: true,
    cacheControlMaxAge: 60,
    contentType: "application/json"
  });
}

function normalizeAssignments(
  input: unknown,
  wallets: Wallet[],
  assetGroups: AssetGroup[]
): AssetGroupAssignments {
  const validGroupIds = new Set(assetGroups.map((group) => group.id));
  const walletGroups = new Map<string, Wallet[]>();
  for (const wallet of wallets) {
    const key = walletGroupKey(wallet);
    walletGroups.set(key, [...(walletGroups.get(key) || []), wallet]);
  }

  const source = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const assignments: AssetGroupAssignments = {};
  for (const [walletGroupId, members] of walletGroups) {
    const requestedGroupId = String(source[walletGroupId] || "");
    assignments[walletGroupId] = validGroupIds.has(requestedGroupId)
      ? requestedGroupId
      : inferAssetGroupId(members.flatMap((wallet) => [wallet.groupLabel, wallet.label]));
  }

  return assignments;
}

function normalizePortfolioState(input: unknown, fallbackWallets: Wallet[]): PortfolioState {
  const item = (input && typeof input === "object" ? input : {}) as Partial<PortfolioState>;
  const wallets = normalizeRequestWallets(item.wallets) || fallbackWallets;
  const assetGroups = normalizeAssetGroups(item.assetGroups);
  const assignments = normalizeAssignments(item.assignments, wallets, assetGroups);
  const updatedAt = Number.isFinite(Date.parse(String(item.updatedAt || "")))
    ? String(item.updatedAt)
    : new Date().toISOString();

  return {
    version: 2,
    wallets,
    assetGroups,
    assignments,
    updatedAt
  };
}

async function readPortfolioState(): Promise<PortfolioState> {
  const fallbackWallets = await readWallets();
  const blobState = await readBlobJson<PortfolioState>(portfolioStateBlobPath);
  if (blobState) {
    return normalizePortfolioState(blobState, fallbackWallets);
  }

  try {
    const raw = await fs.readFile(portfolioStatePath, "utf8");
    return normalizePortfolioState(JSON.parse(raw), fallbackWallets);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  return normalizePortfolioState(
    {
      version: 2,
      wallets: fallbackWallets,
      assetGroups: defaultAssetGroups,
      assignments: {},
      updatedAt: "2026-07-21T00:00:00.000Z"
    },
    fallbackWallets
  );
}

async function writePortfolioState(state: PortfolioState) {
  if (blobStorageEnabled()) {
    await writeBlobJson(portfolioStateBlobPath, state);
    return;
  }

  await ensureDataDir();
  await writeJsonFile(portfolioStatePath, state);
}

function isReadOnlyFsError(error: unknown) {
  const code = (error as NodeJS.ErrnoException).code;
  return code === "EROFS" || code === "EACCES" || code === "EPERM";
}

function normalizeAddress(address: string) {
  const trimmed = address.trim();
  return EVM_ADDRESS_RE.test(trimmed) ? trimmed.toLowerCase() : trimmed;
}

function getAddressType(address: string): Wallet["addressType"] {
  const normalized = normalizeAddress(address);
  if (EVM_ADDRESS_RE.test(normalized)) {
    return "evm";
  }
  if (SOLANA_ADDRESS_RE.test(normalized)) {
    return "solana";
  }
  throw new HttpError(400, "请输入有效的 EVM 或 Solana 钱包地址。");
}

function stableWalletId(address: string) {
  const normalized = normalizeAddress(address);
  const type = getAddressType(normalized);
  return `wallet-${type}-${normalized.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12).toLowerCase()}`;
}

function tokenIconHash(symbol: string) {
  let hash = 0;
  for (const char of symbol || "?") {
    hash = (hash * 31 + (char.codePointAt(0) || 0)) >>> 0;
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

function readTokenIconUrl(item: Record<string, unknown>, symbol: string) {
  const direct = [
    item.iconUrl,
    item.logoUrl,
    item.logoURI,
    item.logo,
    item.tokenLogoUrl,
    item.tokenLogo,
    item.tokenIcon,
    item.tokenImageUrl,
    item.imageUrl,
    item.icon
  ]
    .map((value) => String(value || "").trim())
    .find((value) => /^https?:\/\//i.test(value));

  return direct || fallbackTokenIconUrl(symbol);
}

function metadataTokenAddress(holding: Holding) {
  const address = holding.tokenContractAddress.trim();
  if (!address || address === "(native)") {
    return undefined;
  }

  return EVM_ADDRESS_RE.test(address) ? address.toLowerCase() : address;
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
  const contractAddress = metadataTokenAddress(holding);
  const nativeSymbol = nativeSymbolForHolding(holding);
  if (contractAddress && nativeSymbol && symbol === nativeSymbol) {
    return `${symbol}:${holding.chainIndex || holding.chainName}:${contractAddress}`;
  }

  return symbol;
}

function metadataChainKey(holding: Pick<Holding, "chainIndex" | "chainName">, chains: Record<string, string>) {
  const candidates = [holding.chainIndex, holding.chainName];
  for (const candidate of candidates) {
    const key = candidate.trim().toLowerCase();
    if (chains[key]) {
      return chains[key];
    }
  }
  return undefined;
}

async function fetchJsonWithTimeout(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TOKEN_ICON_METADATA_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { accept: "application/json" },
      signal: controller.signal
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function readGeckoTerminalIcon(payload: unknown) {
  const object = payload as Record<string, unknown> | null;
  const data = object?.data as Record<string, unknown> | undefined;
  const attributes = data?.attributes as Record<string, unknown> | undefined;
  const imageUrl = String(attributes?.image_url || "").trim();
  return /^https?:\/\//i.test(imageUrl) ? imageUrl : undefined;
}

function readDexScreenerIcon(payload: unknown, chainId?: string) {
  const object = payload as Record<string, unknown> | null;
  const pairs = Array.isArray(object?.pairs) ? object.pairs : Array.isArray(payload) ? payload : [];
  const normalizedChain = chainId?.toLowerCase();
  const pair =
    pairs.find((entry) => String((entry as Record<string, unknown>).chainId || "").toLowerCase() === normalizedChain) ||
    pairs[0];
  const info = (pair as Record<string, unknown> | undefined)?.info as Record<string, unknown> | undefined;
  const imageUrl = String(info?.imageUrl || "").trim();
  return /^https?:\/\//i.test(imageUrl) ? imageUrl : undefined;
}

async function resolveMetadataTokenIconUrl(holding: Holding) {
  const staticIconUrl = knownTokenIconUrl(holding.symbol);
  if (staticIconUrl) {
    return staticIconUrl;
  }

  const address = metadataTokenAddress(holding);
  if (!address) {
    return undefined;
  }

  const cacheKey = `${holding.chainIndex || holding.chainName}:${address}`.toLowerCase();
  const cached = tokenIconMetadataCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.iconUrl;
  }

  const geckoNetwork = metadataChainKey(holding, geckoTerminalNetworks);
  if (geckoNetwork) {
    const geckoPayload = await fetchJsonWithTimeout(
      `https://api.geckoterminal.com/api/v2/networks/${encodeURIComponent(geckoNetwork)}/tokens/${encodeURIComponent(address)}`
    );
    const geckoIconUrl = readGeckoTerminalIcon(geckoPayload);
    if (geckoIconUrl) {
      tokenIconMetadataCache.set(cacheKey, { iconUrl: geckoIconUrl, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
      return geckoIconUrl;
    }
  }

  const dexChain = metadataChainKey(holding, dexScreenerChains);
  if (dexChain) {
    const dexPayload = await fetchJsonWithTimeout(
      `https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(address)}`
    );
    const dexIconUrl = readDexScreenerIcon(dexPayload, dexChain);
    if (dexIconUrl) {
      tokenIconMetadataCache.set(cacheKey, { iconUrl: dexIconUrl, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
      return dexIconUrl;
    }
  }

  tokenIconMetadataCache.set(cacheKey, { expiresAt: Date.now() + 60 * 60 * 1000 });
  return undefined;
}

async function enrichPortfolioIcons(portfolios: WalletPortfolio[]) {
  const groups = new Map<string, { holdings: Holding[]; totalUsd: number }>();

  for (const portfolio of portfolios) {
    for (const holding of portfolio.holdings) {
      if (holding.iconUrl && !isGeneratedTokenIconUrl(holding.iconUrl)) {
        continue;
      }

      const address = metadataTokenAddress(holding);
      if (!address) {
        continue;
      }

      const groupKey = `${holding.chainIndex || holding.chainName}:${address}`.toLowerCase();
      const group = groups.get(groupKey) || { holdings: [], totalUsd: 0 };
      group.holdings.push(holding);
      group.totalUsd += holding.usdValue;
      groups.set(groupKey, group);
    }
  }

  const candidates = Array.from(groups.values()).filter((group) => group.totalUsd >= MIN_EXTERNAL_ICON_USD);
  await mapLimit(candidates, 4, async (group) => {
    const iconUrl = await resolveMetadataTokenIconUrl(group.holdings[0]);
    if (!iconUrl) {
      return;
    }
    for (const holding of group.holdings) {
      holding.iconUrl = iconUrl;
    }
  });
}

function walletGroupKey(wallet: Wallet) {
  return wallet.groupId || wallet.id || wallet.address;
}

function walletGroupLabel(wallet: Wallet) {
  return wallet.groupLabel || wallet.label;
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

function walletSequenceRank(values: Array<string | undefined>, fallback: number) {
  const ranks = values
    .map((value) => walletSequenceRankValue(value))
    .filter((value): value is number => value !== null);

  return ranks.length ? Math.min(...ranks) : 1000 + fallback;
}

function countWalletGroups(wallets: Wallet[]) {
  return new Set(wallets.map((wallet) => walletGroupKey(wallet))).size;
}

function walletTypeRank(wallet: Pick<Wallet, "addressType">) {
  return wallet.addressType === "evm" ? 0 : 1;
}

function normalizeRequestWallets(input: unknown) {
  if (!Array.isArray(input)) {
    return undefined;
  }

  const seen = new Set<string>();
  return input.slice(0, 250).flatMap((entry, index) => {
    try {
      const item = entry as Partial<Wallet>;
      const address = normalizeAddress(String(item.address || ""));
      if (!address || seen.has(address)) {
        return [];
      }

      const addressType = getAddressType(address);
      seen.add(address);
      const id = String(item.id || stableWalletId(address));
      const label = String(item.label || `钱包 ${index + 1}`).trim();
      const source = item.source === "okx-agentic-wallet" ? item.source : item.source === "manual" ? item.source : undefined;
      const accountId = item.accountId ? String(item.accountId) : undefined;
      const groupId = item.groupId ? String(item.groupId) : id;
      const groupLabel = item.groupLabel ? String(item.groupLabel).trim() : undefined;

      return [
        {
          id,
          label,
          address,
          addressType,
          source,
          accountId,
          groupId,
          groupLabel,
          createdAt: item.createdAt || new Date().toISOString()
        }
      ];
    } catch {
      return [];
    }
  });
}

function safeNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

function getChainName(chainIndex: string) {
  return chainNames[chainIndex] || chainIndex || "Unknown";
}

function compatibleChains(wallet: Wallet, chains: string[]) {
  if (wallet.addressType === "solana") {
    return chains.filter((chain) => SOLANA_CHAINS.has(chain.toLowerCase()));
  }

  return chains.filter((chain) => !SOLANA_CHAINS.has(chain.toLowerCase()));
}

function isRateLimitError(error: string) {
  return /rate limit|rate limited|too many requests|429/i.test(error);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let lastOkxDefiRequestAt = 0;
let okxDefiRequestQueue: Promise<void> = Promise.resolve();

function paceOkxDefiRequest() {
  const scheduled = okxDefiRequestQueue.then(async () => {
    const waitMs = Math.max(
      0,
      lastOkxDefiRequestAt + OKX_DEFI_REQUEST_INTERVAL_MS - Date.now()
    );
    if (waitMs) {
      await sleep(waitMs);
    }
    lastOkxDefiRequestAt = Date.now();
  });
  okxDefiRequestQueue = scheduled.catch(() => undefined);
  return scheduled;
}

function extractJson(output: string) {
  const trimmed = output.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const objectStart = trimmed.indexOf("{");
    const objectEnd = trimmed.lastIndexOf("}");
    if (objectStart >= 0 && objectEnd > objectStart) {
      return JSON.parse(trimmed.slice(objectStart, objectEnd + 1));
    }

    const arrayStart = trimmed.indexOf("[");
    const arrayEnd = trimmed.lastIndexOf("]");
    if (arrayStart >= 0 && arrayEnd > arrayStart) {
      return JSON.parse(trimmed.slice(arrayStart, arrayEnd + 1));
    }
  }

  return null;
}

function readTokenAssets(payload: unknown): unknown[] {
  const object = payload as Record<string, unknown>;
  const data = object?.data;
  const result = object?.result;
  const dataObject = data as Record<string, unknown> | undefined;
  const resultObject = result as Record<string, unknown> | undefined;

  const candidates = [
    object?.tokenAssets,
    dataObject?.tokenAssets,
    resultObject?.tokenAssets,
    dataObject?.assets,
    resultObject?.assets,
    payload
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  for (const candidate of [data, result]) {
    if (!Array.isArray(candidate)) {
      continue;
    }

    const nested = candidate.flatMap((entry) => {
      const item = entry as Record<string, unknown>;
      if (Array.isArray(item.tokenAssets)) {
        return item.tokenAssets;
      }
      if (Array.isArray(item.assets)) {
        return item.assets;
      }
      return [];
    });

    if (nested.length) {
      return nested;
    }
  }

  return [];
}

function readOkxAddressItems(payload: unknown) {
  const object = payload as Record<string, unknown>;
  const data = object?.data as Record<string, unknown> | undefined;
  const accountName = String(data?.accountName || "OKX Account");
  const accountId = String(data?.accountId || "");
  const solana = Array.isArray(data?.solana) ? data.solana : [];

  return solana
    .map((entry, index) => {
      const item = entry as Record<string, unknown>;
      const address = normalizeAddress(String(item.address || ""));
      if (!SOLANA_ADDRESS_RE.test(address)) {
        return null;
      }

      return {
        label: `${accountName} SOL${solana.length > 1 ? ` ${index + 1}` : ""}`,
        address,
        addressType: "solana" as const,
        accountId
      };
    })
    .filter(Boolean) as Array<Pick<Wallet, "label" | "address" | "addressType" | "accountId">>;
}

function readStatus(payload: unknown) {
  const object = payload as Record<string, unknown>;
  const data = object?.data as Record<string, unknown> | undefined;
  return {
    currentAccountId: String(data?.currentAccountId || ""),
    currentAccountName: String(data?.currentAccountName || "")
  };
}

function readAccountIds(payload: unknown) {
  const object = payload as Record<string, unknown>;
  const data = object?.data as Record<string, unknown> | undefined;
  const details = data?.details as Record<string, unknown> | undefined;
  return details ? Object.keys(details) : [];
}

function toHolding(asset: unknown, wallet: Wallet): Holding {
  const item = asset as Record<string, unknown>;
  const chainIndex = String(item.chainIndex || item.chain || "");
  const symbol = String(item.symbol || item.tokenSymbol || "UNKNOWN").trim() || "UNKNOWN";
  const tokenContractAddress = String(
    item.tokenContractAddress || item.tokenAddress || item.contractAddress || ""
  );
  const balance = safeNumber(item.balance ?? item.tokenBalance ?? item.amount);
  const tokenPrice = safeNumber(item.tokenPrice ?? item.price ?? item.usdPrice);
  const directValue = safeNumber(
    item.usdValue ?? item.valueUsd ?? item.value ?? item.tokenValue ?? item.balanceValue
  );
  const usdValue = directValue > 0 ? directValue : balance * tokenPrice;

  return {
    walletId: wallet.id,
    walletLabel: wallet.label,
    walletAddress: wallet.address,
    chainIndex,
    chainName: getChainName(chainIndex),
    symbol,
    iconUrl: readTokenIconUrl(item, symbol),
    tokenContractAddress,
    balance,
    rawBalance: String(item.rawBalance || ""),
    tokenPrice,
    usdValue,
    isRiskToken: Boolean(item.isRiskToken)
  };
}

function runOnchainos(args: string[]): Promise<unknown> {
  return new Promise((resolve, reject) => {
    execFile(
      "onchainos",
      args,
      {
        timeout: 120_000,
        maxBuffer: 10 * 1024 * 1024,
        env: process.env
      },
      (error, stdout, stderr) => {
        const combined = `${stdout || ""}\n${stderr || ""}`.trim();
        const parsed = extractJson(combined);
        if (error) {
          const message =
            (parsed as { error?: string } | null)?.error ||
            combined ||
            error.message ||
            "onchainos 查询失败";
          reject(new Error(message));
          return;
        }

        if (parsed && (parsed as { ok?: boolean }).ok === false) {
          reject(new Error(String((parsed as { error?: string }).error || "onchainos 查询失败")));
          return;
        }

        resolve(parsed);
      }
    );
  });
}

type OkxCredentials = {
  apiKey: string;
  secretKey: string;
  passphrase: string;
  projectId?: string;
};

function readOkxCredentials(): OkxCredentials | null {
  const apiKey = process.env.OKX_API_KEY || process.env.OKX_ACCESS_KEY || "";
  const secretKey = process.env.OKX_SECRET_KEY || process.env.OKX_API_SECRET || "";
  const passphrase =
    process.env.OKX_API_PASSPHRASE ||
    process.env.OKX_ACCESS_PASSPHRASE ||
    process.env.OKX_PASSPHRASE ||
    "";
  const projectId = process.env.OKX_PROJECT_ID || process.env.OKX_ACCESS_PROJECT || "";

  if (!apiKey || !secretKey || !passphrase) {
    return null;
  }

  return {
    apiKey,
    secretKey,
    passphrase,
    projectId: projectId || undefined
  };
}

function shouldUseOkxApi() {
  return Boolean(readOkxCredentials()) && (IS_VERCEL || process.env.ASSET_TRACKER_REFRESH_PROVIDER === "okx-api");
}

function okxChainId(chain: string) {
  const normalized = chain.trim().toLowerCase();
  return chainIds[normalized] || normalized;
}

function signOkxRequest(credentials: OkxCredentials, method: "GET" | "POST", requestPath: string, body = "") {
  const timestamp = new Date().toISOString();
  const prehash = `${timestamp}${method}${requestPath}${body}`;
  const signature = crypto.createHmac("sha256", credentials.secretKey).update(prehash).digest("base64");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "OK-ACCESS-KEY": credentials.apiKey,
    "OK-ACCESS-SIGN": signature,
    "OK-ACCESS-TIMESTAMP": timestamp,
    "OK-ACCESS-PASSPHRASE": credentials.passphrase
  };

  if (credentials.projectId) {
    headers["OK-ACCESS-PROJECT"] = credentials.projectId;
  }

  return headers;
}

async function queryOkxApi(wallet: Wallet, chains: string[], includeRisk: boolean) {
  const credentials = readOkxCredentials();
  if (!credentials) {
    throw new Error(
      "Vercel 刷新需要配置 OKX_API_KEY、OKX_SECRET_KEY、OKX_API_PASSPHRASE，可选 OKX_PROJECT_ID。"
    );
  }

  const params = new URLSearchParams({
    address: wallet.address,
    chains: chains.map(okxChainId).join(","),
    excludeRiskToken: includeRisk ? "1" : "0"
  });
  const requestPath = `${OKX_BALANCE_PATH}?${params.toString()}`;
  const response = await fetch(`${OKX_BASE_URL}${requestPath}`, {
    method: "GET",
    headers: signOkxRequest(credentials, "GET", requestPath)
  });
  const text = await response.text();
  const payload = extractJson(text) || { raw: text };

  if (!response.ok) {
    throw new Error(`OKX Balance API HTTP ${response.status}: ${text.slice(0, 500)}`);
  }

  const code = String((payload as { code?: unknown }).code || "0");
  if (code !== "0") {
    const message = String((payload as { msg?: unknown }).msg || "OKX Balance API 查询失败");
    throw new Error(`OKX Balance API 错误 ${code}: ${message}`);
  }

  return payload;
}

async function postOkxApi(pathname: string, body: unknown, operation: string) {
  const credentials = readOkxCredentials();
  if (!credentials) {
    throw new Error(
      "Vercel 刷新需要配置 OKX_API_KEY、OKX_SECRET_KEY、OKX_API_PASSPHRASE，可选 OKX_PROJECT_ID。"
    );
  }

  const bodyText = JSON.stringify(body);
  let lastError = `${operation}失败`;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    await paceOkxDefiRequest();
    const response = await fetch(`${OKX_BASE_URL}${pathname}`, {
      method: "POST",
      headers: signOkxRequest(credentials, "POST", pathname, bodyText),
      body: bodyText
    });
    const text = await response.text();
    const payload = extractJson(text) || { raw: text };
    const code = String((payload as { code?: unknown }).code || "0");

    if (response.ok && code === "0") {
      return payload;
    }

    const message = String((payload as { msg?: unknown }).msg || `${operation}失败`);
    lastError = response.ok
      ? `${operation}错误 ${code}: ${message}`
      : `${operation} HTTP ${response.status}: ${text.slice(0, 500)}`;
    if (!isRateLimitError(lastError) || attempt === 3) {
      throw new Error(lastError);
    }

    const retryAfterSeconds = Number(response.headers.get("retry-after"));
    const retryAfterMs = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
      ? retryAfterSeconds * 1000
      : 1200 * 2 ** attempt;
    await sleep(retryAfterMs);
  }

  throw new Error(lastError);
}

function defiWalletAddressList(wallet: Wallet, chains: string[]) {
  return chains.map((chain) => ({
    chainIndex: okxChainId(chain),
    walletAddress: wallet.address
  }));
}

function defiDetailTargets(protocols: ReturnType<typeof parseDefiOverview>["protocols"]) {
  const targets = new Map<string, { chainIndex: string; analysisPlatformId: string }>();
  for (const protocol of protocols) {
    for (const chain of protocol.chains) {
      if (!chain.chainIndex || Math.abs(chain.totalUsd) < MIN_DEFI_DETAIL_USD) continue;
      const key = `${protocol.protocolId}:${chain.chainIndex}`;
      targets.set(key, {
        chainIndex: chain.chainIndex,
        analysisPlatformId: protocol.protocolId
      });
    }
  }
  return Array.from(targets.values());
}

async function queryDefiOverview(wallet: Wallet, chains: string[]) {
  if (shouldUseOkxApi()) {
    return postOkxApi(
      OKX_DEFI_OVERVIEW_PATH,
      { walletAddressList: defiWalletAddressList(wallet, chains), tag: "asset_tracker" },
      "OKX DeFi 持仓概览"
    );
  }

  return runOnchainos([
    "defi",
    "positions",
    "--address",
    wallet.address,
    "--chains",
    chains.join(",")
  ]);
}

async function queryDefiDetails(
  wallet: Wallet,
  chains: string[],
  protocols: ReturnType<typeof parseDefiOverview>["protocols"]
) {
  const targets = defiDetailTargets(protocols);
  if (!targets.length) {
    return { payloads: [] as unknown[], errors: [] as string[] };
  }

  if (shouldUseOkxApi()) {
    try {
      return {
        payloads: [await postOkxApi(
          OKX_DEFI_DETAIL_PATH,
          {
            walletAddressList: defiWalletAddressList(wallet, chains),
            platformList: targets
          },
          "OKX DeFi 持仓明细"
        )],
        errors: [] as string[]
      };
    } catch (error) {
      return { payloads: [] as unknown[], errors: [simplifyError((error as Error).message)] };
    }
  }

  const results = await mapLimit(targets, 2, async (target) => {
    try {
      return {
        payload: await runOnchainos([
          "defi",
          "position-detail",
          "--address",
          wallet.address,
          "--chain",
          target.chainIndex,
          "--platform-id",
          target.analysisPlatformId
        ]),
        error: ""
      };
    } catch (error) {
      return { payload: null, error: simplifyError((error as Error).message) };
    }
  });

  return {
    payloads: results.flatMap((result) => result.payload ? [result.payload] : []),
    errors: results.map((result) => result.error).filter(Boolean)
  };
}

async function queryWalletDefi(wallet: Wallet, chains: string[]) {
  let overview = parseDefiOverview(await queryDefiOverview(wallet, chains));
  if (overview.assetStatus === 2 && !overview.protocols.length) {
    await sleep(800);
    overview = parseDefiOverview(await queryDefiOverview(wallet, chains));
  }

  const details = await queryDefiDetails(wallet, chains, overview.protocols);
  const positions = details.payloads.flatMap((payload) =>
    parseDefiPositionDetails(payload, wallet, overview.protocols)
  );
  const protocols = buildDefiProtocols(wallet, overview.protocols, positions);

  return {
    protocols,
    totalUsd: defiProtocolTotalUsd(protocols),
    positionCount: protocols.reduce((sum, protocol) => sum + protocol.positionCount, 0),
    status: details.errors.length ? "partial" as const : "ok" as const,
    error: details.errors.length ? `部分 DeFi 明细不可用：${details.errors.join("；")}` : undefined,
    updatedAt: overview.updatedAt
  };
}

function excludeDefiReceiptHoldings(holdings: Holding[], protocols: DefiProtocolPosition[]) {
  const receiptAddresses = defiReceiptTokenAddresses(protocols);
  if (!receiptAddresses.size) return holdings;
  return holdings.filter((holding) => !receiptAddresses.has(holding.tokenContractAddress.trim().toLowerCase()));
}

async function importOkxSolanaWallets(wallets: Wallet[]) {
  let originalAccountId = "";
  try {
    const status = readStatus(await runOnchainos(["wallet", "status"]));
    originalAccountId = status.currentAccountId;
    const accountIds = Array.from(
      new Set([
        ...readAccountIds(await runOnchainos(["wallet", "balance", "--all", "--force"])),
        originalAccountId
      ].filter(Boolean))
    );

    const okxSolanaAddresses: Array<Pick<Wallet, "label" | "address" | "addressType" | "accountId">> =
      [];

    for (const accountId of accountIds) {
      if (accountId !== originalAccountId) {
        await runOnchainos(["wallet", "switch", accountId]);
      }
      okxSolanaAddresses.push(...readOkxAddressItems(await runOnchainos(["wallet", "addresses"])));
    }

    if (originalAccountId) {
      await runOnchainos(["wallet", "switch", originalAccountId]);
    }

    const imported = okxSolanaAddresses
      .filter((item) => !wallets.some((wallet) => wallet.address === item.address))
      .map((item) => ({
        id: stableWalletId(item.address),
        label: item.label,
        address: item.address,
        addressType: item.addressType,
        source: "okx-agentic-wallet" as const,
        accountId: item.accountId,
        createdAt: new Date().toISOString()
      }));

    const okxByAddress = new Map(okxSolanaAddresses.map((item) => [item.address, item]));
    let metadataChanged = false;
    const updatedWallets = wallets.map((wallet) => {
      const okxItem = okxByAddress.get(wallet.address);
      if (!okxItem || wallet.addressType !== "solana") {
        return wallet;
      }
      if (wallet.source === "okx-agentic-wallet" && wallet.accountId === okxItem.accountId) {
        return wallet;
      }
      metadataChanged = true;
      return {
        ...wallet,
        source: "okx-agentic-wallet" as const,
        accountId: okxItem.accountId
      };
    });

    const nextWallets = [...updatedWallets, ...imported];
    if (!imported.length && !metadataChanged) {
      return wallets;
    }
    await writeWallets(nextWallets);
    return nextWallets;
  } catch {
    if (originalAccountId) {
      await runOnchainos(["wallet", "switch", originalAccountId]).catch(() => undefined);
    }
    return wallets;
  }
}

async function queryWallet(wallet: Wallet, options: RefreshOptions, generatedAt: string): Promise<WalletPortfolio> {
  const chains = compatibleChains(wallet, options.chains);
  if (!chains.length) {
    return {
      wallet,
      status: "skipped",
      totalUsd: 0,
      tokenCount: 0,
      holdings: [],
      defiTotalUsd: 0,
      defiPositionCount: 0,
      defiProtocols: [],
      defiStatus: "skipped",
      error:
        wallet.addressType === "solana"
          ? "未选择 Solana 链。"
          : "当前只选择了 Solana 链，EVM 地址已跳过。"
    };
  }

  let lastError = "";
  try {
    let payload: unknown = null;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        if (shouldUseOkxApi()) {
          payload = await queryOkxApi(wallet, chains, options.includeRisk);
        } else if (IS_VERCEL) {
          throw new Error(
            "Vercel 刷新需要配置 OKX_API_KEY、OKX_SECRET_KEY、OKX_API_PASSPHRASE，可选 OKX_PROJECT_ID。"
          );
        } else {
          payload = await runOnchainos([
            "portfolio",
            "all-balances",
            "--address",
            wallet.address,
            "--chains",
            chains.join(","),
            "--exclude-risk",
            options.includeRisk ? "1" : "0",
            "--filter",
            options.includeRisk ? "1" : "0"
          ]);
        }
        break;
      } catch (error) {
        lastError = simplifyError((error as Error).message);
        if (!isRateLimitError(lastError) || attempt === 3) {
          throw error;
        }
        await sleep(1500 * (attempt + 1));
      }
    }

    let holdings = readTokenAssets(payload)
      .map((asset) => toHolding(asset, wallet))
      .filter((holding) => holding.balance > 0 || holding.usdValue > 0)
      .sort((a, b) => b.usdValue - a.usdValue);

    let defiTotalUsd = 0;
    let defiPositionCount = 0;
    let defiProtocols: DefiProtocolPosition[] = [];
    let defiStatus: WalletPortfolio["defiStatus"] = options.includeDefi ? "ok" : "skipped";
    let defiError: string | undefined;

    if (options.includeDefi) {
      try {
        const defi = await queryWalletDefi(wallet, chains);
        defiTotalUsd = defi.totalUsd;
        defiPositionCount = defi.positionCount;
        defiProtocols = defi.protocols;
        defiStatus = defi.status;
        defiError = defi.error;
        holdings = excludeDefiReceiptHoldings(holdings, defiProtocols);
      } catch (error) {
        defiStatus = "error";
        defiError = simplifyError((error as Error).message);
      }
    }

    const tokenTotalUsd = holdings.reduce((sum, holding) => sum + holding.usdValue, 0);

    return {
      wallet,
      status: defiStatus === "error" ? "stale" : "ok",
      totalUsd: tokenTotalUsd + defiTotalUsd,
      tokenCount: holdings.length,
      holdings,
      defiTotalUsd,
      defiPositionCount,
      defiProtocols,
      defiStatus,
      defiError,
      staleReason: defiStatus === "error" ? `DeFi 持仓未刷新：${defiError}` : undefined,
      updatedAt: generatedAt
    };
  } catch (error) {
    return {
      wallet,
      status: "error",
      totalUsd: 0,
      tokenCount: 0,
      holdings: [],
      defiTotalUsd: 0,
      defiPositionCount: 0,
      defiProtocols: [],
      defiStatus: options.includeDefi ? "error" : "skipped",
      error: simplifyError(lastError || (error as Error).message)
    };
  }
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
) {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

function aggregateByToken(portfolios: WalletPortfolio[]) {
  const groups = new Map<
    string,
    {
      symbol: string;
      totalUsd: number;
      totalBalance: number;
      walletKeys: Set<string>;
      holdingCount: number;
      chains: Map<string, { chainName: string; totalUsd: number; totalBalance: number }>;
      contracts: Set<string>;
      riskCount: number;
      iconUrl?: string;
    }
  >();

  for (const portfolio of portfolios) {
    const walletKey = walletGroupKey(portfolio.wallet);
    for (const holding of portfolio.holdings) {
      const key = tokenAggregationKey(holding);
      const group =
        groups.get(key) ||
        {
          symbol: holding.symbol,
          totalUsd: 0,
          totalBalance: 0,
          walletKeys: new Set<string>(),
          holdingCount: 0,
          chains: new Map<string, { chainName: string; totalUsd: number; totalBalance: number }>(),
          contracts: new Set<string>(),
          riskCount: 0,
          iconUrl: holding.iconUrl || fallbackTokenIconUrl(holding.symbol)
        };

      group.totalUsd += holding.usdValue;
      group.totalBalance += holding.balance;
      group.iconUrl ||= holding.iconUrl || fallbackTokenIconUrl(holding.symbol);
      group.walletKeys.add(walletKey);
      group.holdingCount += 1;
      group.contracts.add(holding.tokenContractAddress || "(native)");
      if (holding.isRiskToken) {
        group.riskCount += 1;
      }

      const chainKey = holding.chainIndex || holding.chainName;
      const chain =
        group.chains.get(chainKey) ||
        {
          chainName: holding.chainName,
          totalUsd: 0,
          totalBalance: 0
        };
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

function latestUpdatedAt(portfolios: WalletPortfolio[]) {
  const dates = portfolios
    .map((portfolio) => portfolio.updatedAt)
    .filter((date): date is string => Boolean(date))
    .sort();
  return dates.length ? dates[dates.length - 1] : undefined;
}

function combinedPortfolioState(portfolios: WalletPortfolio[]) {
  const errors = portfolios.filter((portfolio) => portfolio.status === "error");
  const stale = portfolios.filter((portfolio) => portfolio.status === "stale");
  const skipped = portfolios.filter((portfolio) => portfolio.status === "skipped");
  const active = portfolios.filter((portfolio) => portfolio.status === "ok" || portfolio.status === "stale");
  const messages = [...errors, ...stale]
    .map((portfolio) => `${portfolio.wallet.label}: ${portfolio.error || portfolio.staleReason}`)
    .filter(Boolean);

  if (skipped.length === portfolios.length) {
    return {
      status: "skipped" as const,
      error: skipped.map((portfolio) => portfolio.error).filter(Boolean).join("；")
    };
  }

  if (errors.length && !active.length) {
    return {
      status: "error" as const,
      error: messages.join("；") || errors[0]?.error
    };
  }

  if (errors.length || stale.length) {
    return {
      status: "stale" as const,
      staleReason: `部分地址未刷新：${messages.join("；")}`,
      updatedAt: latestUpdatedAt(portfolios)
    };
  }

  return {
    status: "ok" as const,
    updatedAt: latestUpdatedAt(portfolios)
  };
}

function combinedDefiState(portfolios: WalletPortfolio[]) {
  const statuses = portfolios.map((portfolio) => portfolio.defiStatus);
  const errors = portfolios.map((portfolio) => portfolio.defiError).filter(Boolean);
  if (statuses.every((status) => status === "skipped")) {
    return { status: "skipped" as const, error: undefined };
  }
  if (statuses.some((status) => status === "error" || status === "stale")) {
    return { status: "stale" as const, error: errors.join("；") || undefined };
  }
  if (statuses.some((status) => status === "partial")) {
    return { status: "partial" as const, error: errors.join("；") || undefined };
  }
  return { status: "ok" as const, error: undefined };
}

function aggregateByWallet(portfolios: WalletPortfolio[]) {
  const groups = new Map<string, WalletPortfolio[]>();
  for (const portfolio of portfolios) {
    const groupKey = walletGroupKey(portfolio.wallet);
    groups.set(groupKey, [...(groups.get(groupKey) || []), portfolio]);
  }

  return Array.from(groups.entries())
    .map(([groupKey, groupPortfolios], index) => {
      const wallets = groupPortfolios
        .map((portfolio) => portfolio.wallet)
        .sort((a, b) => walletTypeRank(a) - walletTypeRank(b));
      const primaryWallet = wallets.find((wallet) => wallet.addressType === "evm") || wallets[0];
      const groupLabel = wallets.find((wallet) => wallet.groupLabel)?.groupLabel || walletGroupLabel(primaryWallet);
      const wallet = {
        ...primaryWallet,
        label: groupLabel,
        groupId: groupKey,
        groupLabel
      };
      const holdings = groupPortfolios.flatMap((portfolio) => portfolio.holdings);
      const defiProtocols = groupPortfolios.flatMap((portfolio) => portfolio.defiProtocols || []);
      const defiState = combinedDefiState(groupPortfolios);
      const symbolGroups = new Map<string, { symbol: string; iconUrl?: string; totalUsd: number; totalBalance: number }>();
      for (const holding of holdings) {
        const key = tokenAggregationKey(holding);
        const group = symbolGroups.get(key) || {
          symbol: holding.symbol,
          iconUrl: holding.iconUrl || fallbackTokenIconUrl(holding.symbol),
          totalUsd: 0,
          totalBalance: 0
        };
        group.iconUrl ||= holding.iconUrl || fallbackTokenIconUrl(holding.symbol);
        group.totalUsd += holding.usdValue;
        group.totalBalance += holding.balance;
        symbolGroups.set(key, group);
      }
      const combinedState = combinedPortfolioState(groupPortfolios);

      return {
        __sortIndex: index,
        __sortRank: walletSequenceRank(
          [groupLabel, groupKey, ...wallets.flatMap((item) => [item.groupLabel, item.label, item.groupId, item.id])],
          index
        ),
        wallet,
        wallets,
        addressTypes: Array.from(new Set(wallets.map((item) => item.addressType))),
        status: combinedState.status,
        error: combinedState.error,
        staleReason: combinedState.staleReason,
        updatedAt: combinedState.updatedAt,
        totalUsd: groupPortfolios.reduce((sum, portfolio) => sum + portfolio.totalUsd, 0),
        tokenCount: holdings.length,
        defiTotalUsd: groupPortfolios.reduce((sum, portfolio) => sum + portfolio.defiTotalUsd, 0),
        defiPositionCount: groupPortfolios.reduce((sum, portfolio) => sum + portfolio.defiPositionCount, 0),
        defiProtocols,
        defiStatus: defiState.status,
        defiError: defiState.error,
        topTokens: Array.from(symbolGroups.values())
          .sort((a, b) => b.totalUsd - a.totalUsd)
          .slice(0, 6),
        holdings
      };
    })
    .sort(
      (a, b) =>
        a.__sortRank - b.__sortRank ||
        walletGroupLabel(a.wallet).localeCompare(walletGroupLabel(b.wallet), "zh-CN", { numeric: true }) ||
        a.__sortIndex - b.__sortIndex
    )
    .map(({ __sortIndex, __sortRank, ...summary }) => summary);
}

function simplifyError(error: string) {
  if (/not logged in|Session expired|Invalid Authority/i.test(error)) {
    return "OKX Onchain OS 登录已过期，请先运行 onchainos wallet login。";
  }
  if (/region|50125|80001/i.test(error)) {
    return "服务当前区域不可用，请切换到支持区域后重试。";
  }
  return error;
}

function hasLoginError(portfolios: WalletPortfolio[]) {
  return portfolios.some((portfolio) =>
    /wallet login|登录已过期/i.test(`${portfolio.error || ""} ${portfolio.defiError || ""}`)
  );
}

async function readPreviousSnapshot(): Promise<Snapshot | null> {
  if (volatileSnapshot) {
    return volatileSnapshot;
  }

  const blobSnapshot = await readBlobJson<Snapshot>(snapshotBlobPath);
  if (blobSnapshot) {
    volatileSnapshot = blobSnapshot;
    return blobSnapshot;
  }

  try {
    const raw = await fs.readFile(snapshotPath, "utf8");
    return JSON.parse(raw) as Snapshot;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

function normalizeSnapshotForWallets(snapshot: Snapshot | null, wallets: Wallet[]) {
  if (!snapshot) {
    return null;
  }

  const walletsByAddress = new Map(wallets.map((wallet) => [wallet.address, wallet]));
  const portfolios: WalletPortfolio[] = [];

  for (const summary of snapshot.walletSummary || []) {
    const members = summary.wallets?.length ? summary.wallets : [summary.wallet];
    for (const member of members) {
      const wallet = walletsByAddress.get(member.address);
      if (!wallet) {
        continue;
      }
      const holdings = (summary.holdings || []).filter((holding) => holding.walletAddress === member.address);
      const defiProtocols = (summary.defiProtocols || []).filter(
        (protocol) => protocol.walletAddress === member.address
      );
      const defiTotalUsd = defiProtocolTotalUsd(defiProtocols);
      portfolios.push({
        wallet,
        status: summary.status,
        totalUsd: holdings.reduce((sum, holding) => sum + holding.usdValue, 0) + defiTotalUsd,
        tokenCount: holdings.length,
        holdings,
        defiTotalUsd,
        defiPositionCount: defiProtocols.reduce((sum, protocol) => sum + protocol.positionCount, 0),
        defiProtocols,
        defiStatus: summary.defiStatus || (snapshot.includeDefi === false ? "skipped" : "ok"),
        defiError: summary.defiError,
        updatedAt: summary.updatedAt || snapshot.generatedAt,
        staleReason: summary.staleReason,
        error: summary.error
      });
    }
  }

  const tokenSummary = aggregateByToken(portfolios);
  const defiTotalUsd = portfolios.reduce((sum, portfolio) => sum + portfolio.defiTotalUsd, 0);
  const defiProtocols = portfolios.flatMap((portfolio) => portfolio.defiProtocols);
  const defiStableAssets = defiStableAssetBreakdown(defiProtocols);
  return {
    ...snapshot,
    includeDefi: snapshot.includeDefi !== false,
    walletCount: countWalletGroups(wallets),
    totalUsd: portfolios.reduce((sum, portfolio) => sum + portfolio.totalUsd, 0),
    defiTotalUsd,
    defiProtocolCount: new Set(defiProtocols.map((protocol) => protocol.protocolId)).size,
    defiPositionCount: defiProtocols.reduce((sum, protocol) => sum + protocol.positionCount, 0),
    ...calculateConservativeEstimate(tokenSummary, {
      totalUsd: defiTotalUsd,
      ...defiStableAssets
    }),
    tokenSummary,
    walletSummary: aggregateByWallet(portfolios)
  };
}

async function writeSnapshot(snapshot: Snapshot) {
  volatileSnapshot = snapshot;
  if (blobStorageEnabled()) {
    await writeBlobJson(snapshotBlobPath, snapshot);
    return;
  }

  try {
    await fs.writeFile(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  } catch (error) {
    if (IS_VERCEL || isReadOnlyFsError(error)) {
      return;
    }
    throw error;
  }
}

function snapshotHistoryPoint(snapshot: Snapshot): SnapshotHistoryPoint {
  const summaries = snapshot.walletSummary || [];
  return {
    generatedAt: snapshot.generatedAt,
    walletCount: snapshot.walletCount,
    totalUsd: snapshot.totalUsd,
    stableAssetUsd: snapshot.stableAssetUsd ?? snapshot.stablecoinUsd,
    stablecoinUsd: snapshot.stablecoinUsd,
    volatileAssetUsd: snapshot.volatileAssetUsd,
    conservativeTotalUsd: snapshot.conservativeTotalUsd,
    defiTotalUsd: snapshot.defiTotalUsd || 0,
    okCount: summaries.filter((summary) => summary.status === "ok").length,
    staleCount: summaries.filter((summary) => summary.status === "stale").length,
    errorCount: summaries.filter((summary) => summary.status === "error").length,
    skippedCount: summaries.filter((summary) => summary.status === "skipped").length
  };
}

function normalizeSnapshotHistory(input: unknown): SnapshotHistoryPoint[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object") {
      return [];
    }
    const point = candidate as Partial<SnapshotHistoryPoint>;
    if (!point.generatedAt || !Number.isFinite(Date.parse(point.generatedAt))) {
      return [];
    }
    const numeric = (value: unknown) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };
    return [{
      generatedAt: point.generatedAt,
      walletCount: numeric(point.walletCount),
      totalUsd: numeric(point.totalUsd),
      stableAssetUsd: numeric(point.stableAssetUsd ?? point.stablecoinUsd),
      stablecoinUsd: numeric(point.stablecoinUsd),
      volatileAssetUsd: numeric(point.volatileAssetUsd),
      conservativeTotalUsd: numeric(point.conservativeTotalUsd),
      defiTotalUsd: numeric(point.defiTotalUsd),
      okCount: numeric(point.okCount),
      staleCount: numeric(point.staleCount),
      errorCount: numeric(point.errorCount),
      skippedCount: numeric(point.skippedCount)
    } satisfies SnapshotHistoryPoint];
  }).sort((left, right) => Date.parse(left.generatedAt) - Date.parse(right.generatedAt)).slice(-30);
}

async function readSnapshotHistory() {
  const blobHistory = await readBlobJson<SnapshotHistoryPoint[]>(snapshotHistoryBlobPath);
  if (blobHistory) {
    return normalizeSnapshotHistory(blobHistory);
  }

  try {
    return normalizeSnapshotHistory(JSON.parse(await fs.readFile(snapshotHistoryPath, "utf8")));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function writeSnapshotHistory(history: SnapshotHistoryPoint[]) {
  if (blobStorageEnabled()) {
    await writeBlobJson(snapshotHistoryBlobPath, history);
    return;
  }

  try {
    await ensureDataDir();
    await fs.writeFile(snapshotHistoryPath, `${JSON.stringify(history, null, 2)}\n`, "utf8");
  } catch (error) {
    if (IS_VERCEL || isReadOnlyFsError(error)) {
      return;
    }
    throw error;
  }
}

async function appendSnapshotHistory(snapshot: Snapshot, previousSnapshot: Snapshot | null) {
  const history = await readSnapshotHistory();
  const seededHistory = history.length || !previousSnapshot
    ? history
    : [snapshotHistoryPoint(previousSnapshot)];
  const nextPoint = snapshotHistoryPoint(snapshot);
  const nextHistory = normalizeSnapshotHistory([
    ...seededHistory.filter((point) => point.generatedAt !== nextPoint.generatedAt),
    nextPoint
  ]);
  await writeSnapshotHistory(nextHistory);
}

function canReusePreviousSnapshot(previous: Snapshot | null, options: RefreshOptions, wallet: Wallet) {
  if (!previous || previous.includeRisk !== options.includeRisk) {
    return false;
  }

  const previousChains = new Set(previous.chains.map((chain) => chain.toLowerCase()));
  return compatibleChains(wallet, options.chains).every((chain) => previousChains.has(chain.toLowerCase()));
}

function previousWalletPortfolio(previous: Snapshot | null, wallet: Wallet) {
  const summary = previous?.walletSummary.find(
    (item) => item.wallet.address === wallet.address || item.wallets?.some((candidate) => candidate.address === wallet.address)
  );
  if (!summary) {
    return undefined;
  }

  const holdings = summary.holdings.filter((holding) => holding.walletAddress === wallet.address);
  const defiProtocols = (summary.defiProtocols || []).filter(
    (protocol) => protocol.walletAddress === wallet.address
  );
  const defiTotalUsd = defiProtocolTotalUsd(defiProtocols);
  return {
    ...summary,
    wallet,
    holdings,
    totalUsd: holdings.reduce((sum, holding) => sum + holding.usdValue, 0) + defiTotalUsd,
    tokenCount: holdings.length,
    defiProtocols,
    defiTotalUsd,
    defiPositionCount: defiProtocols.reduce((sum, protocol) => sum + protocol.positionCount, 0),
    defiStatus: summary.defiStatus || (previous?.includeDefi === false ? "skipped" : "ok")
  };
}

function withStaleFallback(
  portfolio: WalletPortfolio,
  previous: Snapshot | null,
  options: RefreshOptions
): WalletPortfolio {
  if (!canReusePreviousSnapshot(previous, options, portfolio.wallet)) {
    return portfolio;
  }

  const previousPortfolio = previousWalletPortfolio(previous, portfolio.wallet);
  if (!previousPortfolio) {
    return portfolio;
  }

  if (portfolio.defiStatus === "error" && options.includeDefi && previousPortfolio.defiProtocols.length) {
    return {
      ...portfolio,
      status: "stale",
      totalUsd: portfolio.totalUsd + previousPortfolio.defiTotalUsd,
      defiTotalUsd: previousPortfolio.defiTotalUsd,
      defiPositionCount: previousPortfolio.defiPositionCount,
      defiProtocols: previousPortfolio.defiProtocols,
      defiStatus: "stale",
      updatedAt: portfolio.updatedAt || previousPortfolio.updatedAt || previous?.generatedAt,
      staleReason: portfolio.staleReason || portfolio.defiError
    };
  }

  if (portfolio.status !== "error" || !previousPortfolio.holdings.length && !previousPortfolio.defiProtocols.length) {
    return portfolio;
  }

  return {
    ...portfolio,
    status: "stale",
    totalUsd: previousPortfolio.totalUsd,
    tokenCount: previousPortfolio.tokenCount,
    holdings: previousPortfolio.holdings,
    defiTotalUsd: previousPortfolio.defiTotalUsd,
    defiPositionCount: previousPortfolio.defiPositionCount,
    defiProtocols: previousPortfolio.defiProtocols,
    defiStatus: previousPortfolio.defiStatus === "skipped" ? "skipped" : "stale",
    defiError: previousPortfolio.defiError,
    updatedAt: previousPortfolio.updatedAt || previous?.generatedAt,
    staleReason: portfolio.error
  };
}

async function buildSnapshot(options: RefreshOptions) {
  if (IS_VERCEL && !readOkxCredentials()) {
    throw new HttpError(
      503,
      "Vercel 刷新需要配置 OKX_API_KEY、OKX_SECRET_KEY、OKX_API_PASSPHRASE，可选 OKX_PROJECT_ID。"
    );
  }

  let wallets = options.wallets ? options.wallets : (await readPortfolioState()).wallets;
  if (
    !options.wallets &&
    !IS_VERCEL &&
    !shouldUseOkxApi() &&
    options.chains.some((chain) => SOLANA_CHAINS.has(chain.toLowerCase()))
  ) {
    wallets = await importOkxSolanaWallets(wallets);
  }

  const previousSnapshot = normalizeSnapshotForWallets(await readPreviousSnapshot(), wallets);
  const generatedAt = new Date().toISOString();
  const queriedPortfolios = await mapLimit(wallets, 2, (wallet) => queryWallet(wallet, options, generatedAt));
  const portfolios = queriedPortfolios.map((portfolio) =>
    withStaleFallback(portfolio, previousSnapshot, options)
  );
  await enrichPortfolioIcons(portfolios);
  const tokenSummary = aggregateByToken(portfolios);
  const defiTotalUsd = portfolios.reduce((sum, portfolio) => sum + portfolio.defiTotalUsd, 0);
  const defiProtocols = portfolios.flatMap((portfolio) => portfolio.defiProtocols);
  const defiStableAssets = defiStableAssetBreakdown(defiProtocols);
  const snapshot: Snapshot = {
    generatedAt,
    refreshRequestId: options.refreshRequestId,
    chains: options.chains,
    includeRisk: options.includeRisk,
    includeDefi: options.includeDefi,
    walletCount: countWalletGroups(wallets),
    totalUsd: portfolios.reduce((sum, portfolio) => sum + portfolio.totalUsd, 0),
    defiTotalUsd,
    defiProtocolCount: new Set(defiProtocols.map((protocol) => protocol.protocolId)).size,
    defiPositionCount: defiProtocols.reduce((sum, protocol) => sum + protocol.positionCount, 0),
    ...calculateConservativeEstimate(tokenSummary, {
      totalUsd: defiTotalUsd,
      ...defiStableAssets
    }),
    needsLogin: hasLoginError(portfolios),
    loginCommand: "onchainos wallet login",
    tokenSummary,
    walletSummary: aggregateByWallet(portfolios),
    errors: portfolios
      .filter((portfolio) => portfolio.status === "error")
      .map((portfolio) => ({
        wallet: portfolio.wallet,
        error: portfolio.error
      })),
    stale: portfolios
      .filter((portfolio) => portfolio.status === "stale")
      .map((portfolio) => ({
        wallet: portfolio.wallet,
        error: portfolio.staleReason,
        updatedAt: portfolio.updatedAt
      })),
    skipped: portfolios
      .filter((portfolio) => portfolio.status === "skipped")
      .map((portfolio) => ({
        wallet: portfolio.wallet,
        reason: portfolio.error
      })),
    defiErrors: portfolios
      .filter((portfolio) => portfolio.defiStatus === "error" || portfolio.defiStatus === "partial")
      .map((portfolio) => ({
        wallet: portfolio.wallet,
        error: portfolio.defiError
      }))
  };

  await writeSnapshot(snapshot);
  await appendSnapshotHistory(snapshot, previousSnapshot);
  return snapshot;
}

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function handleError(error: unknown, response: express.Response) {
  const next = error as Partial<HttpError>;
  response.status(next.status || 500).json({
    error: next.message || "服务器错误"
  });
}

app.get("/api/config", (_request, response) => {
  response.json({
    authRequired: Boolean(ACCESS_TOKEN),
    defaultChains: DEFAULT_CHAINS,
    availableChains: [
      "ethereum",
      "solana",
      "base",
      "robinhood",
      "bsc",
      "arbitrum",
      "polygon",
      "optimism",
      "avalanche",
      "xlayer",
      "linea",
      "scroll",
      "zksync",
      "fantom"
    ]
  });
});

app.get("/api/state", async (_request, response) => {
  try {
    response.json({
      state: await readPortfolioState(),
      persistence: blobStorageEnabled() ? "vercel-blob" : "local-file"
    });
  } catch (error) {
    handleError(error, response);
  }
});

app.put("/api/state", async (request, response) => {
  try {
    const currentState = await readPortfolioState();
    const nextState = normalizePortfolioState(
      {
        ...request.body,
        updatedAt: new Date().toISOString()
      },
      currentState.wallets
    );
    await writePortfolioState(nextState);
    response.json({
      state: nextState,
      persistence: blobStorageEnabled() ? "vercel-blob" : "local-file"
    });
  } catch (error) {
    handleError(error, response);
  }
});

app.get("/api/wallets", async (_request, response) => {
  try {
    response.json({ wallets: await readWallets() });
  } catch (error) {
    handleError(error, response);
  }
});

app.post("/api/wallets", async (request, response) => {
  try {
    const address = normalizeAddress(String(request.body?.address || ""));
    const label = String(request.body?.label || "").trim();
    const addressType = getAddressType(address);

    const wallets = await readWallets();
    if (wallets.some((wallet) => wallet.address === address)) {
      throw new HttpError(409, "这个地址已经在列表里。");
    }

    const wallet: Wallet = {
      id: stableWalletId(address),
      label: label || `钱包 ${wallets.length + 1}`,
      address,
      addressType,
      createdAt: new Date().toISOString()
    };

    const nextWallets = [...wallets, wallet];
    await writeWallets(nextWallets);
    response.status(201).json({ wallet, wallets: nextWallets });
  } catch (error) {
    handleError(error, response);
  }
});

app.patch("/api/wallets/:address", async (request, response) => {
  try {
    const address = normalizeAddress(request.params.address);
    const label = String(request.body?.label || "").trim();
    if (!label) {
      throw new HttpError(400, "标签不能为空。");
    }

    const wallets = await readWallets();
    const nextWallets = wallets.map((wallet) =>
      wallet.address === address ? { ...wallet, label } : wallet
    );
    await writeWallets(nextWallets);
    response.json({ wallets: nextWallets });
  } catch (error) {
    handleError(error, response);
  }
});

app.delete("/api/wallets/:address", async (request, response) => {
  try {
    const address = normalizeAddress(request.params.address);
    const wallets = await readWallets();
    const nextWallets = wallets.filter((wallet) => wallet.address !== address);
    await writeWallets(nextWallets);
    response.json({ wallets: nextWallets });
  } catch (error) {
    handleError(error, response);
  }
});

app.get("/api/snapshot", async (_request, response) => {
  try {
    const wallets = (await readPortfolioState()).wallets;
    response.json(normalizeSnapshotForWallets(await readPreviousSnapshot(), wallets));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      response.json(null);
      return;
    }
    handleError(error, response);
  }
});

app.get("/api/history", async (_request, response) => {
  try {
    const history = await readSnapshotHistory();
    if (history.length) {
      response.json(history);
      return;
    }
    const snapshot = await readPreviousSnapshot();
    response.json(snapshot ? [snapshotHistoryPoint(snapshot)] : []);
  } catch (error) {
    handleError(error, response);
  }
});

app.post("/api/refresh", async (request, response) => {
  try {
    const requestedChains = Array.isArray(request.body?.chains) ? request.body.chains : DEFAULT_CHAINS;
    const chains = requestedChains.map((chain: unknown) => String(chain).trim()).filter(Boolean);
    if (!chains.length) {
      throw new HttpError(400, "至少选择一条链。");
    }

    const snapshot = await buildSnapshot({
      chains,
      includeRisk: Boolean(request.body?.includeRisk),
      includeDefi: request.body?.includeDefi !== false,
      refreshRequestId: String(request.body?.refreshRequestId || "").trim().slice(0, 128) || undefined,
      wallets: normalizeRequestWallets(request.body?.wallets)
    });
    response.json(snapshot);
  } catch (error) {
    handleError(error, response);
  }
});

const distDir = path.join(rootDir, "dist");
if (process.env.NODE_ENV === "production" && !IS_VERCEL) {
  app.use(express.static(distDir));
  app.get("*", (_request, response) => {
    response.sendFile(path.join(distDir, "index.html"));
  });
}

if (!IS_VERCEL) {
  app.listen(PORT, "127.0.0.1", () => {
    console.log(`Asset tracker API listening on http://127.0.0.1:${PORT}`);
  });
}

export default app;
