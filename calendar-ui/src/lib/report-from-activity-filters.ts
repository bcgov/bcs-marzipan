import type { ReportDataQueryParams } from '@corpcal/shared/schemas';
import type { ReportDataRequestParams } from '@/api/reportsApi';
import type { ActivityTablePreferences } from '@/hooks/useActivityTablePreferences';

/**
 * Maps activity table preferences (same persisted state as Activity List) to Reports API query params.
 * Only fields supported by {@link FilterActivitiesQueryParams} are sent; multi-select filters that
 * the list applies client-side are included when exactly one value is selected (same idea as
 * narrowing to a single server filter).
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

  const params: ReportDataRequestParams = {
    page: 1,
    limit: 500,
    search: prefs.searchKeyword.trim() || undefined,
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
