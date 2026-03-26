import type { ReactNode, RefObject } from 'react';

import { TableScrollContainer } from '@/components/table/TableScrollContainer';
import {
  TableSummaryBar,
  type BooleanFilter,
} from '@/components/table/TableSummaryBar';

export interface ActivityTableLayoutProps {
  /** Ref forwarded to the scroll container for scroll-to-top on pagination. */
  scrollRef: RefObject<HTMLDivElement | null>;
  /** Summary bar. */
  count: number;
  singularLabel: string;
  pluralLabel: string;
  filters?: BooleanFilter[];
  /** Content inside the scroll area (table, loading spinner, or empty state). */
  children: ReactNode;
}

/**
 * Shared layout shell for ActivityTable: summary bar and scroll container.
 * Search and sort live in ActivityTableFilters above this layout.
 */
export function ActivityTableLayout({
  scrollRef,
  count,
  singularLabel,
  pluralLabel,
  filters = [],
  children,
}: ActivityTableLayoutProps) {
  return (
    <div className="min-w-0 space-y-4">
      <TableSummaryBar
        count={count}
        singularLabel={singularLabel}
        pluralLabel={pluralLabel}
        filters={filters}
      />
      <TableScrollContainer ref={scrollRef}>{children}</TableScrollContainer>
    </div>
  );
}
