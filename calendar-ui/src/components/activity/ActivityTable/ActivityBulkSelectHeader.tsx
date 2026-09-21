import { ChevronDown } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ActivityTableCore } from '@/hooks/useActivityTableCore';

export interface ActivityBulkSelectHeaderProps {
  core: ActivityTableCore;
}

/**
 * Header control that selects all activities, the current page, or the rows
 * led by one of the user's teams. Checkbox is centered in the select column;
 * the menu chevron sits to the right without shifting checkbox alignment.
 */
export function ActivityBulkSelectHeader({
  core,
}: ActivityBulkSelectHeaderProps) {
  const {
    sortedData,
    sortedActivityIds,
    selectedActivityCount,
    selectActivityIds,
    pagination,
    user,
  } = core;

  const pageCount = Math.min(
    pagination.pageSize,
    Math.max(sortedData.length - pagination.pageIndex * pagination.pageSize, 0)
  );

  const allSelected =
    sortedData.length > 0 && selectedActivityCount === sortedData.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-no-row-nav
          className="relative inline-flex size-4 shrink-0 items-center justify-center border-0 bg-transparent p-0"
          aria-label="Select activities"
        >
          <Checkbox
            aria-hidden
            readOnly
            checked={allSelected}
            className="pointer-events-none"
          />
          <ChevronDown
            className="pointer-events-none absolute top-1/2 left-full ml-px size-3 shrink-0 -translate-y-1/2 text-slate-600"
            aria-hidden
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onSelect={() => selectActivityIds(sortedActivityIds)}>
          All activities ({sortedData.length})
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() =>
            selectActivityIds(
              sortedData
                .slice(
                  pagination.pageIndex * pagination.pageSize,
                  (pagination.pageIndex + 1) * pagination.pageSize
                )
                .map((row) => row.id)
            )
          }
        >
          This page ({pageCount})
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() =>
            selectActivityIds(
              sortedData
                .filter(
                  (row) =>
                    row.leadTeamId != null &&
                    (user?.teamIds ?? []).includes(row.leadTeamId)
                )
                .map((row) => row.id)
            )
          }
        >
          My teams
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
