import { ChevronDown, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

import { UnshareActivityModal } from '@/components/activity/activities/UnshareActivityModal';
import { ErrorState } from '@/components/shared';
import { TablePagination } from '@/components/table/TablePagination';
import { TableSummaryBar } from '@/components/table/TableSummaryBar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { ActivityTableCore } from '@/hooks/useActivityTableCore';
import { getFriendlyErrorMessage } from '@/lib/error-toast';
import { MINISTRY_TAB_LEAD_FILTER_CONFLICT_NOTE } from '@/lib/ministry-tab-lead-filter-conflict';

import { ActivityTableEmptyState } from './ActivityTableEmptyState';
import { ActivityTableFilters } from './ActivityTableFilters';
import { ActivityTableLayout } from './ActivityTableLayout';
import {
  ACTIVITY_SORT_COLUMNS,
  DEFAULT_SORT_DIRECTION,
  DEFAULT_SORT_KEY,
} from './activityTableSortColumns';

export interface ActivityTableFrameProps {
  core: ActivityTableCore;
  /** Rendered next to the bulk actions row (grid layout toggle). */
  toolbarTrailing?: ReactNode;
  /** The grid's table element; rendered only when there are rows to show. */
  children: ReactNode;
}

/**
 * Shared chrome for every activity grid layout: filter bar, summary bar, bulk
 * actions, scroll container, pagination, and bulk action dialogs. Grid layouts
 * supply only the table element as children.
 */
export function ActivityTableFrame({
  core,
  toolbarTrailing,
  children,
}: ActivityTableFrameProps) {
  const {
    canBulkSelect,
    canBulkUpdateActivities,
    canBulkShareActivities,
    canUnshare,
    loading,
    error,
    refetchActivities,
    data,
    filteredData,
    sortedData,
    pagination,
    onPaginationChange,
    tableScrollRef,
    selectedActivityIds,
    selectedActivityCount,
    selectedActivities,
    clearSelection,
    bulkDialog,
    setBulkDialog,
    bulkActionPending,
    handleBulkOperation,
    selectedPitchStatusId,
    setSelectedPitchStatusId,
    selectedTagIds,
    setSelectedTagIds,
    selectedTeamIds,
    setSelectedTeamIds,
    selectedFlagTeamId,
    setSelectedFlagTeamId,
    selectedAssigneeIds,
    setSelectedAssigneeIds,
    deleteReason,
    setDeleteReason,
    unshareModalOpen,
    setUnshareModalOpen,
    eligibleBulkUnshareTeams,
    handleBulkUnshareConfirm,
    bulkUnsharePending,
    watchlistIds,
    toggleFavourite,
    filterState,
    searchKeyword,
    sortKey,
    sortDirection,
    handleSortChange,
    handleFilterStateChange,
    handleSearchKeywordChange,
    handleApplySavedFilter,
    handleClearAllCriteria,
    savedFiltersHook,
    activeSavedFilter,
    appliedSavedFilterName,
    appliedFilterTypeLabels,
    filterDetailLines,
    hasActiveCriteria,
    booleanFilters,
    leadFilterConflictsWithMinistryTab,
    favouriteActivityIds,
    pitchFieldVisibility,
    categoryOptions,
    statusOptions,
    pitchRequiredStatusOptions,
    tagOptions,
    leadTeamOptions,
    commsContactOptions,
    eventPlannerOptions,
    translationOptions,
    translationStatusOptions,
    bulkPitchStatusOptions,
    tags,
    teams,
    user,
  } = core;

  const tableSummaryOnClearFilters = hasActiveCriteria
    ? handleClearAllCriteria
    : undefined;

  const filterBar = (
    <ActivityTableFilters
      filterState={filterState}
      onFilterStateChange={handleFilterStateChange}
      searchKeyword={searchKeyword}
      onSearchKeywordChange={handleSearchKeywordChange}
      sortKey={sortKey}
      sortDirection={sortDirection}
      onSortChange={handleSortChange}
      defaultSortKey={DEFAULT_SORT_KEY}
      defaultSortDirection={DEFAULT_SORT_DIRECTION}
      sortColumns={ACTIVITY_SORT_COLUMNS}
      categoryOptions={categoryOptions}
      pitchRequiredStatusOptions={pitchRequiredStatusOptions}
      statusOptions={statusOptions}
      tagOptions={tagOptions}
      translationStatusOptions={translationStatusOptions}
      translationOptions={translationOptions}
      leadTeamOptions={leadTeamOptions}
      commsContactOptions={commsContactOptions}
      eventPlannerOptions={eventPlannerOptions}
      pitchFieldVisibility={pitchFieldVisibility}
      savedFilters={savedFiltersHook}
      activeSavedFilterId={activeSavedFilter?.id ?? null}
      onApplySavedFilter={handleApplySavedFilter}
    />
  );

  const filterSummary = (
    <TableSummaryBar
      count={sortedData.length}
      singularLabel="activity"
      pluralLabel="activities"
      showCount={!canBulkSelect}
      filters={booleanFilters}
      appliedSavedFilterName={appliedSavedFilterName}
      appliedFilterTypeLabels={appliedFilterTypeLabels}
      filterDetailLines={filterDetailLines}
      onClearFilters={tableSummaryOnClearFilters}
    />
  );

  const layoutProps = {
    scrollRef: tableScrollRef,
    count: sortedData.length,
    singularLabel: 'activity',
    pluralLabel: 'activities',
    filters: booleanFilters,
    appliedSavedFilterName,
    appliedFilterTypeLabels,
    filterDetailLines,
    onClearFilters: tableSummaryOnClearFilters,
    showSummary: false,
  };

  if (loading) {
    return (
      <div className="min-w-0 space-y-4">
        {filterBar}
        {filterSummary}
        <ActivityTableLayout {...layoutProps} count={0}>
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            <span className="text-sm text-slate-600">
              Loading activities...
            </span>
          </div>
        </ActivityTableLayout>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10">
        <ErrorState
          title="Failed to load activities"
          message={getFriendlyErrorMessage(error)}
          onRetry={refetchActivities}
        />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="min-w-0 space-y-4">
        {filterBar}
        {filterSummary}
        <ActivityTableLayout {...layoutProps} count={0}>
          <ActivityTableEmptyState
            variant={
              favouriteActivityIds !== undefined
                ? 'no-favourites'
                : hasActiveCriteria
                  ? 'no-filter-match'
                  : 'no-data'
            }
            onClearFilters={
              hasActiveCriteria && favouriteActivityIds === undefined
                ? handleClearAllCriteria
                : undefined
            }
          />
        </ActivityTableLayout>
      </div>
    );
  }

  const bulkActions = canBulkSelect ? (
    <div className="flex items-center gap-5 pb-1 pl-4">
      <span className="text-sm font-medium">
        {selectedActivityCount} of {sortedData.length} activities selected
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={selectedActivityCount === 0 || bulkActionPending}
          >
            Batch actions <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          {canBulkUpdateActivities ? (
            <>
              <DropdownMenuItem
                onSelect={() => {
                  [...selectedActivityIds]
                    .filter((id) => !watchlistIds.includes(id))
                    .forEach((id) => toggleFavourite(id));
                }}
              >
                Add to watchlist
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setBulkDialog('flag')}>
                Flag
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setBulkDialog('issue')}>
                Issue
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Pitch status</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onSelect={() => setBulkDialog('pitch')}>
                    Update pitch status
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              {canBulkShareActivities && (
                <DropdownMenuItem onSelect={() => setBulkDialog('sharing')}>
                  Shared with
                </DropdownMenuItem>
              )}
              {canUnshare && (
                <DropdownMenuItem
                  onSelect={() => setUnshareModalOpen(true)}
                  disabled={eligibleBulkUnshareTeams.length === 0}
                >
                  Unshare
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={() => setBulkDialog('tags')}>
                Tags
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setBulkDialog('review')}>
                Review
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setBulkDialog('delete')}
              >
                Delete
              </DropdownMenuItem>
            </>
          ) : canUnshare ? (
            <DropdownMenuItem
              onSelect={() => setUnshareModalOpen(true)}
              disabled={eligibleBulkUnshareTeams.length === 0}
            >
              Unshare
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      {selectedActivityCount > 0 ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={clearSelection}
        >
          Clear selection
        </Button>
      ) : null}
    </div>
  ) : null;

  return (
    <TooltipProvider delayDuration={400}>
      <div className="min-w-0 space-y-4">
        {filterBar}
        {filterSummary}
        {(bulkActions || toolbarTrailing) && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            {bulkActions ?? <span />}
            {toolbarTrailing}
          </div>
        )}
        <ActivityTableLayout {...layoutProps}>
          {filteredData.length === 0 ? (
            <ActivityTableEmptyState
              variant={
                favouriteActivityIds !== undefined
                  ? 'no-favourites'
                  : leadFilterConflictsWithMinistryTab ||
                      (hasActiveCriteria && searchKeyword.trim() === '')
                    ? 'no-filter-match'
                    : searchKeyword.trim() !== ''
                      ? 'no-search-match'
                      : hasActiveCriteria
                        ? 'no-filter-match'
                        : 'no-data'
              }
              conflictNote={
                leadFilterConflictsWithMinistryTab
                  ? MINISTRY_TAB_LEAD_FILTER_CONFLICT_NOTE
                  : undefined
              }
              onClearFilters={
                hasActiveCriteria && favouriteActivityIds === undefined
                  ? handleClearAllCriteria
                  : undefined
              }
            />
          ) : (
            children
          )}
        </ActivityTableLayout>

        {filteredData.length > 0 && (
          <TablePagination
            totalItems={sortedData.length}
            page={pagination.pageIndex + 1}
            pageSize={pagination.pageSize}
            onPageChange={(page) =>
              onPaginationChange((prev) => ({ ...prev, pageIndex: page - 1 }))
            }
            onPageSizeChange={(pageSize) =>
              onPaginationChange((prev) => ({
                ...prev,
                pageSize,
                pageIndex: 0,
              }))
            }
            scrollContainerRef={tableScrollRef}
          />
        )}

        <Dialog
          open={bulkDialog !== null}
          onOpenChange={(open) => !open && setBulkDialog(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {bulkDialog === 'review' &&
                  'Mark selected activities reviewed?'}
                {bulkDialog === 'pitch' && 'Set pitch status'}
                {bulkDialog === 'issue' &&
                  'Mark selected activities as issues?'}
                {bulkDialog === 'tags' && 'Replace tags'}
                {bulkDialog === 'sharing' && 'Add shared-with teams'}
                {bulkDialog === 'flag' && 'Flag selected activities'}
                {bulkDialog === 'delete' && 'Delete selected activities?'}
              </DialogTitle>
              <DialogDescription>
                {bulkDialog === 'sharing'
                  ? `Adds teams to the Shared with list for ${selectedActivityCount} selected activit${selectedActivityCount === 1 ? 'y' : 'ies'} without removing existing shares.`
                  : `This updates ${selectedActivityCount} selected activit${selectedActivityCount === 1 ? 'y' : 'ies'}.`}
              </DialogDescription>
            </DialogHeader>
            {bulkDialog === 'pitch' && (
              <Select
                value={selectedPitchStatusId}
                onValueChange={setSelectedPitchStatusId}
              >
                <SelectTrigger aria-label="Pitch status">
                  <SelectValue placeholder="Choose a pitch status" />
                </SelectTrigger>
                <SelectContent>
                  {bulkPitchStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {bulkDialog === 'tags' && (
              <div className="max-h-56 space-y-2 overflow-y-auto">
                {tags.map((tag) => (
                  <label
                    key={tag.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={selectedTagIds.includes(tag.id)}
                      onCheckedChange={(checked) =>
                        setSelectedTagIds((current) =>
                          checked === true
                            ? [...current, tag.id]
                            : current.filter((id) => id !== tag.id)
                        )
                      }
                    />
                    {tag.displayName ?? tag.label ?? String(tag.id)}
                  </label>
                ))}
              </div>
            )}
            {bulkDialog === 'sharing' && (
              <div className="max-h-56 space-y-2 overflow-y-auto">
                {teams.map((team) => (
                  <label
                    key={team.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={selectedTeamIds.includes(team.id)}
                      onCheckedChange={(checked) =>
                        setSelectedTeamIds((current) =>
                          checked === true
                            ? [...current, team.id]
                            : current.filter((id) => id !== team.id)
                        )
                      }
                    />
                    {team.name}
                  </label>
                ))}
              </div>
            )}
            {bulkDialog === 'flag' && (
              <div className="space-y-3">
                <Select
                  value={selectedFlagTeamId}
                  onValueChange={(value) => {
                    setSelectedFlagTeamId(value);
                    setSelectedAssigneeIds([]);
                  }}
                >
                  <SelectTrigger aria-label="Flag team">
                    <SelectValue placeholder="Choose one of your teams" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams
                      .filter((team) => (user?.teamIds ?? []).includes(team.id))
                      .map((team) => (
                        <SelectItem key={team.id} value={String(team.id)}>
                          {team.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {selectedFlagTeamId && user && (
                  <div className="max-h-48 space-y-2 overflow-y-auto">
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={selectedAssigneeIds.includes(user.id)}
                        onCheckedChange={(checked) =>
                          setSelectedAssigneeIds(
                            checked === true ? [user.id] : []
                          )
                        }
                      />
                      Assign to me ({user.displayName})
                    </label>
                  </div>
                )}
              </div>
            )}
            {bulkDialog === 'delete' && (
              <Textarea
                value={deleteReason}
                onChange={(event) => setDeleteReason(event.target.value)}
                placeholder="Provide a reason for deleting these activities"
                maxLength={1000}
              />
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={bulkActionPending}
                onClick={() => setBulkDialog(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={
                  bulkActionPending ||
                  (bulkDialog === 'pitch' && !selectedPitchStatusId) ||
                  (bulkDialog === 'flag' &&
                    (!selectedFlagTeamId ||
                      selectedAssigneeIds.length === 0)) ||
                  (bulkDialog === 'delete' && deleteReason.trim().length < 10)
                }
                onClick={() => void handleBulkOperation()}
              >
                {bulkActionPending ? 'Updating...' : 'Confirm'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <UnshareActivityModal
          open={unshareModalOpen}
          onOpenChange={setUnshareModalOpen}
          mode="bulk"
          activityIds={[...selectedActivityIds]}
          activities={selectedActivities.map((row) => ({
            sharedWithTeamIds: row.sharedWithTeamIds,
            visibility: row.visibility,
          }))}
          eligibleTeams={eligibleBulkUnshareTeams}
          onConfirm={(teamId) => void handleBulkUnshareConfirm(teamId)}
          isPending={bulkUnsharePending}
        />
      </div>
    </TooltipProvider>
  );
}
