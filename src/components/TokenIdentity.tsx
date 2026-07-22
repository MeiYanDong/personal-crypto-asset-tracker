import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactEventHandler
} from "react";
import aidogIconUrl from "../assets/token-icons/aidog.png";
import arbIconUrl from "../assets/token-icons/arb.jpg";
import aubraiIconUrl from "../assets/token-icons/aubrai.png";
import avaxIconUrl from "../assets/token-icons/avax.svg";
import bnbIconUrl from "../assets/token-icons/bnb.svg";
import btcIconUrl from "../assets/token-icons/btc.svg";
import ethIconUrl from "../assets/token-icons/eth.svg";
import flockIconUrl from "../assets/token-icons/flock.png";
import maticIconUrl from "../assets/token-icons/matic.svg";
import okbIconUrl from "../assets/token-icons/okb.png";
import opIconUrl from "../assets/token-icons/op.png";
import pepeIconUrl from "../assets/token-icons/pepe.jpg";
import polIconUrl from "../assets/token-icons/pol.png";
import solIconUrl from "../assets/token-icons/sol.svg";
import swarmsIconUrl from "../assets/token-icons/swarms.jpg";
import usdcIconUrl from "../assets/token-icons/usdc.svg";
import usdtIconUrl from "../assets/token-icons/usdt.svg";
import usdt0IconUrl from "../assets/token-icons/usdt0.jpg";
import virtualIconUrl from "../assets/token-icons/virtual.png";
import { HoldingItem, HoldingList, type HoldingListProps } from "./ui/Holding";
import { CurrencyValue, formatCurrency } from "./ui/CurrencyValue";
import { formatQuantity, QuantityValue } from "./ui/QuantityValue";
import { cx } from "./ui/utils";

const bundledTokenIconUrls: Record<string, string> = {
  AIDOG: aidogIconUrl,
  ARB: arbIconUrl,
  AUBRAI: aubraiIconUrl,
  AVAX: avaxIconUrl,
  BNB: bnbIconUrl,
  BTC: btcIconUrl,
  BTCB: btcIconUrl,
  ETH: ethIconUrl,
  FLOCK: flockIconUrl,
  MATIC: maticIconUrl,
  OKB: okbIconUrl,
  OP: opIconUrl,
  PEPE: pepeIconUrl,
  POL: polIconUrl,
  SOL: solIconUrl,
  SWARMS: swarmsIconUrl,
  USDC: usdcIconUrl,
  USDT: usdtIconUrl,
  USDT0: usdt0IconUrl,
  VIRTUAL: virtualIconUrl,
  WAVAX: avaxIconUrl,
  WBNB: bnbIconUrl,
  WBTC: btcIconUrl,
  WETH: ethIconUrl
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
  return bundledTokenIconUrls[canonicalTokenSymbol(symbol)];
}

export function fallbackTokenIconUrl(symbol: string) {
  return knownTokenIconUrl(symbol) || generatedTokenIconUrl(symbol);
}

export function tokenIconUrl(symbol: string, iconUrl?: string) {
  const bundledUrl = knownTokenIconUrl(symbol);
  if (bundledUrl) {
    return bundledUrl;
  }
  if (!iconUrl || isGeneratedTokenIconUrl(iconUrl)) {
    return generatedTokenIconUrl(symbol);
  }
  return iconUrl;
}

type TokenIconSource = "bundled" | "generated" | "remote";

function resolveTokenIcon(symbol: string, iconUrl?: string): { source: TokenIconSource; src: string } {
  const bundledUrl = knownTokenIconUrl(symbol);
  if (bundledUrl) {
    return { source: "bundled", src: bundledUrl };
  }
  if (iconUrl && !isGeneratedTokenIconUrl(iconUrl)) {
    return { source: "remote", src: iconUrl };
  }
  return { source: "generated", src: generatedTokenIconUrl(symbol) };
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
  const primary = resolveTokenIcon(symbol, iconUrl);
  const source = failed ? "generated" : primary.source;
  const state = source === "generated" ? "fallback" : loadedSrc === primary.src ? "ready" : "loading";

  useEffect(() => {
    setFailed(false);
    setLoadedSrc(null);
  }, [iconUrl, symbol]);

  useEffect(() => {
    const image = imageRef.current;
    if (source !== "generated" && image?.complete && image.naturalWidth > 0) {
      setLoadedSrc(primary.src);
    }
  }, [primary.src, source]);

  return (
    <span
      {...props}
      ref={ref}
      aria-hidden="true"
      className={cx("token-icon", className)}
      data-size={size}
      data-slot="token-icon"
      data-source={source}
      data-state={state}
      data-symbol={canonicalTokenSymbol(symbol)}
    >
      <img
        alt=""
        data-slot="token-icon-fallback"
        decoding="async"
        draggable="false"
        height="64"
        src={fallbackSrc}
        width="64"
      />
      {source !== "generated" ? (
        <img
          ref={imageRef}
          alt=""
          data-slot="token-icon-image"
          decoding="async"
          draggable="false"
          height="64"
          src={primary.src}
          width="64"
          onLoad={(event) => {
            if (event.currentTarget.naturalWidth > 0) {
              setLoadedSrc(primary.src);
            }
            onImageLoad?.(event);
          }}
          onError={(event) => {
            setFailed(true);
            setLoadedSrc(null);
            onImageError?.(event);
          }}
        />
      ) : null}
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
          const marketValue = formatCurrency(token.totalUsd);
          return (
            <HoldingItem
              balance={showBalance ? (
                <QuantityValue aria-label={`${token.symbol} 数量`} value={token.totalBalance} />
              ) : undefined}
              data-symbol={canonicalTokenSymbol(token.symbol)}
              icon={<TokenIcon iconUrl={token.iconUrl} size="sm" symbol={token.symbol} />}
              key={token.id || `${canonicalTokenSymbol(token.symbol)}:${token.iconUrl || "fallback"}:${index}`}
              marketValue={<CurrencyValue value={token.totalUsd} />}
              symbol={token.symbol}
              title={`${token.symbol}${showBalance ? ` · ${balance}` : ""} · ${marketValue}`}
            />
          );
        })}
      </HoldingList>
    );
  }
);
