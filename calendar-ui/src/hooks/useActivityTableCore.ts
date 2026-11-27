import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  DEFAULT_ACTIVITY_FILTER_STATE,
  formatLanguageTagForDisplay,
  PERMISSIONS,
  resolveActivityArchiveQueryFlags,
  shouldShowCompletedHiddenByStatusHint,
  type UserColourKey,
} from '@corpcal/shared';
import { hasAnyActivityTableFilterActive } from '@/components/activity/ActivityTable/ActivityTableFilters';
import {
  mapActivityToTableRow,
  mapLegacyActivityToTableRow,
  type ActivityTableRow,
} from '@/components/activity/ActivityTable/activityTableRow';
import { compareActivityRowsByLevels } from '@/components/activity/ActivityTable/activityTableSort';
import {
  ACTIVITY_SORT_COLUMNS,
  DEFAULT_SORT_DIRECTION,
  DEFAULT_SORT_KEY,
} from '@/components/activity/ActivityTable/activityTableSortColumns';
import type { SortLevel } from '@/components/table/SortDropdown';
import type { BooleanFilter } from '@/components/table/TableSummaryBar';
import { useActivityListScrollRestore } from '@/hooks/useActivityListScrollRestore';
import { useActivityTableFilterLookups } from '@/hooks/useActivityTableFilterLookups';
import { useActivityTablePreferences } from '@/hooks/useActivityTablePreferences';
import { useAuth } from '@/hooks/useAuth';
import {
  useActivityList,
  useBulkUnshareActivities,
  useBulkUpdateActivities,
  useSyncActivityFlags,
} from '@/hooks/useCalendar';
import { useFavourites } from '@/hooks/useFavourites';
import { useLegacyActivities } from '@/hooks/useLegacyActivities';
import {
  useLiveActivityRowHighlights,
  useLiveActivitySyncContext,
} from '@/hooks/useLiveActivitySyncContext';
import {
  useCategories,
  useTags,
  useTeams,
  useTranslationLanguages,
  useUsers,
} from '@/hooks/useLookups';
import { useSavedFilters } from '@/hooks/useSavedFilters';
import { buildValidFilterLookupsFromOptions } from '@/lib/activity-filter-lookups';
import { COMPLETED_HIDDEN_BY_STATUS_FILTER_NOTE } from '@/lib/activity-list-filter-messages';
import {
  canResolveTranslationLanguageFilter,
  filterActivityRowsByFilters,
  filterActivityRowsByKeyword,
  type ActivityListQueryParams,
  type FilterActivityRowsContext,
} from '@/lib/activity-query-utils';
import { buildActivityTableFilterSummaryDetails } from '@/lib/activity-table-summary-bar-state';
import {
  bulkDialogEligibleIds,
  resolveActivityBulkMenu,
} from '@/lib/activityBulkActions';
import {
  ARCHIVE_SCOPE_DEBOUNCE_MS,
  hasAnyKnownParam,
} from '@/lib/activityTablePreferencesParams';
import { getFriendlyErrorMessage } from '@/lib/error-toast';
import { dateRangeReachesPast } from '@/lib/legacy-date-gate';
import { hasMinistryTabLeadTeamFilterConflict } from '@/lib/ministry-tab-lead-filter-conflict';
import { getSavedFilterAutoApplyDecision } from '@/lib/savedFilterAutoApplyDecision';
import {
  sanitizeSavedFilterPayload,
  type ValidFilterLookups,
} from '@/lib/savedFilterSanitize';
import {
  getUnshareableTeamsForBulk,
  resolveUnsharePermissions,
} from '@/lib/unshare-helpers';

/** Active saved-filter preset shown in the summary bar and Saved filters menu. */
export type ActivityTableActiveSavedFilter = {
  id: number;
  name: string;
};

export type ActivityBulkDialog =
  'review' | 'issue' | 'tags' | 'sharing' | 'flag' | 'delete' | null;

export interface ActivityTableCoreOptions {
  /** When set, only activities with any of these lead teams are shown (e.g. ministry tab). */
  leadTeamIds?: number[];
  /** When set, only activities where any of these users is comms contact lead are shown. */
  commsContactLeadUserIds?: number[];
  /** When set, only activities shared with any of these teams are shown. */
  sharedWithTeamIds?: number[];
  /** When set, only activities whose IDs are in this list are shown (favourites tab). */
  favouriteActivityIds?: number[];
  /** IDs currently in the user's watchlist; used to show the watchlist indicator. */
  watchlistActivityIds?: number[];
  /** When set, only activities flag-assigned to any of these users are shown. */
  flagAssigneeUserIds?: number[];
  /** Merge read-only legacy records into the list when the date range reaches the past. */
  includeLegacy?: boolean;
  /**
   * When used with `onActiveSavedFilterChange`, the parent owns which saved filter
   * is considered applied (e.g. a single table across activity list tabs).
   */
  activeSavedFilter?: ActivityTableActiveSavedFilter | null;
  onActiveSavedFilterChange?: (
    value: ActivityTableActiveSavedFilter | null
  ) => void;
}

const MAX_BULK_SELECTION = 100;

/**
 * Shared orchestration for every activity grid layout: permissions, filters,
 * saved filters, the activity query, client-side filtering and sorting,
 * pagination, bulk selection and actions, watchlist, and flags.
 *
 * Grid layouts supply only their column definitions and table markup; all
 * behaviour below stays identical across layouts.
 */
export function useActivityTableCore({
  leadTeamIds,
  commsContactLeadUserIds,
  sharedWithTeamIds,
  favouriteActivityIds,
  watchlistActivityIds,
  flagAssigneeUserIds,
  includeLegacy = false,
  activeSavedFilter: activeSavedFilterFromParent,
  onActiveSavedFilterChange,
}: ActivityTableCoreOptions = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const isActivityListRoute = location.pathname === '/';
  const { user, hasPermission } = useAuth();
  const userTeamIds = useMemo(() => user?.teamIds ?? [], [user?.teamIds]);

  const unsharePermissions = resolveUnsharePermissions(
    hasPermission,
    user?.roleName
  );
  const canUnshare =
    unsharePermissions.hasUnshare || unsharePermissions.hasUnshareAll;
  const canViewDeleted = hasPermission(PERMISSIONS.ACTIVITIES.VIEW_DELETED);
  const showReviewHighlights = hasPermission(PERMISSIONS.ACTIVITIES.REVIEW);
  const canFlag = hasPermission(PERMISSIONS.ACTIVITIES.FLAG);

  const {
    statusArchiveIds,
    statusOptions,
    tagOptions,
    leadTeamOptions,
    commsContactOptions,
    eventPlannerOptions,
    translationOptions,
    translationStatusOptions,
    filterSummaryContext: filterSummaryContextForBar,
    hasActivityStatuses,
  } = useActivityTableFilterLookups(canViewDeleted);

  const tableScrollRef = useRef<HTMLDivElement>(null);
  const { preferences, setPreferences } = useActivityTablePreferences();
  const savedFiltersHook = useSavedFilters();
  const [currentSearchParams] = useSearchParams();
  const defaultAppliedRef = useRef(false);
  const defaultSuppressedByClearRef = useRef(false);
  const [internalActiveSavedFilter, setInternalActiveSavedFilter] =
    useState<ActivityTableActiveSavedFilter | null>(null);

  const savedFilterSelectionControlled = onActiveSavedFilterChange != null;
  const activeSavedFilter = savedFilterSelectionControlled
    ? (activeSavedFilterFromParent ?? null)
    : internalActiveSavedFilter;

  const setActiveSavedFilter = useCallback(
    (value: ActivityTableActiveSavedFilter | null) => {
      if (savedFilterSelectionControlled) {
        onActiveSavedFilterChange?.(value);
      } else {
        setInternalActiveSavedFilter(value);
      }
    },
    [savedFilterSelectionControlled, onActiveSavedFilterChange]
  );

  useEffect(() => {
    if (activeSavedFilter == null) return;
    const stillThere = savedFiltersHook.savedFilters.some(
      (f) => f.id === activeSavedFilter.id
    );
    if (!stillThere) setActiveSavedFilter(null);
  }, [activeSavedFilter, savedFiltersHook.savedFilters, setActiveSavedFilter]);

  const sortKey = preferences.sortKey;
  const sortDirection = preferences.sortDirection;
  const searchKeyword = preferences.searchKeyword;
  const filterState = preferences.filterState;

  const [debouncedDateRange, setDebouncedDateRange] = useState(
    filterState.dateRange
  );
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedDateRange(filterState.dateRange);
    }, ARCHIVE_SCOPE_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [filterState.dateRange]);

  const [pageIndex, setPageIndex] = useState(0);
  const [selectedActivityIds, setSelectedActivityIds] = useState<Set<number>>(
    new Set()
  );
  const [bulkDialog, setBulkDialog] = useState<ActivityBulkDialog>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);
  const [selectedFlagTeamId, setSelectedFlagTeamId] = useState('');
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<number[]>([]);
  const [deleteReason, setDeleteReason] = useState('');
  const [unshareModalOpen, setUnshareModalOpen] = useState(false);

  const bulkUpdateActivitiesMutation = useBulkUpdateActivities();
  const bulkUnshareMutation = useBulkUnshareActivities();
  const {
    favouriteActivityIds: watchlistIds,
    toggle: toggleFavourite,
    isToggling: isFavouriteToggling,
  } = useFavourites();

  const { data: categoriesForFilter = [] } = useCategories();
  const { data: tags = [] } = useTags();
  const { data: teams = [] } = useTeams();
  const {
    data: translationLanguagesForFilter = [],
    isLoading: isTranslationLanguagesLoading,
  } = useTranslationLanguages();

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

  const translationLanguageOptionsForFilter = useMemo(
    () =>
      translationLanguagesForFilter.map((l) => ({
        value: String(l.id),
        label: l.shortcode
          ? formatLanguageTagForDisplay(l.shortcode)
          : (l.displayName ?? String(l.id)),
      })),
    [translationLanguagesForFilter]
  );

  const validFilterLookupsForDefaultApply = useMemo(
    (): ValidFilterLookups =>
      buildValidFilterLookupsFromOptions({
        statusOptions,
        categoryOptions,
        tagOptions,
        commsContactOptions,
        eventPlannerOptions,
        leadTeamOptions,
        translationStatusOptions,
        translationOptions,
      }),
    [
      statusOptions,
      categoryOptions,
      tagOptions,
      commsContactOptions,
      eventPlannerOptions,
      leadTeamOptions,
      translationStatusOptions,
      translationOptions,
    ]
  );

  const ministryTabLeadTeamId =
    leadTeamIds?.length === 1 ? leadTeamIds[0] : undefined;

  const leadFilterConflictsWithMinistryTab = useMemo(
    () =>
      hasMinistryTabLeadTeamFilterConflict(
        ministryTabLeadTeamId,
        filterState.leadTeamIds
      ),
    [ministryTabLeadTeamId, filterState.leadTeamIds]
  );

  const savedFilterDefaultLookupsReady =
    hasActivityStatuses && !savedFiltersHook.isLoading;

  useEffect(() => {
    const decision = getSavedFilterAutoApplyDecision({
      lookupsReady: savedFilterDefaultLookupsReady,
      defaultAlreadyApplied: defaultAppliedRef.current,
      suppressedByClear: defaultSuppressedByClearRef.current,
      hasKnownUrlParams: hasAnyKnownParam(currentSearchParams),
      hasRestoredActivePreferences:
        hasAnyActivityTableFilterActive(filterState) ||
        searchKeyword.trim().length > 0,
      hasDefaultFilter: savedFiltersHook.defaultFilter != null,
    });

    if (decision.shouldMarkContextApplied) {
      defaultAppliedRef.current = true;
    }

    if (decision.shouldClearActiveSavedFilter) {
      setActiveSavedFilter(null);
    }

    if (!decision.shouldApplyDefault) {
      return;
    }

    const defaultFilter = savedFiltersHook.defaultFilter;
    if (!defaultFilter) {
      return;
    }
    const {
      filterState: sanitized,
      searchKeyword: kw,
      hadInvalidValues,
    } = sanitizeSavedFilterPayload(
      defaultFilter,
      validFilterLookupsForDefaultApply
    );
    setPreferences({ filterState: sanitized, searchKeyword: kw });
    setActiveSavedFilter({
      id: defaultFilter.id,
      name: defaultFilter.name,
    });
    if (hadInvalidValues) {
      toast.warning(
        'Some filter values are no longer available and were skipped.'
      );
    }
  }, [
    savedFiltersHook.defaultFilter,
    savedFiltersHook.isLoading,
    currentSearchParams,
    filterState,
    searchKeyword,
    setPreferences,
    setActiveSavedFilter,
    validFilterLookupsForDefaultApply,
    savedFilterDefaultLookupsReady,
  ]);

  const filterStateForArchiveFetch = useMemo(
    () => ({ ...filterState, dateRange: debouncedDateRange }),
    [filterState, debouncedDateRange]
  );

  const { includeCompleted, includeDeleted } = useMemo(
    () =>
      resolveActivityArchiveQueryFlags({
        filterState: filterStateForArchiveFetch,
        statusArchiveIds,
        canViewDeleted,
      }),
    [filterStateForArchiveFetch, statusArchiveIds, canViewDeleted]
  );

  const pagination = useMemo(
    () => ({ pageIndex, pageSize: preferences.pageSize }),
    [pageIndex, preferences.pageSize]
  );

  const activityFilters = useMemo((): ActivityListQueryParams => {
    return {
      includeCompleted,
      includeDeleted,
      ...(leadTeamIds !== undefined &&
        leadTeamIds.length > 0 && { leadTeamIds }),
      ...(commsContactLeadUserIds !== undefined &&
        commsContactLeadUserIds.length > 0 && { commsContactLeadUserIds }),
      ...(sharedWithTeamIds !== undefined &&
        sharedWithTeamIds.length > 0 && { sharedWithTeamIds }),
      ...(flagAssigneeUserIds !== undefined &&
        flagAssigneeUserIds.length > 0 && { flagAssigneeUserIds }),
    };
  }, [
    includeCompleted,
    includeDeleted,
    leadTeamIds,
    commsContactLeadUserIds,
    sharedWithTeamIds,
    flagAssigneeUserIds,
  ]);

  const sameNumericArray = (
    a: number[] | undefined,
    b: number[] | undefined
  ): boolean =>
    (a == null && b == null) ||
    (a != null &&
      b != null &&
      a.length === b.length &&
      a.every((id, i) => id === b[i]));

  // Reset to first page when user changes filters so results match expectations
  const prevFiltersRef = useRef(activityFilters);
  useEffect(() => {
    const prev = prevFiltersRef.current;
    const same =
      prev.includeCompleted === activityFilters.includeCompleted &&
      prev.includeDeleted === activityFilters.includeDeleted &&
      sameNumericArray(prev.leadTeamIds, activityFilters.leadTeamIds) &&
      sameNumericArray(
        prev.commsContactLeadUserIds,
        activityFilters.commsContactLeadUserIds
      ) &&
      sameNumericArray(
        prev.sharedWithTeamIds,
        activityFilters.sharedWithTeamIds
      ) &&
      sameNumericArray(
        prev.flagAssigneeUserIds,
        activityFilters.flagAssigneeUserIds
      );
    if (!same) {
      prevFiltersRef.current = activityFilters;
      setPageIndex(0);
    }
  }, [activityFilters]);

  // Reset to first page when search keyword or filter state changes
  const prevSearchKeywordRef = useRef(searchKeyword);
  const prevFilterStateRef = useRef(filterState);
  useEffect(() => {
    if (prevSearchKeywordRef.current !== searchKeyword) {
      prevSearchKeywordRef.current = searchKeyword;
      setPageIndex(0);
    }
  }, [searchKeyword]);
  useEffect(() => {
    if (
      JSON.stringify(prevFilterStateRef.current) !== JSON.stringify(filterState)
    ) {
      prevFilterStateRef.current = filterState;
      setPageIndex(0);
    }
  }, [filterState]);

  const { isSocketConnected } = useLiveActivitySyncContext();

  const activitiesQuery = useActivityList(activityFilters, {
    suppressPollingWhileLive: isSocketConnected,
  });

  const remoteHighlightIds = useLiveActivityRowHighlights(
    activitiesQuery.isFetching
  );

  const usersQuery = useUsers();

  const syncFlagsMutation = useSyncActivityFlags();

  const onPaginationChange = useCallback(
    (
      updaterOrValue:
        ((prev: typeof pagination) => typeof pagination) | typeof pagination
    ) => {
      const prev = pagination;
      const next =
        typeof updaterOrValue === 'function'
          ? updaterOrValue(prev)
          : updaterOrValue;
      if (next.pageSize !== prev.pageSize) {
        setPreferences({ pageSize: next.pageSize });
        setPageIndex(0);
      } else {
        setPageIndex(next.pageIndex);
      }
    },
    [pagination, setPreferences]
  );

  const userMap = useMemo(() => {
    const map = new Map<
      string,
      { name: string; jobTitle?: string | null; userColourKey: UserColourKey }
    >();
    const users = usersQuery.data ?? [];
    users.forEach((u) => {
      const displayName = u.name || u.email || String(u.id);
      map.set(String(u.id), {
        name: displayName,
        jobTitle: u.jobTitle ?? null,
        userColourKey: u.userColourKey,
      });
    });
    return map;
  }, [usersQuery.data]);

  const legacyActive =
    includeLegacy && dateRangeReachesPast(filterState.dateRange);
  const legacyQuery = useLegacyActivities(legacyActive, {
    search: searchKeyword.trim() || undefined,
    startDate: filterState.dateRange.noStartDate
      ? undefined
      : filterState.dateRange.startDate || undefined,
    endDate: filterState.dateRange.noEndDate
      ? undefined
      : filterState.dateRange.endDate || undefined,
  });
  const data = useMemo(() => {
    const current = (activitiesQuery.data ?? []).map(mapActivityToTableRow);
    if (!legacyActive) return current;
    const legacy = (legacyQuery.data ?? [])
      .map(mapLegacyActivityToTableRow)
      .filter((row) => {
        if (
          !includeCompleted &&
          row.activityStatusId === statusArchiveIds.completedStatusId
        ) {
          return false;
        }
        if (
          !includeDeleted &&
          row.activityStatusId === statusArchiveIds.deletedStatusId
        ) {
          return false;
        }
        return true;
      });
    return [...current, ...legacy];
  }, [
    activitiesQuery.data,
    includeCompleted,
    includeDeleted,
    legacyActive,
    legacyQuery.data,
    statusArchiveIds.completedStatusId,
    statusArchiveIds.deletedStatusId,
  ]);

  const legacyLoading =
    legacyActive && legacyQuery.isPending && !legacyQuery.data;
  const loading =
    (activitiesQuery.isPending && !activitiesQuery.data) || legacyLoading;
  const error = activitiesQuery.isError
    ? activitiesQuery.error
    : legacyActive && legacyQuery.isError
      ? legacyQuery.error
      : null;

  const filterContext = useMemo((): FilterActivityRowsContext | undefined => {
    const hasTranslationStatus = translationStatusOptions.length > 0;
    const hasTranslationLanguages =
      translationLanguageOptionsForFilter.length > 0;
    if (!hasTranslationStatus && !hasTranslationLanguages) return undefined;
    return {
      ...(hasTranslationStatus && {
        translationRequiredStatusOptions: translationStatusOptions,
      }),
      ...(hasTranslationLanguages && {
        translationLanguageOptions: translationLanguageOptionsForFilter,
      }),
    };
  }, [translationStatusOptions, translationLanguageOptionsForFilter]);

  const filteredData = useMemo(() => {
    const translationLanguageFilterPending =
      filterState.translationLanguageIds.length > 0 &&
      (isTranslationLanguagesLoading ||
        !canResolveTranslationLanguageFilter(filterState, filterContext));

    if (translationLanguageFilterPending) {
      return [];
    }

    const afterKeyword = filterActivityRowsByKeyword(data, searchKeyword);
    const afterFilters = filterActivityRowsByFilters(
      afterKeyword,
      filterState,
      filterContext
    );
    if (favouriteActivityIds !== undefined) {
      const favouriteSet = new Set(favouriteActivityIds);
      return afterFilters.filter((row) => favouriteSet.has(row.id));
    }
    return afterFilters;
  }, [
    data,
    searchKeyword,
    filterState,
    filterContext,
    favouriteActivityIds,
    isTranslationLanguagesLoading,
  ]);

  const effectiveSortKey = sortKey ?? DEFAULT_SORT_KEY;
  const effectiveSortDirection =
    sortKey !== null ? sortDirection : DEFAULT_SORT_DIRECTION;

  const sortedData = useMemo(() => {
    const activeColumn = ACTIVITY_SORT_COLUMNS.find(
      (c) => c.id === effectiveSortKey
    );
    const sortLevels: SortLevel[] = [
      { key: effectiveSortKey, direction: effectiveSortDirection },
      ...(activeColumn?.tieBreakers ?? []),
    ];
    return [...filteredData].sort((a, b) =>
      compareActivityRowsByLevels(a, b, sortLevels)
    );
  }, [filteredData, effectiveSortKey, effectiveSortDirection]);

  const sortedActivityIds = useMemo(
    () => sortedData.map((row) => row.id),
    [sortedData]
  );

  useEffect(() => {
    const visibleIds = new Set(sortedActivityIds);
    setSelectedActivityIds((current) => {
      const next = new Set(
        [...current].filter((activityId) => visibleIds.has(activityId))
      );
      return next.size === current.size ? current : next;
    });
  }, [sortedActivityIds]);

  const selectedActivityCount = selectedActivityIds.size;
  const bulkActionPending =
    bulkUpdateActivitiesMutation.isPending || bulkUnshareMutation.isPending;

  const selectedActivities = useMemo(
    () => sortedData.filter((row) => selectedActivityIds.has(row.id)),
    [sortedData, selectedActivityIds]
  );

  const bulkMenu = useMemo(
    () =>
      resolveActivityBulkMenu({
        hasPermission,
        userId: user?.id,
        teamIds: userTeamIds,
        roleName: user?.roleName,
        canUnshare,
        selectedRows: selectedActivities,
        watchlistIds,
      }),
    [
      hasPermission,
      user?.id,
      userTeamIds,
      user?.roleName,
      canUnshare,
      selectedActivities,
      watchlistIds,
    ]
  );

  const eligibleBulkUnshareTeams = useMemo(
    () =>
      getUnshareableTeamsForBulk(
        selectedActivities.map((row) => ({
          sharedWithTeamIds: row.sharedWithTeamIds,
          visibility: row.visibility,
        })),
        teams.map((team) => ({
          id: team.id,
          name: team.name,
          displayName: team.name,
        })),
        user?.teamIds ?? [],
        unsharePermissions.hasUnshare,
        unsharePermissions.hasUnshareAll,
        unsharePermissions.isAdminOrSysAdmin
      ),
    [selectedActivities, teams, user?.teamIds, unsharePermissions]
  );

  const handleBulkUnshareConfirm = useCallback(
    async (teamId: number) => {
      const activityIds = [...selectedActivityIds];
      if (activityIds.length === 0) return;
      try {
        const result = await bulkUnshareMutation.mutateAsync({
          activityIds,
          teamId,
        });
        setSelectedActivityIds(new Set());
        setUnshareModalOpen(false);
        toast.success(
          `${result.summary.updated} activit${result.summary.updated === 1 ? 'y' : 'ies'} unshared.`
        );
        if (result.summary.skipped > 0) {
          toast.info(
            `${result.summary.skipped} activit${result.summary.skipped === 1 ? 'y was' : 'ies were'} skipped.`
          );
        }
      } catch (error) {
        toast.error(getFriendlyErrorMessage(error));
      }
    },
    [bulkUnshareMutation, selectedActivityIds]
  );

  const toggleActivitySelected = useCallback(
    (activityId: number, selected: boolean) => {
      setSelectedActivityIds((current) => {
        const next = new Set(current);
        if (selected) {
          next.add(activityId);
        } else {
          next.delete(activityId);
        }
        return next;
      });
    },
    []
  );

  const selectActivityIds = useCallback((ids: number[]) => {
    // Legacy rows have negative ids and cannot take part in bulk actions.
    const activityIds = ids.filter((id) => id > 0);
    const nextIds = activityIds.slice(0, MAX_BULK_SELECTION);
    setSelectedActivityIds(new Set(nextIds));
    if (activityIds.length > MAX_BULK_SELECTION) {
      toast.warning(
        `Bulk actions are limited to ${MAX_BULK_SELECTION} activities at a time.`
      );
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedActivityIds(new Set());
  }, []);

  const handleBulkReview = useCallback(async () => {
    const activityIds = bulkDialogEligibleIds(
      'review',
      bulkMenu,
      selectedActivityIds
    );
    if (activityIds.length === 0) {
      toast.error('No selected activities can be marked reviewed.');
      return;
    }
    try {
      await bulkUpdateActivitiesMutation.mutateAsync({
        activityIds,
        operation: 'review',
      });
      setSelectedActivityIds(new Set());
      setBulkDialog(null);
      toast.success(
        `${activityIds.length} activit${activityIds.length === 1 ? 'y was' : 'ies were'} marked reviewed.`
      );
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    }
  }, [bulkMenu, bulkUpdateActivitiesMutation, selectedActivityIds]);

  const handleBulkOperation = useCallback(async () => {
    if (!bulkDialog) return;
    const activityIds = bulkDialogEligibleIds(
      bulkDialog,
      bulkMenu,
      selectedActivityIds
    );
    if (activityIds.length === 0) {
      toast.error('No selected activities are eligible for this batch action.');
      return;
    }
    if (bulkDialog === 'review') {
      await handleBulkReview();
      return;
    }
    const operation = bulkDialog === 'sharing' ? 'sharedWith' : bulkDialog;
    try {
      await bulkUpdateActivitiesMutation.mutateAsync({
        activityIds,
        operation,
        ...(bulkDialog === 'tags' && { tagIds: selectedTagIds }),
        ...(bulkDialog === 'sharing' && { teamIds: selectedTeamIds }),
        ...(bulkDialog === 'flag' && {
          flagTeamId: Number(selectedFlagTeamId),
          assigneeIds: selectedAssigneeIds,
        }),
        ...(bulkDialog === 'delete' && { deleteReason }),
      });
      setSelectedActivityIds(new Set());
      setBulkDialog(null);
      toast.success(
        `Updated ${activityIds.length} selected activit${activityIds.length === 1 ? 'y' : 'ies'}.`
      );
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    }
  }, [
    bulkDialog,
    bulkMenu,
    bulkUpdateActivitiesMutation,
    deleteReason,
    handleBulkReview,
    selectedActivityIds,
    selectedAssigneeIds,
    selectedFlagTeamId,
    selectedTagIds,
    selectedTeamIds,
  ]);

  const { openActivityWithScroll } = useActivityListScrollRestore({
    enabled: isActivityListRoute,
    location,
    navigate,
    scrollRef: tableScrollRef,
    pageIndex,
    setPageIndex,
    pageSize: pagination.pageSize,
    loading,
    sortedActivityIds,
  });

  const watchlistActivityIdSet = useMemo(
    () => new Set(watchlistActivityIds ?? []),
    [watchlistActivityIds]
  );

  // Track which row ids we have seen so we can animate only newly arrived rows on refetch
  const seenIdsRef = useRef<Set<number>>(new Set());
  const [newRowIds, setNewRowIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const currentIds = data.map((r) => r.id);
    const currentSet = new Set(currentIds);
    const newlyAdded = currentIds.filter((id) => !seenIdsRef.current.has(id));
    seenIdsRef.current = currentSet;
    if (newlyAdded.length > 0) {
      setNewRowIds((prev) => new Set([...prev, ...newlyAdded]));
      const timeout = window.setTimeout(() => {
        setNewRowIds((prev) => {
          const next = new Set(prev);
          newlyAdded.forEach((id) => next.delete(id));
          return next;
        });
      }, 400);
      return () => window.clearTimeout(timeout);
    }
  }, [data]);

  const handleSortChange = useCallback(
    (key: string | null, direction: 'asc' | 'desc') => {
      setPreferences({
        sortKey: key ?? DEFAULT_SORT_KEY,
        sortDirection: direction,
      });
    },
    [setPreferences]
  );

  const handleHeaderSort = useCallback(
    (columnSortKeyOrKeys: string | string[]) => {
      const keys = Array.isArray(columnSortKeyOrKeys)
        ? columnSortKeyOrKeys
        : [columnSortKeyOrKeys];
      const isActive = keys.includes(effectiveSortKey);
      if (isActive) {
        handleSortChange(
          effectiveSortKey,
          effectiveSortDirection === 'asc' ? 'desc' : 'asc'
        );
      } else {
        const primaryKey = keys[0];
        const col = ACTIVITY_SORT_COLUMNS.find((c) => c.id === primaryKey);
        handleSortChange(primaryKey, col?.defaultDirection ?? 'asc');
      }
    },
    [effectiveSortKey, effectiveSortDirection, handleSortChange]
  );

  const handleFilterStateChange = useCallback(
    (nextFilterState: typeof filterState) => {
      setActiveSavedFilter(null);
      setPreferences({ filterState: nextFilterState });
    },
    [setPreferences, setActiveSavedFilter]
  );

  const handleSearchKeywordChange = useCallback(
    (value: string) => {
      setActiveSavedFilter(null);
      setPreferences({ searchKeyword: value });
    },
    [setPreferences, setActiveSavedFilter]
  );

  const handleApplySavedFilter = useCallback(
    (
      nextFilterState: typeof filterState,
      nextSearchKeyword: string,
      appliedFrom: ActivityTableActiveSavedFilter | null
    ) => {
      setActiveSavedFilter(appliedFrom);
      setPreferences({
        filterState: nextFilterState,
        searchKeyword: nextSearchKeyword,
      });
    },
    [setPreferences, setActiveSavedFilter]
  );

  const appliedSavedFilterName = useMemo(() => {
    if (activeSavedFilter == null) return null;
    const fromList = savedFiltersHook.savedFilters.find(
      (f) => f.id === activeSavedFilter.id
    );
    return fromList?.name ?? activeSavedFilter.name;
  }, [activeSavedFilter, savedFiltersHook.savedFilters]);

  const { appliedFilterTypeLabels, filterDetailLines, hasActiveCriteria } =
    useMemo(
      () =>
        buildActivityTableFilterSummaryDetails({
          filterState,
          searchKeyword,
          filterSummaryContext: filterSummaryContextForBar,
          statusArchiveIds,
        }),
      [filterState, searchKeyword, filterSummaryContextForBar, statusArchiveIds]
    );

  const completedHiddenByStatusFilterNote = useMemo(
    () =>
      shouldShowCompletedHiddenByStatusHint(filterState, statusArchiveIds)
        ? COMPLETED_HIDDEN_BY_STATUS_FILTER_NOTE
        : undefined,
    [filterState, statusArchiveIds]
  );

  const booleanFilters = useMemo((): BooleanFilter[] => [], []);

  const handleClearAllCriteria = useCallback(() => {
    defaultSuppressedByClearRef.current = true;
    defaultAppliedRef.current = false;
    setActiveSavedFilter(null);
    setPreferences({
      filterState: DEFAULT_ACTIVITY_FILTER_STATE,
      searchKeyword: '',
    });
  }, [setPreferences, setActiveSavedFilter]);

  const refetchActivities = useCallback(() => {
    void Promise.all([
      activitiesQuery.refetch(),
      ...(legacyActive ? [legacyQuery.refetch()] : []),
    ]);
  }, [activitiesQuery, legacyActive, legacyQuery]);

  return {
    // Permissions and visibility
    user,
    canBulkSelect: bulkMenu.canBulkSelect,
    bulkMenu,
    canUnshare,
    canViewDeleted,
    canFlag,
    showReviewHighlights,
    // Query state
    loading,
    error,
    refetchActivities,

    // Data
    data,
    filteredData,
    sortedData,
    sortedActivityIds,
    userMap,

    // Sorting
    sortKey,
    sortDirection,
    effectiveSortKey,
    effectiveSortDirection,
    handleSortChange,
    handleHeaderSort,

    // Pagination and scrolling
    pagination,
    onPaginationChange,
    tableScrollRef,
    openActivityWithScroll,

    // Selection and bulk actions
    selectedActivityIds,
    selectedActivityCount,
    selectedActivities,
    toggleActivitySelected,
    selectActivityIds,
    clearSelection,
    bulkDialog,
    setBulkDialog,
    bulkActionPending,
    handleBulkOperation,
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
    bulkUnsharePending: bulkUnshareMutation.isPending,

    // Watchlist and flags
    watchlistActivityIdSet,
    watchlistIds,
    toggleFavourite,
    isFavouriteToggling,
    syncFlagsMutation,

    // Row decoration
    newRowIds,
    remoteHighlightIds,

    // Filter bar and summary inputs
    filterState,
    searchKeyword,
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
    completedHiddenByStatusFilterNote,
    leadFilterConflictsWithMinistryTab,
    favouriteActivityIds,

    // Lookup options used by the filter bar and bulk dialogs
    categoryOptions,
    statusOptions,
    tagOptions,
    leadTeamOptions,
    commsContactOptions,
    eventPlannerOptions,
    translationOptions,
    translationStatusOptions,
    tags,
    teams,
  };
}

export type ActivityTableCore = ReturnType<typeof useActivityTableCore>;

export type { ActivityTableRow };
