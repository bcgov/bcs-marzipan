import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 10;

export interface TablePaginationProps {
  /** Total number of items across all pages */
  totalItems: number;
  /** Current 1-based page index */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Called when user changes page (1-based) */
  onPageChange: (page: number) => void;
  /** Called when user changes page size */
  onPageSizeChange: (pageSize: number) => void;
  /** Options for "results per page" dropdown. Defaults to [10, 25, 50, 100] */
  pageSizeOptions?: readonly number[];
  /** Accessible label for the pagination region */
  'aria-label'?: string;
  className?: string;
}

/**
 * Returns an array of page numbers and ellipsis markers to display.
 * e.g. [1, 2, 3, 'ellipsis', 16] or [1, 'ellipsis', 5, 6, 7, 'ellipsis', 16]
 */
function getPageNumbersToShow(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 5
): (number | 'ellipsis')[] {
  if (totalPages <= 0) return [];
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [];
  const half = Math.floor(maxVisible / 2);

  let start = Math.max(1, currentPage - half);
  const end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push('ellipsis');
  }
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  if (end < totalPages) {
    if (end < totalPages - 1) pages.push('ellipsis');
    pages.push(totalPages);
  }
  return pages;
}

export function TablePagination({
  totalItems,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  'aria-label': ariaLabel = 'Table pagination',
  className,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const pageNumbers = getPageNumbersToShow(currentPage, totalPages);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const handlePrev = () => {
    if (hasPrev) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (hasNext) onPageChange(currentPage + 1);
  };

  return (
    <div
      role="navigation"
      aria-label={ariaLabel}
      className={cn(
        'flex flex-wrap items-center justify-center gap-4 py-3 sm:justify-between',
        className
      )}
    >
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrev}
          disabled={!hasPrev}
          aria-label="Previous page"
          className="h-9 px-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="ml-1">Prev</span>
        </Button>
        <div className="flex items-center gap-0.5">
          {pageNumbers.map((item, idx) =>
            item === 'ellipsis' ? (
              <span
                key={`ellipsis-${idx}`}
                className="flex h-9 min-w-9 items-center justify-center px-2 text-slate-500"
                aria-hidden
              >
                ...
              </span>
            ) : (
              <Button
                key={item}
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(item)}
                aria-label={`Page ${item}`}
                aria-current={item === currentPage ? 'page' : undefined}
                className={cn(
                  'relative h-9 min-w-9 px-2 font-normal',
                  item === currentPage &&
                    'text-primary bg-transparent font-medium'
                )}
              >
                {item}
                {item === currentPage && (
                  <span
                    className="bg-primary absolute right-2 bottom-0 left-2 h-0.5 rounded-full"
                    aria-hidden
                  />
                )}
              </Button>
            )
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNext}
          disabled={!hasNext}
          aria-label="Next page"
          className="h-9 px-2"
        >
          <span className="mr-1">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-600">
        <span>Show</span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => onPageSizeChange(Number(v))}
        >
          <SelectTrigger className="h-9 w-18" aria-label="Results per page">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>results per page</span>
      </div>
    </div>
  );
}

export { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS };
