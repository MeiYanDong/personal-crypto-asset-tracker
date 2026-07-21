import {
  Children,
  forwardRef,
  type HTMLAttributes,
  type LiHTMLAttributes,
  type ReactNode
} from "react";
import { cx } from "./utils";

export type HoldingListProps = Omit<HTMLAttributes<HTMLUListElement>, "children"> & {
  children?: ReactNode;
  emptyText?: ReactNode;
};

export const HoldingList = forwardRef<HTMLUListElement, HoldingListProps>(function HoldingList({
  children,
  className,
  emptyText = "暂无持仓",
  ...props
}, ref) {
  const items = Children.toArray(children).filter(Boolean);

  return (
    <ul
      {...props}
      ref={ref}
      className={cx("ui-holding-list", className)}
      data-empty={!items.length || undefined}
      data-slot="holding-list"
    >
      {items.length ? items : (
        <li className="ui-holding-empty" data-slot="holding-empty">
          {emptyText}
        </li>
      )}
    </ul>
  );
});

export type HoldingItemProps = Omit<LiHTMLAttributes<HTMLLIElement>, "children"> & {
  balance?: ReactNode;
  icon: ReactNode;
  marketValue: ReactNode;
  symbol: ReactNode;
};

export const HoldingItem = forwardRef<HTMLLIElement, HoldingItemProps>(function HoldingItem({
  balance,
  className,
  icon,
  marketValue,
  symbol,
  ...props
}, ref) {
  return (
    <li
      {...props}
      ref={ref}
      className={cx("ui-holding-item", className)}
      data-has-balance={balance !== undefined || undefined}
      data-slot="holding-item"
    >
      <span aria-hidden="true" className="ui-holding-icon" data-slot="holding-icon">{icon}</span>
      <span className="ui-holding-symbol" data-slot="holding-symbol">{symbol}</span>
      {balance !== undefined ? (
        <span className="ui-holding-balance" data-slot="holding-balance">
          <span className="sr-only">数量</span>
          <span className="ui-holding-balance-text">{balance}</span>
        </span>
      ) : null}
      <span className="ui-holding-value" data-slot="holding-value">
        <span className="sr-only">市值</span>
        {marketValue}
      </span>
    </li>
  );
});
