import type { CustomReportFieldConfig } from '@corpcal/shared/reports/customReportFieldConfig';
import {
  downloadReportCsv,
  downloadReportPdf,
  downloadReportXlsx,
  type ReportDataRequestParams,
  type ReportDataResponse,
} from '@/api/reportsApi';
import { loadCustomReportConfig } from '@/lib/custom-report-config-storage';
import { downloadCustomReportXlsx } from '@/lib/custom-report-xlsx';

export type ReportExportFormat = 'pdf' | 'csv' | 'xlsx';

/** Re-export shared template HTML (print preview uses the same layout as server PDF). */
export { getReportTemplateHtml } from '@corpcal/shared/reports/reportPrintHtml';

export async function handleReportExport(options: {
  reportType: string;
  format: ReportExportFormat;
  data: ReportDataResponse | undefined;
  queryParams: ReportDataRequestParams;
  /** When set for `custom` + `xlsx`, matches on-screen preview; otherwise saved config is used. */
  customReportFields?: CustomReportFieldConfig[];
}): Promise<void> {
  const { reportType, format, queryParams, data, customReportFields } = options;

  if (reportType === 'custom' && format === 'xlsx' && data) {
    const activities = data.sections.flatMap((s) => s.activities);
    const config = customReportFields ?? loadCustomReportConfig();
    downloadCustomReportXlsx(activities, config);
    return;
  }

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
