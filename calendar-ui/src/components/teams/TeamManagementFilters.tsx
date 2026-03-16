import { Search, X } from 'lucide-react';

import {
  SortDropdown,
  type SortColumnConfig,
} from '@/components/Table/SortDropdown';
import { Input } from '@/components/ui/input';

const TEAM_SORT_COLUMNS: SortColumnConfig[] = [
  { id: 'displayName', label: 'Display name', defaultDirection: 'asc' },
  { id: 'members', label: 'Members', defaultDirection: 'asc' },
];

interface TeamManagementFiltersProps {
  keyword: string;
  onKeywordChange: (value: string) => void;
  sortKey: string | null;
  sortDirection: 'asc' | 'desc';
  onSortChange: (key: string | null, direction: 'asc' | 'desc') => void;
  defaultSortKey: string;
  defaultSortDirection: 'asc' | 'desc';
  className?: string;
}

/**
 * Filter bar for the Teams table: keyword search and sort dropdown.
 * Matches the style and layout of UserManagementFilters (search + sort on the right).
 */
export function TeamManagementFilters({
  keyword,
  onKeywordChange,
  sortKey,
  sortDirection,
  onSortChange,
  defaultSortKey,
  defaultSortDirection,
  className,
}: TeamManagementFiltersProps) {
  return (
    <div
      className={className}
      role="search"
      aria-label="Filter teams by keyword and sort"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2" />
        <div className="flex items-center gap-2">
          <div className="relative max-w-md min-w-[240px] flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search teams..."
              value={keyword}
              onChange={(e) => onKeywordChange(e.target.value)}
              className="pr-8 pl-8"
              aria-label="Keyword search"
            />
            {keyword && (
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
                onClick={() => onKeywordChange('')}
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <SortDropdown
            columns={TEAM_SORT_COLUMNS}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSortChange={onSortChange}
            defaultSortKey={defaultSortKey}
            defaultSortDirection={defaultSortDirection}
            ariaLabel="Sort by"
          />
        </div>
      </div>
    </div>
  );
}
