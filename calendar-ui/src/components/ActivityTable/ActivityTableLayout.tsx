import { Search } from 'lucide-react';
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
import { Input } from '@/components/ui/input';

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
  /** Optional keyword search (persisted with other preferences). */
  searchKeyword?: string;
  onSearchKeywordChange?: (value: string) => void;
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
  searchKeyword,
  onSearchKeywordChange,
  children,
}: ActivityTableLayoutProps) {
  const showSearch =
    searchKeyword !== undefined && onSearchKeywordChange !== undefined;

  return (
    <div className="min-w-0 space-y-4">
      <div className="mb-4 flex flex-wrap items-center justify-end gap-4">
        {showSearch && (
          <div className="relative mr-auto max-w-md min-w-[240px] flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
            <Input
              type="search"
              placeholder="Search activities..."
              value={searchKeyword}
              onChange={(e) => onSearchKeywordChange(e.target.value)}
              className="pl-8"
              aria-label="Search activities"
            />
          </div>
        )}
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
