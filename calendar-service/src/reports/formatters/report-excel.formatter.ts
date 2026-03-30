import ExcelJS from 'exceljs';

import type { ReportExportTable } from '@corpcal/shared/reports/reportExportFormat';

/**
 * Renders a neutral tabular export to an XLSX workbook (one sheet).
 * Formatting is minimal so consumers can restyle in Excel.
 */
export async function renderReportTableToExcelBuffer(
  table: ReportExportTable,
  sheetName: string
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const safeName =
    sheetName.replace(/[[\]:*?/\\]/g, '_').slice(0, 31) || 'Report';
  const sheet = workbook.addWorksheet(safeName);

  sheet.addRow([...table.columns]);
  for (const row of table.rows) {
    sheet.addRow(row);
  }

  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf);
}
