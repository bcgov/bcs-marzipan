import type { ActivityResponse, ReportResponse } from '../api/types';
import { isCalendarDateString } from '../datetime';
import {
  getEffectiveReportDetailText,
  getEffectiveReportFields,
} from './reportTypeConfig';

/** Default column headers for tabular report exports (CSV, Excel, PDF table). */
export const REPORT_EXPORT_COLUMNS = [
  'Section',
  'Date',
  'Time',
  'Status',
  'Activity Details',
  'Ref #',
  'MIN',
] as const;

export interface ReportExportTable {
  columns: readonly string[];
  rows: string[][];
}

/**
 * Minimal shape needed to build export rows (API report payload, independent of UI).
 */
export interface ReportExportSource {
  report: ReportResponse;
  sections: Array<{
    name: string;
    activities: ActivityResponse[];
  }>;
}

function escapeCsvCell(str: string): string {
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Builds a rectangular table from report API data. Same row logic as legacy CSV.
 */
export function buildReportExportTable(
  source: ReportExportSource
): ReportExportTable {
  const effectiveFields = getEffectiveReportFields(source.report);
  const rows: string[][] = [];

  for (const section of source.sections) {
    for (const activity of section.activities) {
      // Calendar dates are wire-format `YYYY-MM-DD`; pass them through to
      // export verbatim so the column matches the API value and never depends
      // on `process.env.TZ`.
      const date =
        activity.startDate && isCalendarDateString(activity.startDate)
          ? activity.startDate
          : '';
      const time = activity.startTime || '';
      const status = activity.lookAheadStatus || '';
      const detailText = getEffectiveReportDetailText(
        activity,
        effectiveFields
      );
      const details = [activity.title, detailText].filter(Boolean).join(' – ');
      const ref = activity.displayId || '';
      const min = activity.displayId
        ? activity.displayId.split('-')[0] || ''
        : '';

      rows.push([section.name, date, time, status, details, ref, min]);
    }
  }

  return { columns: REPORT_EXPORT_COLUMNS, rows };
}

/**
 * Serializes a {@link ReportExportTable} to CSV text (RFC-style quoting).
 */
export function serializeReportTableToCsv(table: ReportExportTable): string {
  const lines: string[] = [
    table.columns.map((c) => escapeCsvCell(c)).join(','),
  ];
  for (const row of table.rows) {
    lines.push(row.map((cell) => escapeCsvCell(cell)).join(','));
  }
  return lines.join('\n');
}
