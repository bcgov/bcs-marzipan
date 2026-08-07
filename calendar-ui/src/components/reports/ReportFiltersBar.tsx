import { Search, X } from 'lucide-react';
import { useCallback, useMemo, type ReactNode } from 'react';

import type { ActivityFilterState } from '@corpcal/shared';
import { SYSTEM_ROLES } from '@corpcal/shared/auth';
import type { SavedFilterResponse } from '@corpcal/shared/schemas';
import { buildIdArrayFilterSlot } from '@/components/activity/ActivityTable/ActivityTableFilters';
import { CategoriesFilterPanel } from '@/components/activity/ActivityTable/CategoriesFilter';
import { LeadTeamFilterPanel } from '@/components/activity/ActivityTable/LeadTeamFilterPanel';
import { LookAheadFilterPanel } from '@/components/activity/ActivityTable/LookAheadFilter';
import { PitchFilterPanel } from '@/components/activity/ActivityTable/PitchFilter';
import { ScheduledDateFilterPanel } from '@/components/activity/ActivityTable/ScheduledDateFilter';
import { isDateRangeActive } from '@/components/activity/ActivityTable/ScheduledDateRangeFields';
import { TagsFilterPanel } from '@/components/activity/ActivityTable/TagsFilter';
import { TranslationsFilterPanel } from '@/components/activity/ActivityTable/TranslationsFilter';
import {
  ResponsiveFilterRow,
  type ResponsiveFilterSlot,
} from '@/components/shared/ResponsiveFilterRow';
import { Input } from '@/components/ui/input';
import { FilterCheckboxDropdownPanel } from '@/components/users/FilterCheckboxDropdown';
import { useActivityPitchFieldVisibility } from '@/hooks/useActivityTableFilterLookups';
import { useAuth } from '@/hooks/useAuth';
import {
  useActivityStatuses,
  useCategories,
  useEventPlanners,
  usePitchRequiredStatuses,
  useTags,
  useTeams,
  useTranslationLanguages,
  useTranslationRequiredStatuses,
  useUsers,
} from '@/hooks/useLookups';
import type { ActivityTablePreferences } from '@/hooks/useReportsTablePreferences';
import type { UseSavedFiltersReturn } from '@/hooks/useSavedFilters';
import type { ActivityFilterSummaryContext } from '@/lib/activity-filter-summary';
import analytics from '@/lib/analytics';
import { formatLeadTeamSelectLabel } from '@/lib/lead-team-display-label';
import {
  buildReportBaselineDateFilterPatch,
  buildReportClearFilterState,
  hasReportClearableFiltersActive,
} from '@/lib/report-filter-state';
import type { ValidFilterLookups } from '@/lib/savedFilterSanitize';

export interface ReportFiltersBarProps {
  reportName: string;
  preferences: ActivityTablePreferences;
  setPreferences: (partial: Partial<ActivityTablePreferences>) => void;
  onSearchSubmitted?: () => void;
  onSearchCleared?: () => void;
  /** Optional controls on the row below the search field (e.g. 30/60/90 month tabs). */
  printPreviewRowLeading?: ReactNode;
  /** Optional trailing controls on the same row (e.g. Customize, print preview). */
  printPreviewRowTrailing?: ReactNode;
  savedFilters?: UseSavedFiltersReturn;
  onApplySavedFilter?: (
    filterState: ActivityFilterState,
    searchKeyword: string,
    appliedFrom: { id: number; name: string }
  ) => void;
  activeSavedFilterId?: number | null;
  filterSummaryContext?: ActivityFilterSummaryContext;
  parseSavedFilterForDraft?: (savedFilter: SavedFilterResponse) => {
    filterState: ActivityFilterState;
    searchKeyword: string;
  };
  validFilterLookups?: ValidFilterLookups;
}

/**
 * Reports filter row: mirrors Activity List filter behavior for the fields shown.
 * Updates `preferences.filterState` using the same keys as {@link ActivityFilterState}.
 */
export function ReportFiltersBar({
  reportName,
  preferences,
  setPreferences,
  onSearchSubmitted,
  onSearchCleared,
  printPreviewRowLeading,
  printPreviewRowTrailing,
  savedFilters,
  onApplySavedFilter,
  activeSavedFilterId = null,
  filterSummaryContext,
  parseSavedFilterForDraft,
  validFilterLookups,
}: ReportFiltersBarProps) {
  const { user } = useAuth();
  const canSeeDeleted =
    user?.roleName === SYSTEM_ROLES.ADMIN ||
    user?.roleName === SYSTEM_ROLES.SYSTEM_ADMIN;

  const filterState = preferences.filterState;
  const searchKeyword = preferences.searchKeyword;

  const mergeFilterState = useCallback(
    (patch: Partial<ActivityFilterState>) => {
      setPreferences({
        filterState: {
          ...preferences.filterState,
          ...patch,
        },
      });
    },
    [setPreferences, preferences.filterState]
  );

  const onFilterStateChange = useCallback(
    (next: ActivityFilterState) => {
      setPreferences({ filterState: next });
    },
    [setPreferences]
  );

  const pitchFieldVisibility = useActivityPitchFieldVisibility();
  const canViewPitchStatus = pitchFieldVisibility.canViewPitchStatus;
  const canViewPitchDate = pitchFieldVisibility.canViewPitchDate;
  const showPitchFilter = canViewPitchStatus || canViewPitchDate;

  const { data: categoriesForFilter = [] } = useCategories();
  const { data: activityStatusesForFilter = [] } = useActivityStatuses();
  const { data: pitchRequiredStatusesForFilter = [] } =
    usePitchRequiredStatuses();
  const { data: tagsForFilter = [] } = useTags();
  const { data: usersForFilter = [] } = useUsers();
  const { data: eventPlannersForFilter = [] } = useEventPlanners();
  const { data: teamsForFilter = [] } = useTeams();
  const { data: translationLanguagesForFilter = [] } =
    useTranslationLanguages();
  const { data: translationRequiredStatusesForFilter = [] } =
    useTranslationRequiredStatuses();

  const categoryOptions = useMemo(
    () =>
      categoriesForFilter
        .filter((c) => c.isActive)
        .map((c) => ({
          value: String(c.id),
          label: c.displayName ?? c.name,
        })),
    [categoriesForFilter]
  );

  const statusOptions = useMemo(
    () =>
      activityStatusesForFilter
        .filter((s) => canSeeDeleted || s.name !== 'deleted')
        .map((s) => ({
          value: String(s.id),
          label: s.displayName,
        })),
    [activityStatusesForFilter, canSeeDeleted]
  );

  const pitchRequiredStatusOptions = useMemo(
    () =>
      pitchRequiredStatusesForFilter.map((s) => ({
        value: s.displayName,
        label: s.displayName,
      })),
    [pitchRequiredStatusesForFilter]
  );

  const tagOptions = useMemo(
    () =>
      tagsForFilter.map((t) => ({
        value: String(t.id),
        label: t.displayName ?? t.label ?? String(t.id),
      })),
    [tagsForFilter]
  );

  const leadTeamOptions = useMemo(
    () =>
      teamsForFilter.map((t) => ({
        value: String(t.id),
        label:
          t.ministryId != null
            ? formatLeadTeamSelectLabel(t)
            : (t.displayName ?? t.name ?? String(t.id)),
        ministryId: t.ministryId ?? null,
      })),
    [teamsForFilter]
  );
  const commsContactOptions = useMemo(
    () =>
      usersForFilter.map((u) => ({
        value: String(u.id),
        label: u.name ?? u.email ?? String(u.id),
      })),
    [usersForFilter]
  );
  const eventPlannerOptions = useMemo(
    () =>
      eventPlannersForFilter.map((ep) => ({
        value: String(ep.id),
        label: ep.label ?? String(ep.id),
      })),
    [eventPlannersForFilter]
  );
  const translationOptions = useMemo(
    () =>
      translationLanguagesForFilter.map((l) => {
        const displayLabel = l.shortcode
          ? `${l.displayName} (${l.shortcode.toUpperCase()})`
          : (l.displayName ?? String(l.id));
        return { value: String(l.id), label: displayLabel };
      }),
    [translationLanguagesForFilter]
  );
  const translationStatusOptions = useMemo(
    () =>
      translationRequiredStatusesForFilter.map((s) => ({
        value: String(s.id),
        label: s.displayName ?? s.name ?? String(s.id),
      })),
    [translationRequiredStatusesForFilter]
  );

  const handleDateRangeChange = useCallback(
    (dateRange: ActivityFilterState['dateRange']) => {
      mergeFilterState({ dateRange });
    },
    [mergeFilterState]
  );

  const handleCategoryChange = useCallback(
    (categoryIds: number[]) => {
      mergeFilterState({ categoryIds });
    },
    [mergeFilterState]
  );

  const handleStatusChange = useCallback(
    (values: string[]) => {
      mergeFilterState({
        activityStatusIds: values
          .map((v) => parseInt(v, 10))
          .filter((n) => !Number.isNaN(n)),
      });
    },
    [mergeFilterState]
  );

  const handleTagIdsChange = useCallback(
    (tagIds: number[]) => {
      mergeFilterState({ tagIds });
    },
    [mergeFilterState]
  );

  const handleTranslationRequiredStatusIdsChange = useCallback(
    (translationRequiredStatusIds: number[]) => {
      mergeFilterState({ translationRequiredStatusIds });
    },
    [mergeFilterState]
  );

  const handleTranslationLanguageIdsChange = useCallback(
    (translationLanguageIds: number[]) => {
      mergeFilterState({ translationLanguageIds });
    },
    [mergeFilterState]
  );

  const handleClearAllFilters = useCallback(() => {
    setPreferences({
      filterState: buildReportClearFilterState(reportName),
    });
  }, [reportName, setPreferences]);

  const hasClearableFilters = useMemo(
    () =>
      hasReportClearableFiltersActive(filterState, reportName, searchKeyword),
    [filterState, reportName, searchKeyword]
  );

  const baselineDatePatch = useMemo(
    () => buildReportBaselineDateFilterPatch(reportName),
    [reportName]
  );

  const dateConfirmedActive = filterState.dateConfirmedFilter !== 'any';
  const timeConfirmedActive = filterState.timeConfirmedFilter !== 'any';
  const dateRangeActive = isDateRangeActive(filterState.dateRange);

  const handleSearchEnter = useCallback(() => {
    try {
      analytics.trackReportSearchSubmitted({
        report_name: reportName,
        search_present: searchKeyword.trim().length > 0,
        search_length_bucket: analytics.bucketSearchLength(searchKeyword),
        active_filter_count: analytics.countActiveReportFilterCriteria(
          filterState,
          reportName
        ),
        timestamp_client: new Date().toISOString(),
        category_count: (filterState.categoryIds || []).length,
        status_count: (filterState.activityStatusIds || []).length,
        tag_count: (filterState.tagIds || []).length,
        date_range_active: isDateRangeActive(filterState.dateRange),
        date_confirmed_filter: filterState.dateConfirmedFilter || 'any',
        time_confirmed_filter: filterState.timeConfirmedFilter || 'any',
      });
    } catch {
      /* ignore */
    }
    onSearchSubmitted?.();
  }, [filterState, onSearchSubmitted, reportName, searchKeyword]);

  const handleClearSearchClick = useCallback(() => {
    const activeFilterCountBeforeClear =
      analytics.countActiveReportFilterCriteria(filterState, reportName);
    try {
      analytics.trackReportSearchCleared({
        report_name: reportName,
        had_search_text: searchKeyword.trim().length > 0,
        had_filters: activeFilterCountBeforeClear > 0,
        active_filter_count_before_clear: activeFilterCountBeforeClear,
      });
    } catch {
      /* ignore */
    }
    onSearchCleared?.();
    setPreferences({ searchKeyword: '' });
  }, [filterState, onSearchCleared, reportName, searchKeyword, setPreferences]);

  const categorySelectedIds = filterState.categoryIds;
  const statusSelectedValues = filterState.activityStatusIds.map(String);

  const filterSlots = useMemo<ResponsiveFilterSlot[]>(
    () => [
      {
        key: 'scheduledDate',
        label: 'Date',
        panel: (
          <ScheduledDateFilterPanel
            value={filterState.dateRange}
            onChange={handleDateRangeChange}
            filterState={filterState}
            onFilterStateChange={onFilterStateChange}
          />
        ),
        triggerProps: {
          active: dateRangeActive || dateConfirmedActive || timeConfirmedActive,
          count:
            (dateRangeActive ? 1 : 0) +
            (dateConfirmedActive ? 1 : 0) +
            (timeConfirmedActive ? 1 : 0),
          onClear: () =>
            onFilterStateChange({
              ...filterState,
              ...baselineDatePatch,
            }),
          clearAriaLabel: 'Clear Datetime filter',
        },
      },
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
      buildIdArrayFilterSlot(
        'commsContact',
        'Comms contact',
        'commsContactLeadUserIds',
        commsContactOptions,
        filterState,
        onFilterStateChange,
        'Search comms contacts...',
        'Search comms contacts'
      ),
      {
        key: 'status',
        label: 'Status',
        panel: (
          <FilterCheckboxDropdownPanel
            options={statusOptions}
            selectedValues={statusSelectedValues}
            onChange={handleStatusChange}
            emptyMessage="No results"
          />
        ),
        triggerProps: {
          active: statusSelectedValues.length > 0,
          count: statusSelectedValues.length,
          onClear: () => handleStatusChange([]),
          clearAriaLabel: 'Clear Status filter',
        },
      },
      {
        key: 'lookAhead',
        label: 'Look Ahead',
        panel: (
          <LookAheadFilterPanel
            filterState={filterState}
            onFilterStateChange={onFilterStateChange}
          />
        ),
        triggerProps: {
          active:
            filterState.lookAheadStatusValues.length > 0 ||
            filterState.lookAheadSectionValues.length > 0,
          count:
            filterState.lookAheadStatusValues.length +
            filterState.lookAheadSectionValues.length,
          onClear: () =>
            onFilterStateChange({
              ...filterState,
              lookAheadStatusValues: [],
              lookAheadSectionValues: [],
            }),
          clearAriaLabel: 'Clear Look Ahead filter',
        },
      },
      {
        key: 'tags',
        label: 'Tags',
        panel: (
          <TagsFilterPanel
            tagOptions={tagOptions}
            selectedTagIds={filterState.tagIds}
            onTagIdsChange={handleTagIdsChange}
          />
        ),
        triggerProps: {
          active: filterState.tagIds.length > 0,
          count: filterState.tagIds.length,
          onClear: () => handleTagIdsChange([]),
          clearAriaLabel: 'Clear Tags filter',
        },
      },
      {
        key: 'translations',
        label: 'Translations',
        panel: (
          <TranslationsFilterPanel
            translationStatusOptions={translationStatusOptions}
            translationOptions={translationOptions}
            selectedStatusIds={filterState.translationRequiredStatusIds}
            selectedLanguageIds={filterState.translationLanguageIds}
            onStatusIdsChange={handleTranslationRequiredStatusIdsChange}
            onLanguageIdsChange={handleTranslationLanguageIdsChange}
          />
        ),
        triggerProps: {
          active:
            filterState.translationRequiredStatusIds.length > 0 ||
            filterState.translationLanguageIds.length > 0,
          count:
            filterState.translationRequiredStatusIds.length +
            filterState.translationLanguageIds.length,
          onClear: () =>
            onFilterStateChange({
              ...filterState,
              translationRequiredStatusIds: [],
              translationLanguageIds: [],
            }),
          clearAriaLabel: 'Clear Translations filter',
        },
      },
      ...(showPitchFilter
        ? [
            {
              key: 'pitch',
              label: 'Pitch',
              panel: (
                <PitchFilterPanel
                  filterState={filterState}
                  onFilterStateChange={onFilterStateChange}
                  pitchRequiredStatusOptions={pitchRequiredStatusOptions}
                  canViewPitchStatus={canViewPitchStatus}
                  canViewPitchDate={canViewPitchDate}
                />
              ),
              triggerProps: {
                active: (() => {
                  const pitchDateRangeActive =
                    filterState.pitchDateFilter.kind === 'scheduled' &&
                    isDateRangeActive(filterState.pitchDateFilter.dateRange);
                  const statusPart =
                    canViewPitchStatus &&
                    filterState.pitchRequiredStatusNames.length > 0;
                  const datePart =
                    canViewPitchDate &&
                    (filterState.pitchDateFilter.kind !== 'any' ||
                      pitchDateRangeActive);
                  return statusPart || datePart;
                })(),
                count: (() => {
                  const pitchDateRangeActive =
                    filterState.pitchDateFilter.kind === 'scheduled' &&
                    isDateRangeActive(filterState.pitchDateFilter.dateRange);
                  return (
                    (canViewPitchStatus
                      ? filterState.pitchRequiredStatusNames.length
                      : 0) +
                    (canViewPitchDate &&
                    (filterState.pitchDateFilter.kind !== 'any' ||
                      pitchDateRangeActive)
                      ? 1
                      : 0)
                  );
                })(),
                onClear: () =>
                  onFilterStateChange({
                    ...filterState,
                    pitchRequiredStatusNames: [],
                    pitchDateFilter: { kind: 'any' },
                  }),
                clearAriaLabel: 'Clear Pitch filter',
              },
            } satisfies ResponsiveFilterSlot,
          ]
        : []),
      buildIdArrayFilterSlot(
        'eventPlanner',
        'Event planner',
        'eventPlannerLeadIds',
        eventPlannerOptions,
        filterState,
        onFilterStateChange,
        'Search event planners...',
        'Search event planners'
      ),
    ],
    [
      filterState,
      categoryOptions,
      categorySelectedIds,
      handleCategoryChange,
      handleDateRangeChange,
      handleStatusChange,
      handleTagIdsChange,
      handleTranslationLanguageIdsChange,
      handleTranslationRequiredStatusIdsChange,
      onFilterStateChange,
      statusOptions,
      statusSelectedValues,
      tagOptions,
      translationOptions,
      translationStatusOptions,
      leadTeamOptions,
      commsContactOptions,
      eventPlannerOptions,
      baselineDatePatch,
      dateConfirmedActive,
      dateRangeActive,
      timeConfirmedActive,
      pitchRequiredStatusOptions,
      showPitchFilter,
      canViewPitchStatus,
      canViewPitchDate,
    ]
  );

  return (
    <div
      className="flex flex-col"
      role="search"
      aria-label="Filter report activities by datetime, category, look ahead, status, leads, translations, tags, pitch, and keyword"
    >
      <div className="mb-4 flex flex-nowrap items-center justify-between gap-8">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="relative max-w-md min-w-[240px] shrink-0">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search activities..."
              value={searchKeyword}
              onChange={(e) =>
                setPreferences({ searchKeyword: e.target.value })
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearchEnter();
                }
              }}
              className="pr-8 pl-8 shadow-none"
              aria-label="Search activities"
            />
            {searchKeyword ? (
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
                onClick={handleClearSearchClick}
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
          <ResponsiveFilterRow
            slots={filterSlots}
            overflowTriggerClassName="h-10"
            onClearAll={hasClearableFilters ? handleClearAllFilters : undefined}
            savedFilters={savedFilters}
            filterState={filterState}
            searchKeyword={searchKeyword}
            onApplySavedFilter={onApplySavedFilter}
            activeSavedFilterId={activeSavedFilterId}
            filterSummaryContext={filterSummaryContext}
            parseSavedFilterForDraft={parseSavedFilterForDraft}
            validFilterLookups={validFilterLookups}
          />
        </div>
      </div>
      {printPreviewRowLeading || printPreviewRowTrailing ? (
        <div className="mb-2 flex h-9 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center">
            {printPreviewRowLeading}
          </div>
          {printPreviewRowTrailing ? (
            <div className="flex shrink-0 items-center gap-4">
              {printPreviewRowTrailing}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
