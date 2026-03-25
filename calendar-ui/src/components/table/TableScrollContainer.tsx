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
}

/**
 * Wraps a table in the shared scrollable container (height from TABLE_SCROLL_HEIGHT).
 * Forward the ref to the inner scroll div so parents can call scrollTo({ top: 0 }) on page/size change.
 * Used by Users table and EventTable (Calendar Entries) for consistent height and scrolling.
 */
export const TableScrollContainer = forwardRef<
  HTMLDivElement,
  TableScrollContainerProps
>(function TableScrollContainer({ children, className }, ref) {
  return (
    <div
      className={cn(tableContainer, className)}
      style={{ height: TABLE_SCROLL_HEIGHT }}
    >
      <div ref={ref} className={tableScrollWrapper}>
        {children}
      </div>
    </div>
  );
});
