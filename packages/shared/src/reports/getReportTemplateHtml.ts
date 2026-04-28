import type { ReportDataResponse } from '../api/report-data';
import {
  isReactRenderableReportType,
  PRINT_STYLES,
  renderPrintReportFragmentHtml,
  wrapPrintReportHtmlDocument,
} from './print/react';

/**
 * Options shared by every report template. Currently only the activity base URL
 * is configurable, but the options object is explicit so future flags
 * (font-face injection, locale, etc.) don't require another positional arg.
 */
export interface ReportTemplateOptions {
  /** Absolute URL used when rendering links to activity pages (per deployment env). */
  activityBaseUrl: string;
}

const DEFAULT_OPTIONS: ReportTemplateOptions = {
  activityBaseUrl: '',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isReportDataResponse(data: unknown): data is ReportDataResponse {
  if (!isRecord(data)) return false;
  const { report, sections } = data;
  if (!isRecord(report)) return false;
  if (typeof report.displayName !== 'string') return false;
  if (!Array.isArray(sections)) return false;
  return sections.every(
    (s) =>
      isRecord(s) && typeof s.name === 'string' && Array.isArray(s.activities)
  );
}

/**
 * Maps API report `name` (e.g. look-ahead) to print HTML (preview, PDF, exports).
 *
 * Shared by calendar-ui and calendar-service so the in-app preview and the
 * Puppeteer-generated PDF share the same React component tree. Legacy string
 * builders are retained only for report types that have not yet been migrated.
 */
export function getReportTemplateHtml(
  reportTypeName: string,
  data: unknown,
  options: ReportTemplateOptions = DEFAULT_OPTIONS
): string {
  if (isReactRenderableReportType(reportTypeName)) {
    if (!isReportDataResponse(data)) {
      return `<div class="p-4 text-sm text-gray-600">No report data loaded.</div>`;
    }
    return renderPrintReportFragmentHtml(reportTypeName, data, {
      activityBaseUrl: options.activityBaseUrl,
    });
  }

  return `<div class="p-4 text-sm text-gray-600">No print layout for this report.</div>`;
}

/**
 * Wrap a fragment from {@link getReportTemplateHtml} in a standalone HTML
 * document for headless rendering (Puppeteer). Shared print CSS is injected in
 * `<head>`; callers may additionally supply `fontFaceCss` to embed fonts at
 * render time without bundling binary assets into this package.
 */
export function wrapReportHtmlDocument(
  fragmentHtml: string,
  options: { fontFaceCss?: string } = {}
): string {
  return wrapPrintReportHtmlDocument(fragmentHtml, options);
}

export { PRINT_STYLES };
