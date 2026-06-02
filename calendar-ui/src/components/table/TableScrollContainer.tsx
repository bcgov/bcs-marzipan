import { forwardRef, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

import {
  TABLE_SCROLL_HEIGHT,
  tableContainer,
  tableScrollWrapper,
} from './tableConstants';

export interface TableScrollContainerProps {
  children: ReactNode;
  className?: string;
  /** Defaults to {@link TABLE_SCROLL_HEIGHT}. */
  scrollHeight?: string;
  scrollAriaLabel?: string;
}

/**
 * Wraps a table in the shared scrollable container (height from TABLE_SCROLL_HEIGHT).
 * Forward the ref to the inner scroll div so parents can call scrollTo({ top: 0 }) on page/size change.
 * Used by Users table and EventTable (Calendar Entries) for consistent height and scrolling.
 */
export const TableScrollContainer = forwardRef<
  HTMLDivElement,
  TableScrollContainerProps
>(function TableScrollContainer(
  { children, className, scrollHeight = TABLE_SCROLL_HEIGHT, scrollAriaLabel },
  ref
) {
  return (
    <div
      className={cn(tableContainer, className)}
      style={{ height: scrollHeight }}
    >
      <div
        ref={ref}
        className={tableScrollWrapper}
        aria-label={scrollAriaLabel}
      >
        {children}
      </div>
    </div>
  );
});
