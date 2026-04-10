import type { ReportDataRequestParams } from '@/api/reportsApi';

/** Query key used for the report type on `/reports/print-preview`. Not sent to the report API. */
export const REPORT_PRINT_PREVIEW_TYPE_PARAM = 'type';

const NUMERIC_REPORT_PARAM_KEYS = new Set([
  'page',
  'limit',
  'activityStatusId',
  'leadMinistryId',
  'leadTeamId',
  'commsContactLeadUserId',
  'sharedWithTeamId',
]);

const BOOLEAN_REPORT_PARAM_KEYS = new Set([
  'includeCompleted',
  'includeDeleted',
  'isIssue',
]);

/**
 * Appends {@link ReportDataRequestParams} to a URLSearchParams instance for navigation
 * (same shape as `GET /reports/data/:type` query string).
 */
export function appendReportDataRequestParams(
  target: URLSearchParams,
  params: ReportDataRequestParams
): void {
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      target.set(key, value.join(','));
    } else if (typeof value === 'boolean') {
      target.set(key, value ? 'true' : 'false');
    } else {
      target.set(key, String(value));
    }
  }
}

/**
 * Reads report API query params from the print-preview URL (excludes `type`).
 * Starts from `Object.fromEntries` (same keys as the address bar); coerces types
 * to match what axios/backend expect from query strings.
 */
export function parseReportDataRequestParamsFromUrl(
  searchParams: URLSearchParams
): ReportDataRequestParams {
  const flat = Object.fromEntries(searchParams.entries()) as Record<
    string,
    string
  >;
  const { [REPORT_PRINT_PREVIEW_TYPE_PARAM]: _type, ...rest } = flat;

  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(rest)) {
    if (value === '') continue;
    if (BOOLEAN_REPORT_PARAM_KEYS.has(key)) {
      out[key] = value === 'true';
    } else if (NUMERIC_REPORT_PARAM_KEYS.has(key)) {
      const n = Number(value);
      if (!Number.isNaN(n)) out[key] = n;
    } else {
      out[key] = value;
    }
  }
  return out as ReportDataRequestParams;
}
