import { forwardRef, type HTMLAttributes } from "react";
import type { DefiPosition } from "../../shared/defi-position";
import { CurrencyValue } from "./ui/CurrencyValue";
import { HoldingList } from "./ui/Holding";
import { TokenIcon } from "./TokenIdentity";
import { cx } from "./ui/utils";

export type DefiProtocolIconProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  logoUrl?: string;
  name: string;
};

export const DefiProtocolIcon = forwardRef<HTMLSpanElement, DefiProtocolIconProps>(
  function DefiProtocolIcon({ className, logoUrl, name, ...props }, ref) {
    return (
      <TokenIcon
        {...props}
        ref={ref}
        className={cx("defi-protocol-icon", className)}
        iconUrl={logoUrl}
        symbol={name}
      />
    );
  }
);

export type DefiPositionListProps = Omit<HTMLAttributes<HTMLUListElement>, "children"> & {
  emptyText?: string;
  limit?: number;
  minimumUsd?: number;
  positions: DefiPosition[];
};

function positionMeta(position: DefiPosition) {
  const details = [position.chainName, position.type];
  if (position.tokenId) details.push(`NFT #${position.tokenId}`);
  if (position.range) details.push(position.range);
  return details.join(" · ");
}

function positionAssetSummary(position: DefiPosition) {
  return position.assets.map((asset) => asset.symbol).filter(Boolean).join(" / ");
}

export const DefiPositionList = forwardRef<HTMLUListElement, DefiPositionListProps>(
  function DefiPositionList({
    className,
    emptyText = "仓位明细暂不可用",
    limit = 4,
    minimumUsd = 1,
    positions,
    ...props
  }, ref) {
    const visiblePositions = positions.filter((position) => Math.abs(position.totalUsd) >= minimumUsd);
    const shownPositions = visiblePositions.slice(0, limit);
    const overflowCount = Math.max(0, visiblePositions.length - shownPositions.length);

    return (
      <HoldingList
        {...props}
        ref={ref}
        className={cx("defi-position-list", className)}
        data-position-count={visiblePositions.length}
        emptyText={emptyText}
      >
        {shownPositions.map((position) => {
          const leadAsset = position.assets[0];
          const assetSummary = positionAssetSummary(position);
          const meta = positionMeta(position);
          return (
            <li className="defi-position-item" key={position.id} title={`${position.name} · ${meta}`}>
              <TokenIcon
                className="defi-position-icon"
                iconUrl={leadAsset?.iconUrl}
                size="sm"
                symbol={leadAsset?.symbol || position.protocolName}
              />
              <span className="defi-position-copy">
                <strong>{position.name}</strong>
                <span>{assetSummary || meta}</span>
                {assetSummary ? <small>{meta}</small> : null}
              </span>
              <strong className="defi-position-value">
                <CurrencyValue value={position.totalUsd} />
              </strong>
            </li>
          );
        })}
        {overflowCount ? (
          <li className="defi-position-overflow">另有 {overflowCount} 个仓位</li>
        ) : null}
      </HoldingList>
    );
  }
);
