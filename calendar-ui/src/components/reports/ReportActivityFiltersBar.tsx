import { useCallback, useMemo } from 'react';

import { SYSTEM_ROLES } from '@corpcal/shared/auth';
import { ActivityTableFilters } from '@/components/activity/ActivityTable/ActivityTableFilters';
import type { SortColumnConfig } from '@/components/table/SortDropdown';
import type { ActivityTablePreferences } from '@/hooks/useActivityTablePreferences';
import { useAuth } from '@/hooks/useAuth';
import {
  useActivityStatuses,
  useCategories,
  useEventPlanners,
  useMinistries,
  useOrganizations,
  usePitchRequiredStatuses,
  useTags,
  useTranslationLanguages,
  useTranslationRequiredStatuses,
  useUsers,
} from '@/hooks/useLookups';

/** Kept in sync with ActivityTable sort columns (no shared export to avoid touching ActivityTable). */
const DEFAULT_SORT_KEY = 'startDate';
const DEFAULT_SORT_DIRECTION = 'desc' as const;

const ACTIVITY_SORT_COLUMNS: SortColumnConfig[] = [
  { id: 'activityId', label: 'Activity ID', defaultDirection: 'asc' },
  {
    id: 'activityStatus',
    label: 'Status',
    defaultDirection: 'asc',
    tieBreakers: [
      { key: 'startDate', direction: 'asc' },
      { key: 'startTime', direction: 'asc' },
    ],
  },
  {
    id: 'lookAheadStatus',
    label: 'LA Status',
    defaultDirection: 'asc',
    tieBreakers: [
      { key: 'startDate', direction: 'asc' },
      { key: 'startTime', direction: 'asc' },
    ],
  },
  {
    id: 'startDate',
    label: 'Scheduled date',
    defaultDirection: 'asc',
    tieBreakers: [{ key: 'startTime', direction: 'asc' }],
  },
  { id: 'lastUpdated', label: 'Last updated', defaultDirection: 'desc' },
  { id: 'createdDateTime', label: 'Date created', defaultDirection: 'desc' },
];

export interface ReportActivityFiltersBarProps {
  preferences: ActivityTablePreferences;
  setPreferences: (partial: Partial<ActivityTablePreferences>) => void;
}

/**
 * Activity List filter row only: same {@link ActivityTableFilters} + lookup hooks as ActivityTable,
 * without the table or summary bar.
 */
export function ReportActivityFiltersBar({
  preferences,
  setPreferences,
}: ReportActivityFiltersBarProps) {
  const { user } = useAuth();
  const canSeeDeleted =
    user?.roleName === SYSTEM_ROLES.ADMIN ||
    user?.roleName === SYSTEM_ROLES.SYSTEM_ADMIN;

  const sortKey = preferences.sortKey;
  const sortDirection = preferences.sortDirection;
  const searchKeyword = preferences.searchKeyword;
  const filterState = preferences.filterState;

  const { data: categoriesForFilter = [] } = useCategories();
  const { data: activityStatusesForFilter = [] } = useActivityStatuses();
  const { data: pitchRequiredStatusesForFilter = [] } =
    usePitchRequiredStatuses();
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

  const handleFilterStateChange = useCallback(
    (next: typeof filterState) => {
      setPreferences({ filterState: next });
    },
    [setPreferences]
  );

  const handleSortChange = useCallback(
    (key: string | null, direction: 'asc' | 'desc') => {
      setPreferences({
        sortKey: key ?? DEFAULT_SORT_KEY,
        sortDirection: direction,
      });
    },
    [setPreferences]
  );

  return (
    <ActivityTableFilters
      filterState={filterState}
      onFilterStateChange={handleFilterStateChange}
      searchKeyword={searchKeyword}
      onSearchKeywordChange={(value: string) =>
        setPreferences({ searchKeyword: value })
      }
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
      ministryOptions={ministryOptions}
      organizationOptions={organizationOptions}
      commsContactOptions={commsContactOptions}
      eventPlannerOptions={eventPlannerOptions}
    />
  );
}
