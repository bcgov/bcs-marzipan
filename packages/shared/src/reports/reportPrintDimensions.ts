/**
 * Layout width (CSS px) used when Chromium lays out HTML for PDF export and for
 * the virtual PDF page width (1024/96 in), so `.corpcal-print-root` resolves to
 * 1024px in both the in-app “PDF width” preview and the exported file — not
 * `100%` of a smaller Letter+margin content box.
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
