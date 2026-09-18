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
 * led by one of the user's teams. Shared by every grid layout.
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-no-row-nav
          className="inline-flex size-6 items-center justify-center gap-0.5"
          aria-label="Select activities"
        >
          <Checkbox
            aria-hidden="true"
            readOnly
            checked={
              sortedData.length > 0 &&
              selectedActivityCount === sortedData.length
            }
          />
          <ChevronDown className="size-3" />
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
