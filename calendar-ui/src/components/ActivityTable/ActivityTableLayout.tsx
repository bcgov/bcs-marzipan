import type { ReactNode, RefObject } from 'react';

import {
  SortDropdown,
  type SortColumnConfig,
} from '@/components/Table/SortDropdown';
import { TableScrollContainer } from '@/components/Table/TableScrollContainer';
import {
  TableSummaryBar,
  type BooleanFilter,
} from '@/components/Table/TableSummaryBar';

export interface ActivityTableLayoutProps {
  /** Ref forwarded to the scroll container for scroll-to-top on pagination. */
  scrollRef: RefObject<HTMLDivElement | null>;
  /** Sort dropdown config and state. */
  sortColumns: SortColumnConfig[];
  sortKey: string | null;
  sortDirection: 'asc' | 'desc';
  onSortChange: (key: string | null, direction: 'asc' | 'desc') => void;
  defaultSortKey: string;
  defaultSortDirection: 'asc' | 'desc';
  /** Summary bar. */
  count: number;
  singularLabel: string;
  pluralLabel: string;
  filters?: BooleanFilter[];
  /** Content inside the scroll area (table, loading spinner, or empty state). */
  children: ReactNode;
}

/**
 * Shared layout shell for ActivityTable: toolbar (sort dropdown + summary bar with filters)
 * and scroll container. Used for loading, empty, and success states so the toolbar and
 * container structure are defined in one place.
 */
export function ActivityTableLayout({
  scrollRef,
  sortColumns,
  sortKey,
  sortDirection,
  onSortChange,
  defaultSortKey,
  defaultSortDirection,
  count,
  singularLabel,
  pluralLabel,
  filters = [],
  children,
}: ActivityTableLayoutProps) {
  return (
    <div className="min-w-0 space-y-4">
      <div className="mb-4 flex flex-wrap items-center justify-end gap-4">
        <SortDropdown
          hideDirectionLabel
          columns={sortColumns}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSortChange={onSortChange}
          defaultSortKey={defaultSortKey}
          defaultSortDirection={defaultSortDirection}
          ariaLabel="Sort by"
        />
      </div>
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
