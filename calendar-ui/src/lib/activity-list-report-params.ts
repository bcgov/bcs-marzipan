import {
  activityFilterStateToQueryParams,
  isDateRangeActive,
} from '@corpcal/shared';
import type { ReportDataRequestParams } from '@/api/reportsApi';
import type { ActivityTablePreferences } from '@/lib/activityTablePreferencesParams';
import { buildDefaultFilterDateRangeForReport } from '@/lib/report-preferences-defaults';
import { stableSerializeReportQueryParams } from '@/lib/report-query-params';

/** Opens the activity-list report dialog when present on `/`. Not an activity-table preference param. */
export const URL_PARAM_ACTIVITY_LIST_REPORT = 'report';

export const ACTIVITY_LIST_REPORT_NAMES = [
  'planning',
  'thirty-sixty-ninety',
  'custom',
] as const;

export type ActivityListReportName =
  (typeof ACTIVITY_LIST_REPORT_NAMES)[number];

export function isActivityListReportName(
  value: string | null | undefined
): value is ActivityListReportName {
  if (!value) return false;
  return (ACTIVITY_LIST_REPORT_NAMES as readonly string[]).includes(value);
}

export function getReportExportConfig(reportType: string): {
  label: string;
  format: 'pdf' | 'xlsx';
} {
  if (reportType === 'custom') {
    return { label: 'Export XLSX', format: 'xlsx' };
  }
  return { label: 'Export PDF', format: 'pdf' };
}

export type ActivityListReportStatusArchiveIds = {
  completedStatusId?: number;
  deletedStatusId?: number;
};

export function buildActivityListReportFetchParams(
  preferences: Pick<ActivityTablePreferences, 'filterState'>,
  statusArchiveIds: ActivityListReportStatusArchiveIds,
  canViewDeleted: boolean
): ReportDataRequestParams {
  return activityFilterStateToQueryParams(
    { filterState: preferences.filterState },
    statusArchiveIds,
    canViewDeleted
  );
}

export function activityListReportFetchParamsKey(
  params: ReportDataRequestParams
): string {
  return stableSerializeReportQueryParams(params);
}

/**
 * Snapshot list preferences into ephemeral dialog state. Seeds report default
 * dates when the list has no active scheduled date range.
 */
export function snapshotPreferencesForReportDialog(
  listPrefs: ActivityTablePreferences,
  reportName: string
): ActivityTablePreferences {
  const snapshot = structuredClone(listPrefs);
  if (!isDateRangeActive(snapshot.filterState.dateRange)) {
    snapshot.filterState.dateRange =
      buildDefaultFilterDateRangeForReport(reportName);
  }
  return snapshot;
}
