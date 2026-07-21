import type { ReactNode } from "react";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemMedia,
  ItemTitle
} from "./ui/Item";
import { cx } from "./ui/utils";

export type LedgerFact = {
  label: string;
  value: ReactNode;
};

type LedgerItemProps = {
  action?: ReactNode;
  amount?: ReactNode;
  amountLabel?: string;
  amountMeta?: ReactNode;
  className?: string;
  description?: ReactNode;
  details?: ReactNode;
  facts?: LedgerFact[];
  media: ReactNode;
  title: ReactNode;
};

export default function LedgerItem({
  action,
  amount,
  amountLabel = "总资产",
  amountMeta,
  className,
  description,
  details,
  facts = [],
  media,
  title
}: LedgerItemProps) {
  return (
    <Item className={cx("ledger-item", className)}>
      <ItemMedia>{media}</ItemMedia>
      <ItemContent>
        <ItemTitle>{title}</ItemTitle>
        {description ? <ItemDescription>{description}</ItemDescription> : null}
      </ItemContent>
      <ItemActions>
        {amount !== undefined ? (
          <div className="ledger-item-amount">
            <small>{amountLabel}</small>
            <strong>{amount}</strong>
            {amountMeta ? <div>{amountMeta}</div> : null}
          </div>
        ) : null}
        {action}
      </ItemActions>
      {facts.length || details ? (
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
}

export function LedgerDetail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="ledger-detail-block">
      <span>{label}</span>
      {children}
    </div>
  );
}
