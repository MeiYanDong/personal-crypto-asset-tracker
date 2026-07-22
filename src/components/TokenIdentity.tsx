import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactEventHandler
} from "react";
import { HoldingItem, HoldingList, type HoldingListProps } from "./ui/Holding";
import { formatQuantity, QuantityValue } from "./ui/QuantityValue";
import { cx } from "./ui/utils";

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

export function canonicalTokenSymbol(symbol: string) {
  return symbol.trim().toUpperCase().replace(/₮/g, "T");
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

export function generatedTokenIconUrl(symbol: string) {
  const hue = tokenIconHash(symbol) % 360;
  const label = escapeSvgText(tokenIconLabel(symbol));
  const fontSize = label.length > 1 ? 24 : 28;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="29" fill="hsl(${hue},56%,42%)"/><circle cx="32" cy="32" r="27" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="1.5"/><text x="32" y="32" dy=".35em" text-anchor="middle" font-family="system-ui,sans-serif" font-size="${fontSize}" font-weight="750" fill="#fff">${label}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function isGeneratedTokenIconUrl(iconUrl?: string) {
  return Boolean(iconUrl?.startsWith("data:image/svg+xml"));
}

export function knownTokenIconUrl(symbol: string) {
  const key = canonicalTokenSymbol(symbol);
  const direct = directTokenIconUrls[key];
  if (direct) {
    return direct;
  }

  const slug = tokenIconSlugs[key];
  return slug ? `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/${slug}.svg` : undefined;
}

export function fallbackTokenIconUrl(symbol: string) {
  return knownTokenIconUrl(symbol) || generatedTokenIconUrl(symbol);
}

export function tokenIconUrl(symbol: string, iconUrl?: string) {
  if (!iconUrl || isGeneratedTokenIconUrl(iconUrl)) {
    return fallbackTokenIconUrl(symbol);
  }
  return iconUrl;
}

export type TokenIconSize = "sm" | "md";

export type TokenIconProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  iconUrl?: string;
  onImageError?: ReactEventHandler<HTMLImageElement>;
  onImageLoad?: ReactEventHandler<HTMLImageElement>;
  size?: TokenIconSize;
  symbol: string;
};

export const TokenIcon = forwardRef<HTMLSpanElement, TokenIconProps>(function TokenIcon({
  className,
  iconUrl,
  onImageError,
  onImageLoad,
  size = "md",
  symbol,
  ...props
}, ref) {
  const [failed, setFailed] = useState(false);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fallbackSrc = generatedTokenIconUrl(symbol);
  const primarySrc = tokenIconUrl(symbol, iconUrl);
  const src = failed ? fallbackSrc : primarySrc;
  const source = isGeneratedTokenIconUrl(src) ? "generated" : "remote";
  const state = source === "generated" ? "fallback" : loadedSrc === src ? "ready" : "loading";

  useEffect(() => {
    setFailed(false);
    setLoadedSrc(null);
  }, [iconUrl, symbol]);

  useEffect(() => {
    const image = imageRef.current;
    if (source === "remote" && image?.complete && image.naturalWidth > 0) {
      setLoadedSrc(src);
    }
  }, [source, src]);

  return (
    <span
      {...props}
      ref={ref}
      aria-hidden="true"
      className={cx("token-icon", className)}
      data-size={size}
      data-fallback-label={tokenIconLabel(symbol)}
      data-slot="token-icon"
      data-source={source}
      data-state={state}
      data-symbol={canonicalTokenSymbol(symbol)}
    >
      <img
        ref={imageRef}
        alt=""
        data-slot="token-icon-image"
        decoding="async"
        draggable="false"
        height="64"
        src={src}
        width="64"
        onLoad={(event) => {
          if (event.currentTarget.naturalWidth > 0) {
            setLoadedSrc(src);
          }
          onImageLoad?.(event);
        }}
        onError={(event) => {
          if (src !== fallbackSrc) {
            setFailed(true);
            setLoadedSrc(null);
          }
          onImageError?.(event);
        }}
      />
    </span>
  );
});

export type TokenHoldingSummary = {
  iconUrl?: string;
  id?: string;
  symbol: string;
  totalBalance: number;
  totalUsd: number;
};

export type TokenHoldingListProps = Omit<HoldingListProps, "children"> & {
  showBalance?: boolean;
  tokens: TokenHoldingSummary[];
};

function currency(value: number) {
  const safeValue = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: safeValue >= 1000 ? 0 : 2
  }).format(safeValue);
}

export const TokenHoldingList = forwardRef<HTMLUListElement, TokenHoldingListProps>(
  function TokenHoldingList({
    "aria-label": ariaLabel = "主要持仓",
    className,
    showBalance = false,
    tokens,
    ...props
  }, ref) {
    return (
      <HoldingList
        {...props}
        ref={ref}
        aria-label={ariaLabel}
        className={cx("token-holding-list", className)}
        data-component="token-holding-list"
        data-token-count={tokens.length}
      >
        {tokens.map((token, index) => {
          const balance = formatQuantity(token.totalBalance);
          const marketValue = currency(token.totalUsd);
          return (
            <HoldingItem
              balance={showBalance ? (
                <QuantityValue aria-label={`${token.symbol} 数量`} value={token.totalBalance} />
              ) : undefined}
              data-symbol={canonicalTokenSymbol(token.symbol)}
              icon={<TokenIcon iconUrl={token.iconUrl} size="sm" symbol={token.symbol} />}
              key={token.id || `${canonicalTokenSymbol(token.symbol)}:${token.iconUrl || "fallback"}:${index}`}
              marketValue={marketValue}
              symbol={token.symbol}
              title={`${token.symbol}${showBalance ? ` · ${balance}` : ""} · ${marketValue}`}
            />
          );
        })}
      </HoldingList>
    );
  }
);
