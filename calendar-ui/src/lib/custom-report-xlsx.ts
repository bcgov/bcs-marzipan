import * as XLSX from 'xlsx';

import type { ActivityResponse } from '@corpcal/shared/api/types';
import type { CustomReportFieldConfig } from '@corpcal/shared/reports/customReportFieldConfig';
import {
  customReportWidthPxToWch,
  resolveCustomReportColumnWidthPx,
} from '@/lib/custom-report-column-widths';
import { getSelectedCustomReportColumns } from '@/lib/custom-report-columns';
import { formatCustomReportCell } from '@/lib/custom-report-preview-format';

function buildSheetAoA(
  activities: ActivityResponse[],
  config: CustomReportFieldConfig[]
): { aoa: string[][]; columns: CustomReportFieldConfig[] } {
  const columns = getSelectedCustomReportColumns(config);
  if (columns.length === 0) {
    return {
      aoa: [['Select at least one field in Edit Report to export columns.']],
      columns: [],
    };
  }
  const headers = columns.map((c) => c.label);
  const rows = activities.map((activity) =>
    columns.map((col) => formatCustomReportCell(activity, col.key))
  );
  return { aoa: [headers, ...rows], columns };
}

/** `Custom_Report_YYYY-MM-DD.xlsx` */
export function buildCustomReportXlsxFilename(date: Date = new Date()): string {
  const stamp = date.toISOString().slice(0, 10);
  return `Custom_Report_${stamp}.xlsx`;
}

/**
 * Client-side Custom Report spreadsheet — aligns with preview cell text from
 * {@link formatCustomReportCell}.
 */
export function downloadCustomReportXlsx(
  activities: ActivityResponse[],
  config: CustomReportFieldConfig[]
): void {
  const { aoa, columns } = buildSheetAoA(activities, config);
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  if (columns.length > 0) {
    ws['!cols'] = columns.map((col) => ({
      wch: customReportWidthPxToWch(resolveCustomReportColumnWidthPx(col)),
    }));
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Custom Report');
  XLSX.writeFile(wb, buildCustomReportXlsxFilename());
}
