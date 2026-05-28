import type { ActivityResponse, ReportResponse } from '../api/types';

export type ReportType = 'LOOK_AHEAD' | 'EXEC' | '30_60_90' | 'PLANNING';

export interface ReportTypeDefaults {
  startDate?: string;
  endDate?: string;
}

export interface ReportTypeConfig {
  fields: readonly string[];
  defaults?: ReportTypeDefaults;
}

/**
 * Code-side report-type configuration used as a fallback when the DB
 * report.config.fields are missing/empty.
 *
 * IMPORTANT: This intentionally does not attempt to re-define full report
 * behavior; it only provides the minimum inputs needed for export/content
 * generators (currently: choosing between `executiveSummary` and `summary`).
 */
export const REPORT_TYPE_CONFIG_MAP: Record<ReportType, ReportTypeConfig> = {
  LOOK_AHEAD: {
    fields: [
      'startDate',
      'endDate',
      'startTime',
      'displayId',
      'title',
      'isConfidential',
      'executiveSummary',
      'event_lead',
      'summary',
      'category',
      'isIssue',
      'newsReleaseOrigin',
      'lookAheadStatus',
      'lookAheadSection',
    ],
  },
  EXEC: {
    fields: [
      'startDate',
      'endDate',
      'startTime',
      'displayId',
      'title',
      'isConfidential',
      'summary',
      'significance',
      'category',
      'isIssue',
      'newsReleaseOrigin',
      'lookAheadStatus',
      'lookAheadSection',
      'lastUpdatedDateTime',
    ],
  },
  '30_60_90': {
    fields: [
      'startDate',
      'endDate',
      'startTime',
      'displayId',
      'title',
      'isConfidential',
      'summary',
      'significance',
      'category',
      'isIssue',
      'strategy',
      'commsMaterials',
      'translationsRequired',
      'commsContact',
      'lastUpdatedDateTime',
    ],
  },
  PLANNING: {
    // Placeholder until DB report types are introduced.
    fields: [
      'startDate',
      'endDate',
      'startTime',
      'displayId',
      'title',
      'isConfidential',
      'summary',
      'category',
      'isIssue',
      'newsReleaseOrigin',
      'strategy',
    ],
  },
};

/**
 * Maps the DB `reports.name` to an internal `ReportType`.
 *
 * Note: `exec` and `planning` are placeholders for future DB entries.
 */
const REPORT_TYPE_BY_DB_REPORT_NAME: Record<string, ReportType> = {
  'look-ahead': 'LOOK_AHEAD',
  'thirty-sixty-ninety': '30_60_90',
  exec: 'EXEC',
  planning: 'PLANNING',
};

export function getReportTypeFromReportName(
  reportName: string
): ReportType | undefined {
  return REPORT_TYPE_BY_DB_REPORT_NAME[reportName];
}

export function getReportTypeConfigByReportName(
  reportName: string
): ReportTypeConfig | undefined {
  const reportType = getReportTypeFromReportName(reportName);
  return reportType ? REPORT_TYPE_CONFIG_MAP[reportType] : undefined;
}

/**
 * Returns report field set to use for export/content rendering.
 *
 * - Prefer `report.config.fields` from API payload (DB config).
 * - Fallback to code-side map based on `report.name`.
 */
export function getEffectiveReportFields(
  report: ReportResponse
): readonly string[] {
  const dbFields = report.config?.fields;
  if (Array.isArray(dbFields) && dbFields.length > 0) return dbFields;

  const fallbackTypeConfig = getReportTypeConfigByReportName(report.name);
  return fallbackTypeConfig?.fields ?? REPORT_TYPE_CONFIG_MAP.LOOK_AHEAD.fields;
}

/**
 * Minimal content selection helper:
 * - Prefer `executiveSummary` if present in effective fields.
 * - Otherwise use `summary` if present in effective fields.
 * - Otherwise default to `executiveSummary` to preserve current behavior.
 */
export function getEffectiveReportDetailText(
  activity: ActivityResponse,
  effectiveFields: readonly string[]
): string | null {
  if (effectiveFields.includes('executiveSummary')) {
    return activity.executiveSummary ?? null;
  }
  if (effectiveFields.includes('summary')) {
    return activity.summary ?? null;
  }
  return activity.executiveSummary ?? null;
}

/** Display name of the comms contact flagged as lead (report field `event_lead`). */
export function getCommsContactLeadDisplayName(
  activity: ActivityResponse
): string | null {
  const raw = activity.commsContacts?.find((c) => c.isLead)?.name?.trim();
  return raw && raw.length > 0 ? raw : null;
}

/** Whether the effective report field list includes event comms lead (`event_lead` or `eventLead`). */
export function effectiveReportFieldsIncludeEventLead(
  effectiveFields: readonly string[]
): boolean {
  return (
    effectiveFields.includes('event_lead') ||
    effectiveFields.includes('eventLead')
  );
}
