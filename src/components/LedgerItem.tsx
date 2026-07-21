import { forwardRef, type ReactNode } from "react";
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
  label: string;
  value: ReactNode;
};

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

const LedgerItem = forwardRef<HTMLLIElement, LedgerItemProps>(function LedgerItem(
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
            <dl className="ledger-item-amount">
              <dt>{amountLabel}</dt>
              <dd>
                <strong>{amount}</strong>
                {amountMeta ? <div className="ledger-item-amount-meta">{amountMeta}</div> : null}
              </dd>
            </dl>
          ) : null}
          {action}
        </ItemActions>
      ) : null}
      {hasFooter ? (
        <ItemFooter>
          {facts.length ? (
            <dl className={cx("ledger-item-facts", `columns-${Math.min(3, facts.length)}`)}>
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {details ? <div className="ledger-item-details">{details}</div> : null}
        </ItemFooter>
      ) : null}
    </Item>
  );
});

export default LedgerItem;

export type LedgerDetailProps = {
  children: ReactNode;
  label: string;
};

export function LedgerDetail({ label, children }: LedgerDetailProps) {
  return (
    <div className="ledger-detail-block" data-slot="ledger-detail">
      <span>{label}</span>
      {children}
    </div>
  );
}
