import {
  downloadReportCsv,
  downloadReportXlsx,
  type ReportDataRequestParams,
  type ReportDataResponse,
} from '@/api/reportsApi';
import { buildExecLookAheadPrintHTML } from '@/lib/report-templates/execLookAheadPrintHTML';
import { generateReportHTML } from '@/lib/report-templates/generateReportHTML';
import { buildLookAheadLegacyPrintHtml } from '@/lib/report-templates/lookAheadLegacyPrintHtml';

export type ReportExportFormat = 'pdf' | 'csv' | 'xlsx';

/**
 * Maps API report `name` (e.g. look-ahead) to the dedicated print HTML builder.
 * Templates are the single source of truth for layout (preview + PDF via print).
 */
export function getReportTemplateHtml(
  reportTypeName: string,
  data: unknown
): string {
  switch (reportTypeName) {
    case 'look-ahead':
      return buildLookAheadLegacyPrintHtml(data);
    case 'exec-look-ahead':
    case 'exec':
      return buildExecLookAheadPrintHTML(data);
    case 'thirty-sixty-ninety':
      // thirtySixtyNinetyPrintHTML.ts should export a dedicated builder; until it is a clean ES module, reuse legacy HTML.
      return buildLookAheadLegacyPrintHtml(data);
    case 'planning': {
      const out = generateReportHTML('PLANNING', data);
      return typeof out === 'string' ? out : '';
    }
    default:
      return '<div class="p-4 text-sm text-gray-600">No print layout for this report.</div>';
  }
}

/**
 * Opens a new window with the template HTML and triggers the browser print dialog (Save as PDF).
 */
export function printReportHtmlInNewWindow(html: string): void {
  const w = window.open('', '_blank');
  if (!w) {
    throw new Error(
      'Unable to open print window. Allow pop-ups for this site and try again.'
    );
  }
  w.document.open();
  w.document.write(
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Report</title></head><body style="margin:0;background:#fff;">${html}</body></html>`
  );
  w.document.close();
  const doPrint = () => {
    w.focus();
    w.print();
  };
  if (w.document.readyState === 'complete') {
    setTimeout(doPrint, 0);
  } else {
    w.addEventListener('load', () => setTimeout(doPrint, 0));
  }
}

export async function handleReportExport(options: {
  reportType: string;
  format: ReportExportFormat;
  data: ReportDataResponse | undefined;
  queryParams: ReportDataRequestParams;
}): Promise<void> {
  const { reportType, format, data, queryParams } = options;

  switch (format) {
    case 'pdf': {
      if (!data) {
        throw new Error('Report data is not loaded yet.');
      }
      const html = getReportTemplateHtml(reportType, data).trim();
      if (!html) {
        throw new Error('No printable HTML for this report.');
      }
      printReportHtmlInNewWindow(html);
      return;
    }
    case 'csv':
      await downloadReportCsv(reportType, queryParams);
      return;
    case 'xlsx':
      await downloadReportXlsx(reportType, queryParams);
      return;
  }
}
