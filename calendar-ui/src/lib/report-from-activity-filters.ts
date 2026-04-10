import type { ReportDataQueryParams } from '@corpcal/shared/schemas';
import type { ReportDataRequestParams } from '@/api/reportsApi';
import type { ActivityTablePreferences } from '@/lib/activityTablePreferencesParams';

/**
 * Stable string for React Query `queryKey` so refetches track param *values*, not object identity.
 */
export function stableSerializeReportQueryParams(
  params: ReportDataRequestParams
): string {
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
    )
  );
}

/**
 * Maps activity table preferences to `GET /reports/data/:type` query params.
 *
 * **Supported by {@link ReportDataQueryParams} / activities `findAll`:** scheduled start window
 * (`dateRange` → `startDateFrom` / `startDateTo`), keyword `search` (report post-filters results),
 * `includeCompleted` / `includeDeleted`, and single-value narrowing: `activityStatusId`,
 * `leadMinistryId`, `commsContactLeadUserId`, `lookAheadSection`.
 *
 * **Not representable on the API (activity list applies these client-side):** `categoryNames`,
 * `tagIds`, `leadOrgIds`, `eventPlannerLeadIds`, translation IDs, pitch / look-ahead status
 * strings, and any multi-select beyond one ID where the schema allows only one. Those do not
 * change the request until the backend schema gains matching fields.
 */
export function buildReportDataRequestParamsFromActivityPreferences(
  prefs: ActivityTablePreferences,
  statusArchive: {
    completedStatusId?: number;
    deletedStatusId?: number;
  },
  canSeeDeleted: boolean
): ReportDataRequestParams {
  const fs = prefs.filterState;
  const hasStatusFilter = fs.activityStatusIds.length > 0;
  const statusIncludesCompleted =
    statusArchive.completedStatusId != null &&
    fs.activityStatusIds.includes(statusArchive.completedStatusId);
  const statusIncludesDeleted =
    statusArchive.deletedStatusId != null &&
    fs.activityStatusIds.includes(statusArchive.deletedStatusId);

  const effectiveShowCompleted = hasStatusFilter
    ? statusIncludesCompleted
    : prefs.showCompleted;
  const effectiveShowDeleted = hasStatusFilter
    ? statusIncludesDeleted && canSeeDeleted
    : prefs.showDeleted && canSeeDeleted;

  const trimmedKeyword = prefs.searchKeyword.trim();
  // Report pipeline runs `filterActivityResponsesBySearchKeyword` over categories/tags text.
  // Best-effort: if the user picked exactly one category and left the box empty, search by that label.
  let search: string | undefined = trimmedKeyword || undefined;
  if (!search && fs.categoryNames.length === 1) {
    const only = fs.categoryNames[0]?.trim();
    search = only !== '' ? only : undefined;
  }

  const params: ReportDataRequestParams = {
    page: 1,
    limit: 500,
    search,
    includeCompleted: effectiveShowCompleted,
    includeDeleted: canSeeDeleted ? effectiveShowDeleted : false,
  };

  const dr = fs.dateRange;
  const dateRangeActive =
    dr.startDate !== '' || dr.endDate !== '' || dr.noStartDate || dr.noEndDate;
  if (dateRangeActive) {
    if (!dr.noStartDate && dr.startDate !== '') {
      params.startDateFrom = dr.startDate;
    }
    if (!dr.noEndDate && dr.endDate !== '') {
      params.startDateTo = dr.endDate;
    }
  }

  if (fs.activityStatusIds.length === 1) {
    params.activityStatusId = fs.activityStatusIds[0];
  }
  if (fs.leadMinistryIds.length === 1) {
    params.leadMinistryId = fs.leadMinistryIds[0];
  }
  if (fs.commsContactLeadUserIds.length === 1) {
    params.commsContactLeadUserId = fs.commsContactLeadUserIds[0];
  }
  if (fs.lookAheadSectionValues.length === 1) {
    params.lookAheadSection = fs.lookAheadSectionValues[0] as NonNullable<
      ReportDataQueryParams['lookAheadSection']
    >;
  }

  return params;
}
