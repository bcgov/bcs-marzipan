import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useCallback, useMemo } from 'react';

import type { ActivityFilterState } from '@corpcal/shared';
import { CategoriesFilterPanel } from '@/components/activity/ActivityTable/CategoriesFilter';
import { LeadTeamFilterPanel } from '@/components/activity/ActivityTable/LeadTeamFilterPanel';
import { TableFilterSummary } from '@/components/table/TableSummaryBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-muted-foreground h-9 w-fit gap-2 px-2"
        aria-expanded={expanded}
        onClick={() => onExpandedChange(!expanded)}
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filter activities
        {activeCount > 0 ? (
          <span className="bg-primary text-primary-foreground rounded-full px-1.5 text-xs">
            {activeCount}
          </span>
        ) : null}
      </Button>

      {expanded ? (
        <div
          className="border-border flex flex-col gap-4 rounded-md border bg-white p-4"
          role="search"
          aria-label="Filter Look Ahead activities"
        >
          <div className="relative max-w-md">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search activities..."
              value={searchKeyword}
              onChange={(e) => onSearchKeywordChange(e.target.value)}
              className="pr-8 pl-8 shadow-none"
              aria-label="Search activities"
            />
            {searchKeyword ? (
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
                onClick={() => onSearchKeywordChange('')}
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <CategoriesFilterPanel
              categoryOptions={categoryOptions}
              selectedCategoryIds={filterState.categoryIds}
              onCategoryIdsChange={handleCategoryChange}
            />
            <LeadTeamFilterPanel
              teamOptions={leadTeamOptions}
              selectedTeamIds={filterState.leadTeamIds}
              onSelectedTeamIdsChange={(leadTeamIds) =>
                onFilterStateChange({ ...filterState, leadTeamIds })
              }
            />
          </div>
        </div>
      ) : null}

      <TableFilterSummary
        appliedFilterTypeLabels={appliedFilterTypeLabels}
        filterDetailLines={[]}
        onClearFilters={activeCount > 0 ? onResetCuratedFilters : undefined}
        className={cn(activeCount === 0 && !expanded && 'min-h-0 opacity-0')}
      />
    </div>
  );
}
