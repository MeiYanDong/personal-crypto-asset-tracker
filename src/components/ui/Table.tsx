import {
  forwardRef,
  type HTMLAttributes,
  type TableHTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes
} from "react";
import { cx } from "./utils";

export type TableProps = TableHTMLAttributes<HTMLTableElement> & {
  containerClassName?: string;
};

export const Table = forwardRef<HTMLTableElement, TableProps>(function Table(
  { className, containerClassName, ...props },
  ref
) {
  return (
    <div className={cx("ui-table-container", containerClassName)} data-slot="table-container">
      <table className={cx("ui-table", className)} data-slot="table" ref={ref} {...props} />
    </div>
  );
});

export type TableSectionProps = HTMLAttributes<HTMLTableSectionElement>;

export const TableHeader = forwardRef<HTMLTableSectionElement, TableSectionProps>(
  function TableHeader({ className, ...props }, ref) {
    return <thead className={cx("ui-table-header", className)} data-slot="table-header" ref={ref} {...props} />;
  }
);

export const TableBody = forwardRef<HTMLTableSectionElement, TableSectionProps>(
  function TableBody({ className, ...props }, ref) {
    return <tbody className={cx("ui-table-body", className)} data-slot="table-body" ref={ref} {...props} />;
  }
);

export const TableFooter = forwardRef<HTMLTableSectionElement, TableSectionProps>(
  function TableFooter({ className, ...props }, ref) {
    return <tfoot className={cx("ui-table-footer", className)} data-slot="table-footer" ref={ref} {...props} />;
  }
);

export type TableRowProps = HTMLAttributes<HTMLTableRowElement> & {
  selected?: boolean;
};

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  function TableRow({ className, selected = false, ...props }, ref) {
    return (
      <tr
        className={cx("ui-table-row", className)}
        data-selected={selected || undefined}
        data-slot="table-row"
        data-state={selected ? "selected" : undefined}
        ref={ref}
        {...props}
      />
    );
  }
);

export type TableHeadProps = ThHTMLAttributes<HTMLTableCellElement> & {
  numeric?: boolean;
};

export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(function TableHead(
  { className, numeric, scope = "col", ...props },
  ref
) {
  return (
    <th
      className={cx("ui-table-head", numeric && "ui-table-number", className)}
      data-slot="table-head"
      ref={ref}
      scope={scope}
      {...props}
    />
  );
});

export type TableVerticalAlignment = "middle" | "top";

export type TableCellProps = TdHTMLAttributes<HTMLTableCellElement> & {
  numeric?: boolean;
  vertical?: TableVerticalAlignment;
};

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(function TableCell(
  { className, numeric, vertical = "middle", ...props },
  ref
) {
  return (
    <td
      className={cx("ui-table-cell", numeric && "ui-table-number", className)}
      data-slot="table-cell"
      data-vertical={vertical}
      ref={ref}
      {...props}
    />
  );
});

export type TableRowHeadProps = ThHTMLAttributes<HTMLTableCellElement> & {
  numeric?: boolean;
  vertical?: TableVerticalAlignment;
};

export const TableRowHead = forwardRef<HTMLTableCellElement, TableRowHeadProps>(function TableRowHead(
  { className, numeric, scope = "row", vertical = "middle", ...props },
  ref
) {
  return (
    <th
      className={cx("ui-table-cell", "ui-table-row-head", numeric && "ui-table-number", className)}
      data-slot="table-row-head"
      data-vertical={vertical}
      ref={ref}
      scope={scope}
      {...props}
    />
  );
});

export type TableCaptionProps = HTMLAttributes<HTMLTableCaptionElement>;

export const TableCaption = forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
  function TableCaption({ className, ...props }, ref) {
    return <caption className={cx("ui-table-caption", className)} data-slot="table-caption" ref={ref} {...props} />;
  }
);
