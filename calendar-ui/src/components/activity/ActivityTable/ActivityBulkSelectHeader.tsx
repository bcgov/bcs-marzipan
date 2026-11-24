import { ChevronDown } from 'lucide-react';
import { useMemo } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ActivityTableCore } from '@/hooks/useActivityTableCore';

import {
  activityIdsForLeadTeam,
  activityIdsForUserLeadTeams,
  bulkSelectLeadTeamMenuItemLabel,
  bulkSelectLeadTeamsForMenu,
  countActivitiesByLeadTeamId,
  isBulkSelectLeadTeamItemDisabled,
} from './bulkSelectLeadTeamMenu';
import {
  GRID_A_SELECT_CHECKBOX_HEADER_ALIGN_CLASS,
  GRID_A_SELECT_CHECKBOX_HEADER_HIT_CLASS,
  GRID_A_SELECT_CHECKBOX_HEADER_TRIGGER_CLASS,
} from './selectColumnLayout';

export interface ActivityBulkSelectHeaderProps {
  core: ActivityTableCore;
}

const LEAD_TEAM_FILTER_DISABLED_TITLE = 'Not included in the Lead team filter';

/**
 * Header control that selects all activities, the current page, or the rows
 * led by a team. Checkbox toggles all sorted rows; chevron opens scoped selection menu.
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
    teams,
    filterState,
    canViewDeleted,
  } = core;

  const pageCount = Math.min(
    pagination.pageSize,
    Math.max(sortedData.length - pagination.pageIndex * pagination.pageSize, 0)
  );

  const userTeamIds = useMemo(() => user?.teamIds ?? [], [user?.teamIds]);
  const activeLeadTeamFilterIds = filterState.leadTeamIds ?? [];

  const leadTeamCounts = useMemo(
    () => countActivitiesByLeadTeamId(sortedData),
    [sortedData]
  );

  const leadTeamsForMenu = useMemo(
    () => bulkSelectLeadTeamsForMenu(teams, userTeamIds, canViewDeleted),
    [teams, userTeamIds, canViewDeleted]
  );

  const allMyTeamsCount = useMemo(
    () => activityIdsForUserLeadTeams(sortedData, userTeamIds).length,
    [sortedData, userTeamIds]
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

  const showAllMyTeamsItem = userTeamIds.length > 0;

  return (
    <div className={`${GRID_A_SELECT_CHECKBOX_HEADER_ALIGN_CLASS} gap-px`}>
      <span
        data-no-row-nav
        onClick={(e) => e.stopPropagation()}
        className={GRID_A_SELECT_CHECKBOX_HEADER_HIT_CLASS}
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
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Lead team</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="max-h-64 min-w-48">
              {showAllMyTeamsItem ? (
                <>
                  <DropdownMenuItem
                    disabled={allMyTeamsCount === 0}
                    onSelect={() =>
                      selectActivityIds(
                        activityIdsForUserLeadTeams(sortedData, userTeamIds)
                      )
                    }
                  >
                    All my teams ({allMyTeamsCount})
                  </DropdownMenuItem>
                  {leadTeamsForMenu.length > 0 ? (
                    <DropdownMenuSeparator />
                  ) : null}
                </>
              ) : null}
              {leadTeamsForMenu.map((team) => {
                const count = leadTeamCounts.get(team.id) ?? 0;
                const disabled = isBulkSelectLeadTeamItemDisabled(
                  team.id,
                  count,
                  activeLeadTeamFilterIds
                );
                const disabledByFilter =
                  activeLeadTeamFilterIds.length > 0 &&
                  !activeLeadTeamFilterIds.includes(team.id);

                return (
                  <DropdownMenuItem
                    key={team.id}
                    disabled={disabled}
                    title={
                      disabledByFilter
                        ? LEAD_TEAM_FILTER_DISABLED_TITLE
                        : undefined
                    }
                    onSelect={() =>
                      selectActivityIds(
                        activityIdsForLeadTeam(sortedData, team.id)
                      )
                    }
                  >
                    {bulkSelectLeadTeamMenuItemLabel(team, count)}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
