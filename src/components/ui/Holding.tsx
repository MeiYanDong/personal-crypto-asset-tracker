import { Children, type HTMLAttributes, type LiHTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";

type HoldingListProps = Omit<HTMLAttributes<HTMLUListElement>, "children"> & {
  children?: ReactNode;
  emptyText?: ReactNode;
};

export function HoldingList({ children, className, emptyText = "暂无持仓", ...props }: HoldingListProps) {
  const items = Children.toArray(children).filter(Boolean);

  if (!items.length) {
    return <span className="ui-holding-empty">{emptyText}</span>;
  }

  return (
    <ul className={cx("ui-holding-list", className)} {...props}>
      {items}
    </ul>
  );
}

type HoldingItemProps = Omit<LiHTMLAttributes<HTMLLIElement>, "children"> & {
  balance?: ReactNode;
  icon: ReactNode;
  marketValue: ReactNode;
  symbol: ReactNode;
};

export function HoldingItem({ balance, className, icon, marketValue, symbol, ...props }: HoldingItemProps) {
  return (
    <li className={cx("ui-holding-item", className)} {...props}>
      <span aria-hidden="true" className="ui-holding-icon">{icon}</span>
      <span className="ui-holding-symbol">{symbol}</span>
      {balance !== undefined ? (
        <span className="ui-holding-balance">
          <span className="sr-only">数量</span>
          <span className="ui-holding-balance-text">{balance}</span>
        </span>
      ) : null}
      <span className="ui-holding-value">
        <span className="sr-only">市值</span>
        {marketValue}
      </span>
    </li>
  );
}
