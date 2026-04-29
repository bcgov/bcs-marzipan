/**
 * Layout width (CSS px) used when Chromium lays out HTML for PDF export.
 * {@link PdfGeneratorService} viewport width uses this exact value so wrapping
 * matches the downloadable PDF.
 */
export const REPORT_PRINT_LAYOUT_WIDTH_PX = 1024 as const;

/**
 * Max width for `.corpcal-print-root` / `.custom-report-root` — same constraint
 * in Puppeteer PDFs and in-app preview (“Print width” toggle).
 *
 * Derived from {@link REPORT_PRINT_LAYOUT_WIDTH_PX}. `min(100%, …)` keeps narrow
 * viewports usable.
 */
export const REPORT_PRINT_SHEET_CONTENT_MAX_WIDTH_CSS =
  `min(100%, ${REPORT_PRINT_LAYOUT_WIDTH_PX}px)` as const;
