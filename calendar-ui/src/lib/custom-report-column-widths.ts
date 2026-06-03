import type { CustomReportFieldConfig } from '@corpcal/shared/reports/customReportFieldConfig';

/** Long narrative fields — comfortable reading width when not overridden. */
const LONG_TEXT_KEYS = new Set([
  'title',
  'summary',
  'executiveSummary',
  'significance',
]);

/** Ministry / location style columns (addresses, ministry names). */
const MEDIUM_WIDTH_KEYS = new Set([
  'leadMinistry',
  'leadMinistryAbbreviation',
  'leadOrg',
  'venueAddress',
]);

/** IDs, dates, times, and compact status / flag columns. */
const SHORT_WIDTH_KEYS = new Set([
  'displayId',
  'startDate',
  'endDate',
  'startTime',
  'endTime',
  'activityStatus',
  'timeStatus',
  'dateStatus',
  'venueStatus',
  'lookAheadStatus',
  'isConfidential',
  'isIssue',
  'isAllDay',
  'premierRequested',
  'translationsRequiredStatus',
  'translationsRequired',
]);

const WIDTH_LONG_DEFAULT = 360;
const WIDTH_MEDIUM_DEFAULT = 200;
const WIDTH_SHORT_DEFAULT = 120;
const WIDTH_FALLBACK_DEFAULT = 160;

/** Default preview / export column width in px when `field.width` is unset. */
export function getDefaultCustomReportColumnWidth(fieldKey: string): number {
  if (LONG_TEXT_KEYS.has(fieldKey)) return WIDTH_LONG_DEFAULT;
  if (MEDIUM_WIDTH_KEYS.has(fieldKey)) return WIDTH_MEDIUM_DEFAULT;
  if (SHORT_WIDTH_KEYS.has(fieldKey)) return WIDTH_SHORT_DEFAULT;
  return WIDTH_FALLBACK_DEFAULT;
}

/** Resolved pixel width: persisted `width` or tier default. */
export function resolveCustomReportColumnWidthPx(
  field: Pick<CustomReportFieldConfig, 'key' | 'width'>
): number {
  if (
    typeof field.width === 'number' &&
    Number.isFinite(field.width) &&
    field.width > 0
  ) {
    return field.width;
  }
  return getDefaultCustomReportColumnWidth(field.key);
}

/** Spreadsheet column character width from pixel width (rough match to Excel). */
export function customReportWidthPxToWch(px: number): number {
  return Math.min(72, Math.max(6, Math.round(px / 7)));
}
