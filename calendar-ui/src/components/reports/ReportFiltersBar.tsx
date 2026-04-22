import { Search, X } from 'lucide-react';
import { useCallback, useMemo } from 'react';

import {
  DEFAULT_ACTIVITY_FILTER_STATE,
  type ActivityFilterState,
} from '@corpcal/shared';
import { SYSTEM_ROLES } from '@corpcal/shared/auth';
import { LeadsFilterPanel } from '@/components/activity/ActivityTable/LeadsFilter';
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
import { useAuth } from '@/hooks/useAuth';
import {
  useActivityStatuses,
  useCategories,
  useEventPlanners,
  useMinistries,
  useOrganizations,
  useTags,
  useTranslationLanguages,
  useTranslationRequiredStatuses,
  useUsers,
} from '@/hooks/useLookups';
import type { ActivityTablePreferences } from '@/hooks/useReportsTablePreferences';

export interface ReportFiltersBarProps {
  preferences: ActivityTablePreferences;
  setPreferences: (partial: Partial<ActivityTablePreferences>) => void;
}

/**
 * Reports filter row: mirrors Activity List filter behavior for the fields shown.
 * Updates `preferences.filterState` using the same keys as {@link ActivityFilterState}.
 */
export function ReportFiltersBar({
  preferences,
  setPreferences,
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

  const { data: categoriesForFilter = [] } = useCategories();
  const { data: activityStatusesForFilter = [] } = useActivityStatuses();
  const { data: tagsForFilter = [] } = useTags();
  const { data: ministriesForFilter = [] } = useMinistries();
  const { data: organizationsForFilter = [] } = useOrganizations();
  const { data: usersForFilter = [] } = useUsers();
  const { data: eventPlannersForFilter = [] } = useEventPlanners();
  const { data: translationLanguagesForFilter = [] } =
    useTranslationLanguages();
  const { data: translationRequiredStatusesForFilter = [] } =
    useTranslationRequiredStatuses();

  const categoryOptions = useMemo(
    () =>
      categoriesForFilter
        .filter((c) => c.isActive)
        .map((c) => ({ value: c.displayName, label: c.displayName })),
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

  const tagOptions = useMemo(
    () =>
      tagsForFilter.map((t) => ({
        value: String(t.id),
        label: t.displayName ?? t.label ?? String(t.id),
      })),
    [tagsForFilter]
  );

  const ministryOptions = useMemo(
    () =>
      ministriesForFilter.map((m) => ({
        value: String(m.id),
        label: m.displayName ?? m.name ?? m.label ?? String(m.id),
      })),
    [ministriesForFilter]
  );
  const organizationOptions = useMemo(
    () =>
      organizationsForFilter.map((o) => ({
        value: String(o.id),
        label: o.displayName ?? o.name ?? o.label ?? String(o.id),
      })),
    [organizationsForFilter]
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
    (values: string[]) => {
      mergeFilterState({ categoryNames: values });
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
      filterState: { ...DEFAULT_ACTIVITY_FILTER_STATE },
    });
  }, [setPreferences]);

  const categorySelectedValues = filterState.categoryNames;
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
          active:
            isDateRangeActive(filterState.dateRange) ||
            filterState.dateConfirmedFilter !== 'any' ||
            filterState.timeConfirmedFilter !== 'any',
          count:
            (isDateRangeActive(filterState.dateRange) ? 1 : 0) +
            (filterState.dateConfirmedFilter !== 'any' ? 1 : 0) +
            (filterState.timeConfirmedFilter !== 'any' ? 1 : 0),
          onClear: () =>
            onFilterStateChange({
              ...filterState,
              dateRange: {
                startDate: '',
                endDate: '',
                noStartDate: false,
                noEndDate: false,
              },
              dateConfirmedFilter: 'any',
              timeConfirmedFilter: 'any',
            }),
          clearAriaLabel: 'Clear Datetime filter',
        },
      },
      {
        key: 'category',
        label: 'Category',
        panel: (
          <FilterCheckboxDropdownPanel
            options={categoryOptions}
            selectedValues={categorySelectedValues}
            onChange={handleCategoryChange}
            emptyMessage="No results"
          />
        ),
        triggerProps: {
          active: categorySelectedValues.length > 0,
          count: categorySelectedValues.length,
          onClear: () => handleCategoryChange([]),
          clearAriaLabel: 'Clear Category filter',
        },
      },
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
        key: 'leads',
        label: 'Leads',
        panel: (
          <LeadsFilterPanel
            filterState={filterState}
            onFilterStateChange={onFilterStateChange}
            ministryOptions={ministryOptions}
            organizationOptions={organizationOptions}
            commsContactOptions={commsContactOptions}
            eventPlannerOptions={eventPlannerOptions}
          />
        ),
        triggerProps: {
          active:
            filterState.leadMinistryIds.length > 0 ||
            filterState.leadOrgIds.length > 0 ||
            filterState.commsContactLeadUserIds.length > 0 ||
            filterState.eventPlannerLeadIds.length > 0,
          count:
            filterState.leadMinistryIds.length +
            filterState.leadOrgIds.length +
            filterState.commsContactLeadUserIds.length +
            filterState.eventPlannerLeadIds.length,
          onClear: () =>
            onFilterStateChange({
              ...filterState,
              leadMinistryIds: [],
              leadOrgIds: [],
              commsContactLeadUserIds: [],
              eventPlannerLeadIds: [],
            }),
          clearAriaLabel: 'Clear Leads filter',
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
    ],
    [
      filterState,
      categoryOptions,
      categorySelectedValues,
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
      ministryOptions,
      organizationOptions,
      commsContactOptions,
      eventPlannerOptions,
    ]
  );

  return (
    <div
      className="mb-4 flex flex-nowrap items-center justify-between gap-8"
      role="search"
      aria-label="Filter report activities by datetime, category, status, leads, translations, tags, and keyword"
    >
      <div className="flex min-w-0 flex-1 items-center">
        <ResponsiveFilterRow
          slots={filterSlots}
          overflowTriggerClassName="h-10"
          onClearAll={handleClearAllFilters}
        />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="relative max-w-md min-w-[240px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Search activities..."
            value={searchKeyword}
            onChange={(e) => setPreferences({ searchKeyword: e.target.value })}
            className="pr-8 pl-8 shadow-none"
            aria-label="Search activities"
          />
          {searchKeyword ? (
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
              onClick={() => setPreferences({ searchKeyword: '' })}
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
