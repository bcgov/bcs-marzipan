import type { ReportDataQueryParams } from '@corpcal/shared/schemas';
import type { ReportDataRequestParams } from '@/api/reportsApi';
import {
  activityListReportFetchParamsKey,
  buildActivityListReportFetchParams,
  type ActivityListReportStatusArchiveIds,
} from '@/lib/activity-list-report-params';
import {
  activityListTabDisplayLabel,
  type ActivityListTabValue,
} from '@/lib/activity-list-tabs';
import type { ActivityTablePreferences } from '@/lib/activityTablePreferencesParams';
import { hasMinistryTabLeadTeamFilterConflict } from '@/lib/ministry-tab-lead-filter-conflict';

export type { ActivityListTabValue };
export { activityListTabDisplayLabel };

/** Maximum watchlist activity IDs sent on report/list query strings. */
export const ACTIVITY_LIST_WATCHLIST_IDS_MAX = 500;

export type ActivityListTabServerScope = Pick<
  ReportDataQueryParams,
  | 'leadTeamIds'
  | 'commsContactLeadUserIds'
  | 'sharedWithTeamIds'
  | 'flagAssigneeUserIds'
  | 'activityIds'
>;

export type ActivityListReportAvailability =
  | 'allowed'
  | 'allowed-with-warning'
  | 'blocked-tab'
  | 'blocked-conflict'
  | 'blocked-watchlist-limit';

export type ReportAvailability = ActivityListReportAvailability;

export type ActivityListScopeContextLine = {
  label: string;
  value: string;
};

export interface BuildActivityListTabServerScopeInput {
  tab: ActivityListTabValue;
  userId?: number;
  userTeamIds: number[];
  effectiveLeadTeamId?: number | null;
}

export type ActivityListScopeInput = Omit<
  BuildActivityListEffectiveScopeInput,
  'preferences' | 'statusArchiveIds'
> & {
  statusArchiveIds?: ActivityListReportStatusArchiveIds;
};

export interface BuildActivityListEffectiveScopeInput {
  tab: ActivityListTabValue;
  preferences: Pick<
    ActivityTablePreferences,
    'filterState' | 'showCompleted' | 'showDeleted'
  >;
  statusArchiveIds: ActivityListReportStatusArchiveIds;
  canSeeDeleted: boolean;
  watchlistActivityIds?: number[];
  ministryConflict?: boolean;
  ministryTabLabel?: string;
  userId?: number;
  userTeamIds?: number[];
  effectiveLeadTeamId?: number | null;
}

export interface ActivityListEffectiveScope {
  tabServerScope: ActivityListTabServerScope;
  reportFetchParams: ReportDataRequestParams;
  reportFetchParamsKey: string;
  reportAvailability: ActivityListReportAvailability;
  tabContextLines: ActivityListScopeContextLine[];
}

const TAB_PANEL_INTERSECT_KEYS = [
  'leadTeamIds',
  'commsContactLeadUserIds',
] as const satisfies readonly (keyof ActivityListTabServerScope)[];

export function reportsMenuItemsDisabled(
  availability: ActivityListReportAvailability
): boolean {
  return availability !== 'allowed' && availability !== 'allowed-with-warning';
}

export function showReportsFullListFooter(
  availability: ActivityListReportAvailability
): boolean {
  return availability === 'blocked-tab';
}

export function buildActivityListTableProps(
  input: BuildActivityListTabServerScopeInput & {
    watchlistActivityIds: number[];
  }
) {
  const scope = buildActivityListTabServerScope(input);
  return activityListTabServerScopeToTableProps(
    input.tab,
    scope,
    input.watchlistActivityIds
  );
}

export function intersectIdArrays(
  tabIds: number[] | undefined,
  panelIds: number[] | undefined
): { ids: number[] | undefined; emptyConflict: boolean } {
  const tab = tabIds ?? [];
  const panel = panelIds ?? [];
  if (tab.length === 0) {
    return {
      ids: panel.length > 0 ? panel : undefined,
      emptyConflict: false,
    };
  }
  if (panel.length === 0) {
    return { ids: tab, emptyConflict: false };
  }
  const tabSet = new Set(tab);
  const intersected = panel.filter((id) => tabSet.has(id));
  if (intersected.length === 0) {
    return { ids: [], emptyConflict: true };
  }
  return { ids: intersected, emptyConflict: false };
}

export function activityListTabServerScopeToTableProps(
  tab: ActivityListTabValue,
  scope: ActivityListTabServerScope,
  watchlistActivityIds: number[]
): {
  watchlistActivityIds: number[];
  leadTeamIds?: number[];
  commsContactLeadUserIds?: number[];
  sharedWithTeamIds?: number[];
  flagAssigneeUserIds?: number[];
  favouriteActivityIds?: number[];
} {
  const base = { watchlistActivityIds };
  if (tab === 'favourites') {
    return { ...base, favouriteActivityIds: watchlistActivityIds };
  }
  return {
    ...base,
    ...(scope.leadTeamIds != null ? { leadTeamIds: scope.leadTeamIds } : {}),
    ...(scope.commsContactLeadUserIds != null
      ? { commsContactLeadUserIds: scope.commsContactLeadUserIds }
      : {}),
    ...(scope.sharedWithTeamIds != null
      ? { sharedWithTeamIds: scope.sharedWithTeamIds }
      : {}),
    ...(scope.flagAssigneeUserIds != null
      ? { flagAssigneeUserIds: scope.flagAssigneeUserIds }
      : {}),
  };
}

export function buildActivityListTabServerScope(
  input: BuildActivityListTabServerScopeInput
): ActivityListTabServerScope {
  const { tab, userId, userTeamIds, effectiveLeadTeamId } = input;
  switch (tab) {
    case 'all':
      return {};
    case 'ministry':
      return effectiveLeadTeamId != null
        ? { leadTeamIds: [effectiveLeadTeamId] }
        : {};
    case 'my-activities':
      return userId != null ? { commsContactLeadUserIds: [userId] } : {};
    case 'recent':
      return {};
    case 'shared-with-me':
      return userTeamIds.length > 0 ? { sharedWithTeamIds: userTeamIds } : {};
    case 'favourites':
      return {};
    case 'assigned-to-me':
      return userId != null ? { flagAssigneeUserIds: [userId] } : {};
    default:
      return {};
  }
}

export function buildActivityListEffectiveScope(
  input: BuildActivityListEffectiveScopeInput
): ActivityListEffectiveScope {
  const {
    tab,
    preferences,
    statusArchiveIds,
    canSeeDeleted,
    watchlistActivityIds = [],
    ministryConflict = false,
    ministryTabLabel,
    userId,
    userTeamIds = [],
    effectiveLeadTeamId,
  } = input;

  const tabServerScope = buildActivityListTabServerScope({
    tab,
    userId,
    userTeamIds,
    effectiveLeadTeamId,
  });

  const baseParams = buildActivityListReportFetchParams(
    preferences,
    statusArchiveIds,
    canSeeDeleted
  );

  const merged: ReportDataRequestParams = { ...baseParams };
  let intersectConflict = false;

  for (const key of TAB_PANEL_INTERSECT_KEYS) {
    const tabIds = tabServerScope[key];
    const panelIds = baseParams[key];
    if (tabIds == null && panelIds == null) continue;
    const { ids, emptyConflict } = intersectIdArrays(tabIds, panelIds);
    if (emptyConflict) {
      intersectConflict = true;
    }
    if (ids != null && ids.length > 0) {
      merged[key] = ids;
    } else if (ids != null && ids.length === 0) {
      delete merged[key];
    } else {
      delete merged[key];
    }
  }

  if (tabServerScope.sharedWithTeamIds != null) {
    merged.sharedWithTeamIds = tabServerScope.sharedWithTeamIds;
  }
  if (tabServerScope.flagAssigneeUserIds != null) {
    merged.flagAssigneeUserIds = tabServerScope.flagAssigneeUserIds;
  }

  let watchlistOverLimit = false;
  if (tab === 'favourites') {
    if (watchlistActivityIds.length > ACTIVITY_LIST_WATCHLIST_IDS_MAX) {
      watchlistOverLimit = true;
    } else if (watchlistActivityIds.length === 0) {
      merged.activityIds = [0];
    } else {
      merged.activityIds = [...watchlistActivityIds].sort((a, b) => a - b);
    }
  }

  const ministryLeadConflict =
    tab === 'ministry' &&
    hasMinistryTabLeadTeamFilterConflict(
      effectiveLeadTeamId ?? undefined,
      preferences.filterState.leadTeamIds
    );

  let reportAvailability: ActivityListReportAvailability = 'allowed';
  if (tab === 'recent') {
    reportAvailability = 'blocked-tab';
  } else if (watchlistOverLimit) {
    reportAvailability = 'blocked-watchlist-limit';
  } else if (ministryConflict || ministryLeadConflict || intersectConflict) {
    reportAvailability = 'blocked-conflict';
  }

  const tabContextLines: ActivityListScopeContextLine[] =
    tab === 'all'
      ? []
      : [
          {
            label: 'View',
            value: activityListTabDisplayLabel(tab, { ministryTabLabel }),
          },
        ];

  return {
    tabServerScope,
    reportFetchParams: merged,
    reportFetchParamsKey: `${tab}|${activityListReportFetchParamsKey(merged)}`,
    reportAvailability,
    tabContextLines,
  };
}
