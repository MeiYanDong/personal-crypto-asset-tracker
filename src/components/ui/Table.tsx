import {
  forwardRef,
  type HTMLAttributes,
  type TableHTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes
} from "react";
import { cx } from "./utils";

type TableProps = TableHTMLAttributes<HTMLTableElement> & {
  containerClassName?: string;
};

export const Table = forwardRef<HTMLTableElement, TableProps>(function Table(
  { className, containerClassName, ...props },
  ref
) {
  return (
    <div className={cx("ui-table-container", containerClassName)}>
      <table className={cx("ui-table", className)} ref={ref} {...props} />
    </div>
  );
});

export const TableHeader = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  function TableHeader({ className, ...props }, ref) {
    return <thead className={cx("ui-table-header", className)} ref={ref} {...props} />;
  }
);

export const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  function TableBody({ className, ...props }, ref) {
    return <tbody className={cx("ui-table-body", className)} ref={ref} {...props} />;
  }
);

export const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
  function TableRow({ className, ...props }, ref) {
    return <tr className={cx("ui-table-row", className)} ref={ref} {...props} />;
  }
);

type TableHeadProps = ThHTMLAttributes<HTMLTableCellElement> & {
  numeric?: boolean;
};

export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(function TableHead(
  { className, numeric, scope = "col", ...props },
  ref
) {
  return (
    <th
      className={cx("ui-table-head", numeric && "ui-table-number", className)}
      ref={ref}
      scope={scope}
      {...props}
    />
  );
});

type TableCellProps = TdHTMLAttributes<HTMLTableCellElement> & {
  numeric?: boolean;
};

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(function TableCell(
  { className, numeric, ...props },
  ref
) {
  return (
    <td
      className={cx("ui-table-cell", numeric && "ui-table-number", className)}
      ref={ref}
      {...props}
    />
  );
});

export const TableCaption = forwardRef<HTMLTableCaptionElement, HTMLAttributes<HTMLTableCaptionElement>>(
  function TableCaption({ className, ...props }, ref) {
    return <caption className={cx("ui-table-caption", className)} ref={ref} {...props} />;
  }
);
