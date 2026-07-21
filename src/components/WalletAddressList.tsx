import type { HTMLAttributes, ReactNode } from "react";
import { Badge } from "./ui/Badge";
import { cx } from "./ui/utils";

export type WalletAddressListItem = {
  address: string;
  kind: "EVM" | "SOL";
};

type WalletAddressListProps = Omit<HTMLAttributes<HTMLUListElement>, "children"> & {
  items: WalletAddressListItem[];
};

function compactAddress(address: string) {
  if (!address || address === "(native)") {
    return "(native)";
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletAddressList({ className, items, ...props }: WalletAddressListProps) {
  return (
    <ul className={cx("wallet-address-list", className)} {...props}>
      {items.map((item) => (
        <li
          aria-label={`${item.kind} 地址 ${item.address}`}
          className="wallet-address-line"
          key={item.address}
        >
          <span aria-hidden="true" className="wallet-address-kind" data-kind={item.kind.toLowerCase()}>
            {item.kind}
          </span>
          <code aria-hidden="true" className="wallet-address-value" title={item.address}>
            {compactAddress(item.address)}
          </code>
        </li>
      ))}
    </ul>
  );
}

export function WalletAddressDetailList({ className, ...props }: HTMLAttributes<HTMLUListElement>) {
  return <ul className={cx("wallet-address-detail-list", className)} {...props} />;
}

type WalletAddressDetailItemProps = Omit<HTMLAttributes<HTMLLIElement>, "children"> & {
  actions: ReactNode;
  address: string;
  kind: WalletAddressListItem["kind"];
  label: ReactNode;
  pairing: ReactNode;
};

export function WalletAddressDetailItem({
  actions,
  address,
  className,
  kind,
  label,
  pairing,
  ...props
}: WalletAddressDetailItemProps) {
  return (
    <li className={cx("wallet-address-detail-item", className)} {...props}>
      <Badge className="wallet-address-detail-kind" tone="outline">
        {kind}
      </Badge>
      <div className="wallet-address-detail-copy">
        {label}
        <code title={address}>{address}</code>
      </div>
      <div className="wallet-address-detail-pairing">{pairing}</div>
      <div className="wallet-address-detail-actions">{actions}</div>
    </li>
  );
}
