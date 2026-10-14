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
  GRID_A_SELECT_CHECKBOX_HIT_CLASS,
} from './selectColumnLayout';

export interface ActivityBulkSelectHeaderProps {
  core: ActivityTableCore;
}

/**
 * Header control that selects all activities, the current page, or the rows
 * led by one of the user's teams. Checkbox toggles all sorted rows; chevron
 * opens scoped selection menu.
 */
export function ActivityBulkSelectHeader({
  core,
}: ActivityBulkSelectHeaderProps) {
  const {
    sortedData,
    sortedActivityIds,
    selectedActivityCount,
    selectActivityIds,
    clearSelection,
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

  const handleHeaderCheckboxChange = (value: boolean | 'indeterminate') => {
    if (value === true) {
      selectActivityIds(sortedActivityIds);
    } else {
      clearSelection();
    }
  };

  return (
    <div className={`${GRID_A_SELECT_CHECKBOX_HEADER_ALIGN_CLASS} gap-px`}>
      <span
        data-no-row-nav
        onClick={(e) => e.stopPropagation()}
        className={GRID_A_SELECT_CHECKBOX_HIT_CLASS}
      >
        <Checkbox
          aria-label="Select all activities"
          checked={headerCheckboxChecked}
          disabled={sortedData.length === 0}
          onCheckedChange={handleHeaderCheckboxChange}
        />
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            data-no-row-nav
            className={GRID_A_SELECT_CHECKBOX_HEADER_TRIGGER_CLASS}
            aria-label="Select activities menu"
          >
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
