import { SlidersHorizontal } from 'lucide-react';
import { useCallback, useMemo, type ReactNode } from 'react';

import type { ActivityFilterState } from '@corpcal/shared';
import { CategoriesFilterPanel } from '@/components/activity/ActivityTable/CategoriesFilter';
import { LeadTeamFilterPanel } from '@/components/activity/ActivityTable/LeadTeamFilterPanel';
import { HistorySearchInput } from '@/components/history/HistorySearchInput';
import {
  ResponsiveFilterRow,
  type ResponsiveFilterSlot,
} from '@/components/shared/ResponsiveFilterRow';
import { TableFilterSummary } from '@/components/table/TableSummaryBar';
import { Button } from '@/components/ui/button';
import { useCategories, useTeams } from '@/hooks/useLookups';
import { formatLeadTeamSelectLabel } from '@/lib/lead-team-display-label';
import { cn } from '@/lib/utils';

export interface LookAheadCuratedFiltersProps {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  searchKeyword: string;
  onSearchKeywordChange: (value: string) => void;
  filterState: ActivityFilterState;
  onFilterStateChange: (next: ActivityFilterState) => void;
  onResetCuratedFilters: () => void;
  /** Right-aligned controls on the filter row (e.g. Exec detail). */
  trailingContent?: ReactNode;
}

function curatedActiveFilterCount(
  searchKeyword: string,
  filterState: ActivityFilterState
): number {
  let count = 0;
  if (searchKeyword.trim()) count += 1;
  if (filterState.categoryIds.length > 0) count += 1;
  if (filterState.leadTeamIds.length > 0) count += 1;
  return count;
}

export function LookAheadCuratedFilters({
  expanded,
  onExpandedChange,
  searchKeyword,
  onSearchKeywordChange,
  filterState,
  onFilterStateChange,
  onResetCuratedFilters,
  trailingContent,
}: LookAheadCuratedFiltersProps) {
  const { data: categories = [] } = useCategories();
  const { data: teams = [] } = useTeams();

  const categoryOptions = useMemo(
    () =>
      categories
        .filter((c) => c.isActive)
        .map((c) => ({
          value: String(c.id),
          label: c.displayName ?? c.name,
        })),
    [categories]
  );

  const leadTeamOptions = useMemo(
    () =>
      teams.map((t) => ({
        value: String(t.id),
        label:
          t.primaryOrganizationId != null
            ? formatLeadTeamSelectLabel(t)
            : (t.displayName ?? t.name ?? String(t.id)),
        primaryOrganizationId: t.primaryOrganizationId ?? null,
      })),
    [teams]
  );

  const activeCount = curatedActiveFilterCount(searchKeyword, filterState);

  const appliedFilterTypeLabels = useMemo(() => {
    const labels: string[] = [];
    if (searchKeyword.trim()) labels.push('Keyword');
    if (filterState.categoryIds.length > 0) labels.push('Category');
    if (filterState.leadTeamIds.length > 0) labels.push('Lead');
    return labels;
  }, [
    filterState.categoryIds.length,
    filterState.leadTeamIds.length,
    searchKeyword,
  ]);

  const handleCategoryChange = useCallback(
    (categoryIds: number[]) => {
      onFilterStateChange({ ...filterState, categoryIds });
    },
    [filterState, onFilterStateChange]
  );

  const categorySelectedIds = filterState.categoryIds;

  const filterSlots = useMemo<ResponsiveFilterSlot[]>(
    () => [
      {
        key: 'category',
        label: 'Category',
        panel: (
          <CategoriesFilterPanel
            categoryOptions={categoryOptions}
            selectedCategoryIds={categorySelectedIds}
            onCategoryIdsChange={handleCategoryChange}
          />
        ),
        triggerProps: {
          active: categorySelectedIds.length > 0,
          count: categorySelectedIds.length,
          onClear: () => handleCategoryChange([]),
          clearAriaLabel: 'Clear Category filter',
        },
      },
      {
        key: 'lead',
        label: 'Lead',
        panel: (
          <LeadTeamFilterPanel
            teamOptions={leadTeamOptions}
            selectedTeamIds={filterState.leadTeamIds}
            onSelectedTeamIdsChange={(leadTeamIds) =>
              onFilterStateChange({ ...filterState, leadTeamIds })
            }
          />
        ),
        triggerProps: {
          active: filterState.leadTeamIds.length > 0,
          count: filterState.leadTeamIds.length,
          onClear: () =>
            onFilterStateChange({ ...filterState, leadTeamIds: [] }),
          clearAriaLabel: 'Clear Lead filter',
        },
      },
    ],
    [
      categoryOptions,
      categorySelectedIds,
      filterState,
      handleCategoryChange,
      leadTeamOptions,
      onFilterStateChange,
    ]
  );

  const filterToggleLabel = expanded ? 'Hide filters' : 'Filter';

  const filterToggleButton = (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        'text-muted-foreground h-9 shrink-0 gap-2 px-2',
        !expanded && 'w-fit'
      )}
      aria-expanded={expanded}
      aria-label={filterToggleLabel}
      onClick={() => onExpandedChange(!expanded)}
    >
      <SlidersHorizontal className="h-4 w-4" />
      {filterToggleLabel}
      {activeCount > 0 ? (
        <span className="bg-primary text-primary-foreground rounded-full px-1.5 text-xs">
          {activeCount}
        </span>
      ) : null}
    </Button>
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex min-w-0 items-center gap-2">
        {expanded ? (
          <div
            className="flex min-w-0 flex-1 items-center gap-2"
            role="search"
            aria-label="Filter Look Ahead activities"
          >
            <HistorySearchInput
              value={searchKeyword}
              onChange={onSearchKeywordChange}
              placeholder="Search activities..."
              ariaLabel="Search activities"
            />
            <ResponsiveFilterRow
              slots={filterSlots}
              overflowTriggerClassName="h-10"
              onClearAll={activeCount > 0 ? onResetCuratedFilters : undefined}
            />
            {filterToggleButton}
          </div>
        ) : (
          <div className="min-w-0 flex-1">{filterToggleButton}</div>
        )}
        {trailingContent ? (
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {trailingContent}
          </div>
        ) : null}
      </div>

      <TableFilterSummary
        appliedFilterTypeLabels={appliedFilterTypeLabels}
        filterDetailLines={[]}
        onClearFilters={activeCount > 0 ? onResetCuratedFilters : undefined}
        className={cn(activeCount === 0 && !expanded && 'min-h-0 opacity-0')}
      />
    </div>
  );
}
