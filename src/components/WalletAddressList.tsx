import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { Badge } from "./ui/Badge";
import { CopyButton } from "./ui/CopyButton";
import { cx } from "./ui/utils";

export type WalletAddressListItem = {
  address: string;
  kind: "EVM" | "SOL";
};

export type WalletAddressListProps = Omit<HTMLAttributes<HTMLUListElement>, "children"> & {
  copyable?: boolean;
  items: WalletAddressListItem[];
};

function compactAddress(address: string) {
  if (!address || address === "(native)") {
    return "(native)";
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export const WalletAddressList = forwardRef<HTMLUListElement, WalletAddressListProps>(
  function WalletAddressList({ className, copyable = true, items, ...props }, ref) {
    return (
      <ul
        {...props}
        ref={ref}
        className={cx("wallet-address-list", className)}
        data-copyable={copyable || undefined}
        data-count={items.length}
        data-empty={items.length === 0 || undefined}
        data-slot="wallet-address-list"
      >
        {items.map((item) => {
          const compact = compactAddress(item.address);
          return (
            <li
              aria-label={`${item.kind} 地址 ${item.address}`}
              className="wallet-address-line"
              data-kind={item.kind.toLowerCase()}
              data-slot="wallet-address-item"
              key={`${item.kind}:${item.address}`}
            >
              <span
                aria-hidden="true"
                className="wallet-address-kind"
                data-kind={item.kind.toLowerCase()}
                data-slot="wallet-address-kind"
              >
                {item.kind}
              </span>
              <code
                aria-hidden="true"
                className="wallet-address-value"
                data-slot="wallet-address-value"
                title={item.address}
              >
                {compact}
              </code>
              {copyable ? (
                <CopyButton
                  className="wallet-address-copy"
                  copiedLabel={`${item.kind} 地址已复制`}
                  data-slot="wallet-address-copy"
                  errorLabel={`无法复制 ${item.kind} 地址`}
                  label={`复制 ${item.kind} 地址 ${compact}`}
                  size="xs"
                  text={item.address}
                  variant="ghost"
                />
              ) : null}
            </li>
          );
        })}
      </ul>
    );
  }
);

export type WalletAddressDetailListProps = HTMLAttributes<HTMLUListElement>;

export const WalletAddressDetailList = forwardRef<HTMLUListElement, WalletAddressDetailListProps>(
  function WalletAddressDetailList({ className, ...props }, ref) {
    return (
      <ul
        {...props}
        ref={ref}
        className={cx("wallet-address-detail-list", className)}
        data-slot="wallet-address-detail-list"
      />
    );
  }
);

export type WalletAddressDetailItemProps = Omit<HTMLAttributes<HTMLLIElement>, "children"> & {
  actions: ReactNode;
  address: string;
  kind: WalletAddressListItem["kind"];
  label: ReactNode;
  pairing: ReactNode;
};

export const WalletAddressDetailItem = forwardRef<HTMLLIElement, WalletAddressDetailItemProps>(
  function WalletAddressDetailItem({
    actions,
    address,
    className,
    kind,
    label,
    pairing,
    ...props
  }, ref) {
    return (
      <li
        {...props}
        ref={ref}
        className={cx("wallet-address-detail-item", className)}
        data-kind={kind.toLowerCase()}
        data-slot="wallet-address-detail-item"
      >
        <Badge
          className="wallet-address-detail-kind"
          data-component="wallet-address-kind"
          tone="outline"
        >
          {kind}
        </Badge>
        <div className="wallet-address-detail-copy" data-slot="wallet-address-detail-copy">
          <div data-slot="wallet-address-detail-label">{label}</div>
          <code data-slot="wallet-address-detail-value" title={address}>{address}</code>
        </div>
        <div className="wallet-address-detail-pairing" data-slot="wallet-address-detail-pairing">
          {pairing}
        </div>
        <div className="wallet-address-detail-actions" data-slot="wallet-address-detail-actions">
          {actions}
        </div>
      </li>
    );
  }
);
