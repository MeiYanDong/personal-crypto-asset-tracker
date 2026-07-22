import { forwardRef, type HTMLAttributes } from "react";
import { Skeleton } from "./ui/Skeleton";
import { cx } from "./ui/utils";

const assetGroupSkeletonRows = Array.from({ length: 6 }, (_, index) => index);
const walletSkeletonRows = Array.from({ length: 6 }, (_, index) => index);

export type WalletManagementSkeletonProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  "data-slot"?: string;
};

export function WalletManagementHeadingSkeleton() {
  return <Skeleton className="management-heading-skeleton" data-slot="management-heading-skeleton" />;
}

export const WalletManagementSkeleton = forwardRef<HTMLElement, WalletManagementSkeletonProps>(
  function WalletManagementSkeleton({
    "aria-live": ariaLive,
    className,
    "data-slot": inheritedSlot,
    role,
    ...props
  }, ref) {
    return (
      <section
        {...props}
        ref={ref}
        aria-busy="true"
        aria-live={ariaLive ?? "polite"}
        className={cx("management-workspace", "management-workspace-skeleton", className)}
        data-slot={inheritedSlot ?? "wallet-management-skeleton"}
        data-state="loading"
        role={role ?? "status"}
      >
        <span className="sr-only">正在载入钱包与资产组</span>

        <aside aria-hidden="true" className="asset-group-sidebar management-skeleton-sidebar">
          <div className="management-skeleton-sidebar-desktop">
            <div className="management-skeleton-sidebar-heading">
              <div>
                <Skeleton />
                <Skeleton />
              </div>
              <Skeleton />
            </div>
            <div className="management-skeleton-group-list">
              {assetGroupSkeletonRows.map((index) => (
                <div className="management-skeleton-group-row" key={index}>
                  <Skeleton />
                  <Skeleton />
                  <Skeleton />
                </div>
              ))}
            </div>
            <div className="management-skeleton-sidebar-footer">
              <Skeleton />
              <div>
                {assetGroupSkeletonRows.map((index) => <Skeleton key={index} />)}
              </div>
            </div>
          </div>

          <div className="management-skeleton-sidebar-mobile">
            <Skeleton />
            <div>
              <Skeleton />
              <Skeleton />
            </div>
            <Skeleton />
          </div>
        </aside>

        <section aria-hidden="true" className="content management-content management-skeleton-content">
          <div className="management-skeleton-toolbar">
            <div className="management-skeleton-summary">
              <Skeleton />
              <Skeleton />
            </div>
            <div className="management-skeleton-tools">
              <Skeleton />
              <Skeleton />
              <Skeleton />
            </div>
          </div>
          <div className="management-skeleton-table-heading">
            {[0, 1, 2, 3, 4, 5].map((index) => <Skeleton key={index} />)}
          </div>
          <div className="management-skeleton-wallet-list">
            {walletSkeletonRows.map((index) => (
              <div className="management-skeleton-wallet-row" key={index}>
                <Skeleton className="management-skeleton-checkbox" />
                <div className="management-skeleton-wallet-identity">
                  <Skeleton className="management-skeleton-wallet-mark" />
                  <div>
                    <Skeleton />
                    <Skeleton />
                    <Skeleton />
                  </div>
                </div>
                <Skeleton className="management-skeleton-group-control" />
                <Skeleton className="management-skeleton-amount" />
                <Skeleton className="management-skeleton-status" />
                <Skeleton className="management-skeleton-actions" />
              </div>
            ))}
          </div>
        </section>
      </section>
    );
  }
);
