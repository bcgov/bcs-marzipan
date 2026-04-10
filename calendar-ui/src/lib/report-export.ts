import {
  downloadReportCsv,
  downloadReportPdf,
  downloadReportXlsx,
  type ReportDataRequestParams,
  type ReportDataResponse,
} from '@/api/reportsApi';

export type ReportExportFormat = 'pdf' | 'csv' | 'xlsx';

/** Re-export shared template HTML (print preview uses the same layout as server PDF). */
export { getReportTemplateHtml } from '@corpcal/shared/reports/reportPrintHtml';

export async function handleReportExport(options: {
  reportType: string;
  format: ReportExportFormat;
  data: ReportDataResponse | undefined;
  queryParams: ReportDataRequestParams;
}): Promise<void> {
  const { reportType, format, queryParams } = options;

  switch (format) {
    case 'pdf':
      await downloadReportPdf(reportType, queryParams);
      return;
    case 'csv':
      await downloadReportCsv(reportType, queryParams);
      return;
    case 'xlsx':
      await downloadReportXlsx(reportType, queryParams);
      return;
  }
}
