import { buildExecLookAheadPrintHTML } from './print/execLookAheadPrintHTML';
import { buildLookAheadLegacyPrintHtml } from './print/lookAheadLegacyPrintHtml';

function formatPlanningStub(data: unknown): string {
  if (data === undefined) return '';
  try {
    return JSON.stringify(data);
  } catch {
    return '["unserializable"]';
  }
}

/** Matches calendar-ui `planningReportTemplate` placeholder output. */
function buildPlanningPrintHtml(data: unknown): string {
  const stub = formatPlanningStub(data);
  const inner =
    stub === ''
      ? 'PLANNING template placeholder'
      : `PLANNING template placeholder<!--${stub}-->`;
  return `<section data-report-template="PLANNING">${inner}</section>`;
}

/**
 * Maps API report `name` (e.g. look-ahead) to print HTML (preview, PDF, exports).
 * Shared by calendar-ui and calendar-service so layout stays identical.
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
      return buildLookAheadLegacyPrintHtml(data);
    case 'planning':
      return buildPlanningPrintHtml(data);
    default:
      return '<div class="p-4 text-sm text-gray-600">No print layout for this report.</div>';
  }
}

/**
 * Wraps fragment HTML from {@link getReportTemplateHtml} in a minimal document for headless PDF.
 */
export function wrapReportHtmlDocument(fragmentHtml: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Report</title></head><body style="margin:0;background:#fff;">${fragmentHtml}</body></html>`;
}
