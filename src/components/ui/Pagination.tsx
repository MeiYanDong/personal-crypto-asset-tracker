import { type HTMLAttributes } from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button, IconButton } from "./Button";
import { CountPair, CountValue } from "./CountValue";
import { cx } from "./utils";

export type PaginationToken = number | "ellipsis-start" | "ellipsis-end";

export function paginationTokens(page: number, pageCount: number): PaginationToken[] {
  const safePageCount = Math.max(1, Math.floor(pageCount));
  const safePage = Math.min(Math.max(1, Math.floor(page)), safePageCount);

  if (safePageCount <= 5) {
    return Array.from({ length: safePageCount }, (_, index) => index + 1);
  }

  if (safePage <= 3) {
    return [1, 2, 3, "ellipsis-end", safePageCount];
  }

  if (safePage >= safePageCount - 2) {
    return [1, "ellipsis-start", safePageCount - 2, safePageCount - 1, safePageCount];
  }

  return [1, "ellipsis-start", safePage, "ellipsis-end", safePageCount];
}

export type PaginationProps = Omit<HTMLAttributes<HTMLElement>, "aria-label" | "onChange"> & {
  "aria-label"?: string;
  controlsId?: string;
  itemLabel?: string;
  onPageChange: (page: number) => void;
  page: number;
  pageSize: number;
  totalItems: number;
};

export function Pagination({
  "aria-label": ariaLabel = "分页",
  className,
  controlsId,
  itemLabel = "项",
  onPageChange,
  page,
  pageSize,
  totalItems,
  ...props
}: PaginationProps) {
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const safeTotalItems = Math.max(0, Math.floor(totalItems));
  const pageCount = Math.max(1, Math.ceil(safeTotalItems / safePageSize));
  const activePage = Math.min(Math.max(1, Math.floor(page)), pageCount);

  if (safeTotalItems <= safePageSize) {
    return null;
  }

  const rangeStart = (activePage - 1) * safePageSize + 1;
  const rangeEnd = Math.min(activePage * safePageSize, safeTotalItems);
  const isFirstPage = activePage === 1;
  const isLastPage = activePage === pageCount;

  return (
    <nav
      {...props}
      aria-label={ariaLabel}
      className={cx("ui-pagination", className)}
      data-page={activePage}
      data-page-count={pageCount}
      data-slot="pagination"
    >
      <p className="ui-pagination-range" aria-atomic="true" aria-live="polite">
        显示 <strong><CountPair first={rangeStart} second={rangeEnd} separator="–" /></strong>，共{" "}
        <strong><CountValue value={safeTotalItems} /></strong> 个{itemLabel}
      </p>
      <ol className="ui-pagination-content">
        <li>
          <IconButton
            aria-controls={controlsId}
            disabled={isFirstPage}
            disabledReason="已经是第一页"
            label="上一页"
            size="xs"
            onClick={() => onPageChange(activePage - 1)}
          >
            <ChevronLeft aria-hidden="true" />
          </IconButton>
        </li>
        {paginationTokens(activePage, pageCount).map((token) => (
          <li key={token}>
            {typeof token === "number" ? (
              <Button
                aria-controls={controlsId}
                aria-current={token === activePage ? "page" : undefined}
                aria-disabled={token === activePage || undefined}
                aria-label={token === activePage ? `第 ${token} 页，当前页` : `前往第 ${token} 页`}
                className="ui-pagination-page"
                size="xs"
                variant={token === activePage ? "primary" : "secondary"}
                onClick={() => onPageChange(token)}
              >
                <CountValue value={token} />
              </Button>
            ) : (
              <span className="ui-pagination-ellipsis">
                <MoreHorizontal aria-hidden="true" />
                <span className="sr-only">更多页面</span>
              </span>
            )}
          </li>
        ))}
        <li>
          <IconButton
            aria-controls={controlsId}
            disabled={isLastPage}
            disabledReason="已经是最后一页"
            label="下一页"
            size="xs"
            onClick={() => onPageChange(activePage + 1)}
          >
            <ChevronRight aria-hidden="true" />
          </IconButton>
        </li>
      </ol>
    </nav>
  );
}
