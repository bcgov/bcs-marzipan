import { useCallback, useMemo } from 'react';

import { DEFAULT_ACTIVITY_FILTER_STATE } from '@corpcal/shared';
import { canViewActivityFieldScope } from '@corpcal/shared/auth';
import { hasAnyActivityTableFilterActive } from '@/components/activity/ActivityTable/ActivityTableFilters';
import type {
  BooleanFilter,
  TableSummaryFilterDetailLine,
} from '@/components/table/TableSummaryBar';
import { useAuth } from '@/hooks/useAuth';
import {
  useActivityStatuses,
  useEventPlanners,
  useMinistries,
  useOrganizations,
  usePitchRequiredStatuses,
  useTags,
  useTranslationLanguages,
  useTranslationRequiredStatuses,
  useUsers,
} from '@/hooks/useLookups';
import type { ActivityTablePreferences } from '@/hooks/useReportsTablePreferences';
import {
  buildActivityFilterSummaryLinesForDetailPopover,
  getAppliedActivityFilterTypeLabels,
  type ActivityFilterSummaryContext,
} from '@/lib/activity-filter-summary';

export interface UseActivityTableSummaryBarStateOptions {
  preferences: ActivityTablePreferences;
  setPreferences: (partial: Partial<ActivityTablePreferences>) => void;
  canSeeDeleted: boolean;
  /** When set, toggling show completed/deleted clears the saved filter selection. */
  onClearSavedFilter?: () => void;
}

export interface ActivityTableSummaryBarState {
  filters: BooleanFilter[];
  appliedFilterTypeLabels: string[];
  filterDetailLines: TableSummaryFilterDetailLine[];
  onClearFilters: (() => void) | undefined;
  singularLabel: 'entry';
  pluralLabel: 'entries';
}

export function useActivityTableSummaryBarState({
  preferences,
  setPreferences,
  canSeeDeleted,
  onClearSavedFilter,
}: UseActivityTableSummaryBarStateOptions): ActivityTableSummaryBarState {
  const { user } = useAuth();
  const filterState = preferences.filterState;
  const searchKeyword = preferences.searchKeyword;
  const showCompleted = preferences.showCompleted;
  const showDeleted = preferences.showDeleted;

  const pitchFieldVisibility = useMemo(() => {
    if (!user) {
      return { canViewPitchStatus: false, canViewPitchDate: false };
    }
    const ctx = { permissions: user.permissions, roleName: user.roleName };
    return {
      canViewPitchStatus: canViewActivityFieldScope(ctx, 'pitchStatus'),
      canViewPitchDate: canViewActivityFieldScope(ctx, 'pitchDate'),
    };
  }, [user]);

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

  const statusArchiveIds = useMemo(() => {
    const completed = activityStatusesForFilter.find(
      (s) => s.name === 'completed'
    );
    const deleted = activityStatusesForFilter.find((s) => s.name === 'deleted');
    return {
      completedStatusId: completed?.id,
      deletedStatusId: deleted?.id,
    };
  }, [activityStatusesForFilter]);

  const hasStatusFilter = filterState.activityStatusIds.length > 0;
  const statusFilterIncludesCompleted =
    statusArchiveIds.completedStatusId != null &&
    filterState.activityStatusIds.includes(statusArchiveIds.completedStatusId);
  const statusFilterIncludesDeleted =
    statusArchiveIds.deletedStatusId != null &&
    filterState.activityStatusIds.includes(statusArchiveIds.deletedStatusId);
  const effectiveShowCompleted = hasStatusFilter
    ? statusFilterIncludesCompleted
    : showCompleted;
  const effectiveShowDeleted = hasStatusFilter
    ? statusFilterIncludesDeleted && canSeeDeleted
    : showDeleted && canSeeDeleted;

  const clearSavedFilterIfNeeded = useCallback(() => {
    onClearSavedFilter?.();
  }, [onClearSavedFilter]);

  const filters = useMemo((): BooleanFilter[] => {
    const disabledTooltip = hasStatusFilter
      ? 'Controlled by status filter'
      : undefined;
    const result: BooleanFilter[] = [
      {
        id: 'show-completed',
        label: 'Show completed',
        checked: effectiveShowCompleted,
        onCheckedChange: (checked: boolean) => {
          clearSavedFilterIfNeeded();
          setPreferences({ showCompleted: checked });
        },
        disabled: hasStatusFilter,
        disabledTooltip,
      },
    ];
    if (canSeeDeleted) {
      result.push({
        id: 'show-deleted',
        label: 'Show deleted',
        checked: effectiveShowDeleted,
        onCheckedChange: (checked: boolean) => {
          clearSavedFilterIfNeeded();
          setPreferences({ showDeleted: checked });
        },
        disabled: hasStatusFilter,
        disabledTooltip,
      });
    }
    return result;
  }, [
    hasStatusFilter,
    effectiveShowCompleted,
    effectiveShowDeleted,
    canSeeDeleted,
    setPreferences,
    clearSavedFilterIfNeeded,
  ]);

  const filterSummaryContext = useMemo(
    (): ActivityFilterSummaryContext => ({
      statusOptions,
      pitchRequiredStatusOptions,
      tagOptions,
      ministryOptions,
      organizationOptions,
      commsContactOptions,
      eventPlannerOptions,
      translationStatusOptions,
      translationOptions,
    }),
    [
      statusOptions,
      pitchRequiredStatusOptions,
      tagOptions,
      ministryOptions,
      organizationOptions,
      commsContactOptions,
      eventPlannerOptions,
      translationStatusOptions,
      translationOptions,
    ]
  );

  const appliedFilterTypeLabels = useMemo(
    () =>
      getAppliedActivityFilterTypeLabels(
        filterState,
        searchKeyword,
        filterSummaryContext
      ),
    [filterState, searchKeyword, filterSummaryContext]
  );

  const hasActiveCriteria =
    hasAnyActivityTableFilterActive(filterState, pitchFieldVisibility) ||
    searchKeyword.trim() !== '';

  const filterDetailLines = useMemo(
    () =>
      hasActiveCriteria
        ? buildActivityFilterSummaryLinesForDetailPopover(
            filterState,
            searchKeyword,
            filterSummaryContext
          )
        : [],
    [filterState, searchKeyword, filterSummaryContext, hasActiveCriteria]
  );

  const handleClearPanelFilters = useCallback(() => {
    clearSavedFilterIfNeeded();
    setPreferences({ filterState: DEFAULT_ACTIVITY_FILTER_STATE });
  }, [setPreferences, clearSavedFilterIfNeeded]);

  const onClearFilters = hasAnyActivityTableFilterActive(
    filterState,
    pitchFieldVisibility
  )
    ? handleClearPanelFilters
    : undefined;

  return {
    filters,
    appliedFilterTypeLabels,
    filterDetailLines,
    onClearFilters,
    singularLabel: 'entry',
    pluralLabel: 'entries',
  };
}
