import { renderToStaticMarkup } from 'react-dom/server';

import type { ReportDataResponse } from '../../../api/report-data';
import { PRINT_FOOTER_CHANGED_EXPLANATION_BODY } from './dateFormatters';
import { CUSTOM_REPORT_PRINT_STYLES } from './customReportPrintStyles';
import { PrintCustomReportDocument } from './PrintCustomReportDocument';
import { PrintPlanningDocument } from './PrintPlanningDocument';
import { PrintReportDocument } from './PrintReportDocument';
import { CORPCAL_PRINT_ROOT_CLASS, PRINT_STYLES } from './printStyles';
import type { PrintReportVariant } from './rowViewModel';
import type { TranslationLanguageLabelResolver } from './translationLanguageDisplayLabels';

export { CUSTOM_REPORT_PRINT_STYLES } from './customReportPrintStyles';
export { CORPCAL_PRINT_ROOT_CLASS, PRINT_STYLES } from './printStyles';

/** Report types supported by the shared React print/PDF pipeline. */
export type ReactRenderableReportType =
  | 'look-ahead'
  | 'thirty-sixty-ninety'
  | 'exec'
  | 'planning'
  | 'custom';

export interface RenderReportOptions {
  activityBaseUrl: string;
  /** Maps `translationsRequired` shortcodes to lookup display names for Look Ahead print. */
  resolveTranslationLanguageLabel?: TranslationLanguageLabelResolver;
}

/**
 * Browser print / in-app preview only: Puppeteer PDFs embed the same copy in
 * {@link buildReportPdfFooterTemplateHtml} so the hint stays in the footer
 * band and cannot overlap body content (see `.corpcal-print-pdf-footer-hint-line`).
 *
 * Wrapped HTML for headless PDF no longer inserts this component.
 */
export function PrintPdfFooterHintLine() {
  return (
    <div className="corpcal-print-pdf-footer-hint-line" aria-hidden="true">
      * <strong>Changed</strong> {PRINT_FOOTER_CHANGED_EXPLANATION_BODY}
    </div>
  );
}

export function printPdfFooterHintLineHtml(): string {
  return renderToStaticMarkup(<PrintPdfFooterHintLine />);
}

const REPORT_TYPE_TO_VARIANT: Record<
  Exclude<ReactRenderableReportType, 'planning' | 'custom'>,
  PrintReportVariant
> = {
  'look-ahead': 'lookAhead',
  'thirty-sixty-ninety': 'thirtySixtyNinety',
  exec: 'execLookAhead',
};

const REACT_RENDERABLE_REPORT_TYPES = new Set<string>([
  ...Object.keys(REPORT_TYPE_TO_VARIANT),
  'planning',
  'custom',
]);

/** Maps rollup print `ReactRenderableReportType` to row layout variant (excludes planning/custom). */
export function rollupPrintVariantForReportType(
  reportTypeName: Exclude<ReactRenderableReportType, 'planning' | 'custom'>
): PrintReportVariant {
  return REPORT_TYPE_TO_VARIANT[reportTypeName];
}

export function isReactRenderableReportType(
  reportTypeName: string
): reportTypeName is ReactRenderableReportType {
  return REACT_RENDERABLE_REPORT_TYPES.has(reportTypeName);
}

/**
 * Render the print document fragment for a report type. Caller is responsible
 * for wrapping the fragment in an HTML document (see {@link renderPrintReportDocumentHtml}).
 */
export function renderPrintReportFragmentHtml(
  reportTypeName: ReactRenderableReportType,
  data: ReportDataResponse,
  options: RenderReportOptions
): string {
  if (reportTypeName === 'planning') {
    return renderToStaticMarkup(<PrintPlanningDocument />);
  }

  if (reportTypeName === 'custom') {
    return renderToStaticMarkup(
      <PrintCustomReportDocument data={data} />
    );
  }

  const variant = REPORT_TYPE_TO_VARIANT[reportTypeName];
  return renderToStaticMarkup(
    <PrintReportDocument
      data={data}
      variant={variant}
      activityBaseUrl={options.activityBaseUrl}
      resolveTranslationLanguageLabel={options.resolveTranslationLanguageLabel}
    />
  );
}

/**
 * Render the full standalone HTML document (DOCTYPE, head, body, styles).
 * Use this when handing HTML to Puppeteer or embedding in an iframe / preview
 * pane that should not inherit surrounding app styles.
 *
 * `fontFaceCss` lets callers inject an environment-specific `@font-face` block
 * (e.g. `data:` URLs for server-side PDF rendering) without the shared package
 * needing to know about filesystem paths.
 */
export function renderPrintReportDocumentHtml(
  reportTypeName: ReactRenderableReportType,
  data: ReportDataResponse,
  options: RenderReportOptions & {
    fontFaceCss?: string;
    coverPageHtml?: string;
  }
): string {
  const fragment = renderPrintReportFragmentHtml(reportTypeName, data, options);
  return wrapPrintReportHtmlDocument(fragment, {
    fontFaceCss: options.fontFaceCss,
    coverPageHtml: options.coverPageHtml,
  });
}

/**
 * Wraps an already-rendered print fragment in a standalone HTML document with
 * the shared print styles (and optional `@font-face` block) injected in `<head>`.
 * Exposed so callers that render the fragment at build-time (tests, snapshots)
 * can share the same document shell.
 */
export type WrapPrintReportHtmlDocumentOptions = {
  fontFaceCss?: string;
  /** Prepended inside `<body>` before the report fragment (e.g. PDF-only cover). */
  coverPageHtml?: string;
  /**
   * Sets a body class so standalone cover PDF CSS can relax `.corpcal-print-cover-sheet`
   * break-after (no forced blank page when this HTML is cover-only).
   */
  coverStandalonePdf?: boolean;
};

export function wrapPrintReportHtmlDocument(
  fragmentHtml: string,
  options: WrapPrintReportHtmlDocumentOptions = {}
): string {
  const fontFaceCss = options.fontFaceCss ?? '';
  const coverPageHtml = options.coverPageHtml ?? '';
  const bodyClass = options.coverStandalonePdf
    ? 'corpcal-print-pdf-cover-sheet-only-doc'
    : '';
  const bodyClassAttr = bodyClass ? ` class="${bodyClass}"` : '';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Report</title><style>${fontFaceCss}${PRINT_STYLES}${CUSTOM_REPORT_PRINT_STYLES}</style></head><body${bodyClassAttr} style="margin:0;background:#fff;">${coverPageHtml}${fragmentHtml}</body></html>`;
}

/** Back-compat utility: `CORPCAL_PRINT_ROOT_CLASS` as a namespaced selector value. */
export function printRootClassName(): string {
  return CORPCAL_PRINT_ROOT_CLASS;
}
