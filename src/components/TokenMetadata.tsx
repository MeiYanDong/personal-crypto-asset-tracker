import { AlertTriangle } from "lucide-react";
import { forwardRef, type HTMLAttributes } from "react";
import { MetadataItem, MetadataList } from "./ui/MetadataList";
import { cx } from "./ui/utils";

export type TokenChainBreakdown = {
  chainName: string;
  totalUsd: number;
};

export type TokenChainBreakdownListProps = Omit<HTMLAttributes<HTMLUListElement>, "children"> & {
  items: TokenChainBreakdown[];
  maxItems?: number;
};

export type TokenContractListProps = Omit<HTMLAttributes<HTMLUListElement>, "children"> & {
  contracts: string[];
  maxItems?: number;
  riskCount?: number;
};

function visibleLimit(value: number | undefined, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return fallback;
  }
  return Math.floor(value);
}

function currency(value: number) {
  const safeValue = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: safeValue >= 1000 ? 0 : 2
  }).format(safeValue);
}

export function shortContractAddress(address: string) {
  if (!address || address === "(native)") {
    return "(native)";
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export const TokenChainBreakdownList = forwardRef<HTMLUListElement, TokenChainBreakdownListProps>(
  function TokenChainBreakdownList({ "aria-label": ariaLabel = "链分布", className, items, maxItems, ...props }, ref) {
    const limit = visibleLimit(maxItems, 4);
    const visibleItems = items.slice(0, limit);
    const overflowCount = Math.max(0, items.length - visibleItems.length);

    return (
      <MetadataList
        {...props}
        ref={ref}
        aria-label={ariaLabel}
        className={cx("token-chain-breakdown-list", className)}
        data-component="token-chain-breakdown-list"
        data-item-count={items.length}
        data-overflow-count={overflowCount || undefined}
        emptyText="暂无链分布"
      >
        {visibleItems.map((item, index) => {
          const chainName = item.chainName.trim() || "未知链";
          const formattedValue = currency(item.totalUsd);
          return (
            <MetadataItem
              key={`${chainName}:${index}`}
              label={chainName}
              title={`${chainName} · ${formattedValue}`}
              value={formattedValue}
            />
          );
        })}
        {overflowCount ? (
          <MetadataItem
            aria-label={`另有 ${overflowCount} 条链未显示`}
            label={`+${overflowCount}`}
            title={`另有 ${overflowCount} 条链未显示`}
            variant="overflow"
          />
        ) : null}
      </MetadataList>
    );
  }
);

export const TokenContractList = forwardRef<HTMLUListElement, TokenContractListProps>(
  function TokenContractList({
    "aria-label": ariaLabel = "合约",
    className,
    contracts,
    maxItems,
    riskCount = 0,
    ...props
  }, ref) {
    const normalizedContracts = Array.from(new Set(contracts.map((contract) => contract.trim()).filter(Boolean)));
    const limit = visibleLimit(maxItems, 3);
    const visibleContracts = normalizedContracts.slice(0, limit);
    const overflowCount = Math.max(0, normalizedContracts.length - visibleContracts.length);
    const safeRiskCount = Number.isFinite(riskCount) ? Math.max(0, Math.floor(riskCount)) : 0;

    return (
      <MetadataList
        {...props}
        ref={ref}
        aria-label={ariaLabel}
        className={cx("token-contract-list", className)}
        data-component="token-contract-list"
        data-item-count={normalizedContracts.length}
        data-overflow-count={overflowCount || undefined}
        data-risk-count={safeRiskCount || undefined}
        emptyText="暂无合约"
      >
        {visibleContracts.map((contract) => {
          const native = contract === "(native)";
          const fullLabel = native ? "原生代币，无合约地址" : `合约 ${contract}`;
          return (
            <MetadataItem
              fullLabel={fullLabel}
              key={contract}
              label={shortContractAddress(contract)}
              title={fullLabel}
              variant="code"
            />
          );
        })}
        {overflowCount ? (
          <MetadataItem
            aria-label={`另有 ${overflowCount} 个合约未显示`}
            label={`+${overflowCount}`}
            title={`另有 ${overflowCount} 个合约未显示`}
            variant="overflow"
          />
        ) : null}
        {safeRiskCount ? (
          <MetadataItem
            data-kind="risk"
            icon={<AlertTriangle />}
            label={`风险 ${safeRiskCount}`}
            title={`${safeRiskCount} 个风险持仓`}
            variant="warning"
          />
        ) : null}
      </MetadataList>
    );
  }
);
