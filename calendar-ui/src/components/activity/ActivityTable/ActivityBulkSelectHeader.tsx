import { ChevronDown } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ActivityTableCore } from '@/hooks/useActivityTableCore';

import {
  GRID_A_SELECT_CHECKBOX_HEADER_ALIGN_CLASS,
  GRID_A_SELECT_CHECKBOX_HEADER_TRIGGER_CLASS,
} from './selectColumnLayout';

export interface ActivityBulkSelectHeaderProps {
  core: ActivityTableCore;
}

/**
 * Header control that selects all activities, the current page, or the rows
 * led by one of the user's teams. Checkbox aligns with row checkboxes; chevron
 * opens the menu to the right on the same trigger.
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
  const someSelected =
    selectedActivityCount > 0 && selectedActivityCount < sortedData.length;
  const headerCheckboxChecked = allSelected
    ? true
    : someSelected
      ? 'indeterminate'
      : false;

  return (
    <div className={GRID_A_SELECT_CHECKBOX_HEADER_ALIGN_CLASS}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            data-no-row-nav
            className={GRID_A_SELECT_CHECKBOX_HEADER_TRIGGER_CLASS}
            aria-label="Select activities menu"
          >
            <Checkbox
              aria-hidden
              readOnly
              checked={headerCheckboxChecked}
              className="pointer-events-none shrink-0"
            />
            <ChevronDown
              className="size-3 shrink-0 text-slate-600"
              aria-hidden
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onSelect={() => selectActivityIds(sortedActivityIds)}
          >
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
    </div>
  );
}
