import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemMedia,
  ItemTitle,
  type ItemProps
} from "./ui/Item";
import { cx } from "./ui/utils";

export type LedgerFact = {
  id?: string;
  label: ReactNode;
  value: ReactNode;
  valueKind?: LedgerFactValueKind;
  valueTitle?: string;
};

export type LedgerFactValueKind = "number" | "text";

export type LedgerFactGridProps = Omit<HTMLAttributes<HTMLDListElement>, "children"> & {
  columns?: 1 | 2 | 3;
  facts: LedgerFact[];
};

export const LedgerFactGrid = forwardRef<HTMLDListElement, LedgerFactGridProps>(
  function LedgerFactGrid({ className, columns, facts, ...props }, ref) {
    const columnCount = columns ?? Math.min(3, Math.max(1, facts.length)) as 1 | 2 | 3;
    return (
      <dl
        {...props}
        ref={ref}
        className={cx("ledger-item-facts", `columns-${columnCount}`, className)}
        data-component="ledger-fact-grid"
        data-fact-count={facts.length}
        data-slot="ledger-fact-grid"
      >
        {facts.map((fact, index) => {
          const valueKind = fact.valueKind ?? "text";
          const primitiveValue = typeof fact.value === "string" || typeof fact.value === "number"
            ? String(fact.value)
            : undefined;
          return (
            <div
              data-slot="ledger-fact-item"
              data-value-kind={valueKind}
              key={fact.id || (typeof fact.label === "string" ? fact.label : index)}
            >
              <dt data-slot="ledger-fact-label">{fact.label}</dt>
              <dd
                data-slot="ledger-fact-value"
                title={fact.valueTitle ?? (valueKind === "number" ? primitiveValue : undefined)}
              >
                {fact.value}
              </dd>
            </div>
          );
        })}
      </dl>
    );
  }
);

export type LedgerItemProps = Omit<ItemProps, "children" | "title"> & {
  action?: ReactNode;
  amount?: ReactNode;
  amountLabel?: string;
  amountMeta?: ReactNode;
  description?: ReactNode;
  details?: ReactNode;
  facts?: LedgerFact[];
  media: ReactNode;
  title: ReactNode;
};

export const LedgerItem = forwardRef<HTMLLIElement, LedgerItemProps>(function LedgerItem(
  {
    action,
    amount,
    amountLabel = "总资产",
    amountMeta,
    className,
    description,
    details,
    facts = [],
    media,
    title,
    ...itemProps
  },
  ref
) {
  const hasAction = action !== undefined && action !== null;
  const hasAmount = amount !== undefined;
  const hasFooter = facts.length > 0 || details !== undefined && details !== null;

  return (
    <Item
      {...itemProps}
      ref={ref}
      className={cx("ledger-item", className)}
      data-actionable={hasAction || undefined}
      data-fact-count={facts.length || undefined}
      data-has-footer={hasFooter || undefined}
      data-component="ledger-item"
    >
      <ItemMedia>{media}</ItemMedia>
      <ItemContent>
        <ItemTitle>{title}</ItemTitle>
        {description ? <ItemDescription>{description}</ItemDescription> : null}
      </ItemContent>
      {hasAmount || hasAction ? (
        <ItemActions>
          {hasAmount ? (
            <dl className="ledger-item-amount" data-slot="ledger-amount">
              <dt data-slot="ledger-amount-label">{amountLabel}</dt>
              <dd data-slot="ledger-amount-value">
                <strong>{amount}</strong>
                {amountMeta ? (
                  <div className="ledger-item-amount-meta" data-slot="ledger-amount-meta">{amountMeta}</div>
                ) : null}
              </dd>
            </dl>
          ) : null}
          {action}
        </ItemActions>
      ) : null}
      {hasFooter ? (
        <ItemFooter>
          {facts.length ? (
            <LedgerFactGrid facts={facts} />
          ) : null}
          {details ? <div className="ledger-item-details" data-slot="ledger-details">{details}</div> : null}
        </ItemFooter>
      ) : null}
    </Item>
  );
});

export default LedgerItem;

export type LedgerDetailProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  children: ReactNode;
  label: ReactNode;
};

export const LedgerDetail = forwardRef<HTMLDivElement, LedgerDetailProps>(
  function LedgerDetail({ children, className, label, ...props }, ref) {
    return (
      <div
        {...props}
        ref={ref}
        className={cx("ledger-detail-block", className)}
        data-component="ledger-detail"
        data-slot="ledger-detail"
      >
        <span data-slot="ledger-detail-label">{label}</span>
        <div data-slot="ledger-detail-content">{children}</div>
      </div>
    );
  }
);
