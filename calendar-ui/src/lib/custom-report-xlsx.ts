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

function triggerBrowserDownload(buffer: BlobPart, filename: string): void {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * Client-side Custom Report spreadsheet — aligns with preview cell text from
 * {@link formatCustomReportCell}.
 */
export async function downloadCustomReportXlsx(
  activities: ActivityResponse[],
  config: CustomReportFieldConfig[]
): Promise<void> {
  const { default: ExcelJS } = await import('exceljs');
  const { aoa, columns } = buildSheetAoA(activities, config);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Custom Report');

  for (const row of aoa) {
    sheet.addRow(row);
  }

  if (columns.length > 0) {
    columns.forEach((col, index) => {
      sheet.getColumn(index + 1).width = customReportWidthPxToWch(
        resolveCustomReportColumnWidthPx(col)
      );
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  triggerBrowserDownload(buffer, buildCustomReportXlsxFilename());
}
