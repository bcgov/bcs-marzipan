/**
 * Canonical layout width (CSS px) for print HTML: Puppeteer viewport and the
 * in-app “PDF width” preview. WYSIWYG line breaks are computed at this width.
 */
export const REPORT_PRINT_LAYOUT_WIDTH_PX = 1024 as const;

/**
 * US Letter content width at 96 CSS px/in with zero margins (8.5in × 96).
 * Used only to scale PDF output to fit the physical page while layout stays at
 * {@link REPORT_PRINT_LAYOUT_WIDTH_PX}.
 */
export const REPORT_LETTER_CONTENT_WIDTH_PX = 816 as const;

/**
 * Max width for `.corpcal-print-root` / `.custom-report-root` — same value in
 * Puppeteer and in-app preview (“PDF width”). Fixed width so the sheet does not
 * shrink below the canonical layout; parents should scroll horizontally when
 * the viewport is narrower.
 */
export const REPORT_PRINT_SHEET_CONTENT_MAX_WIDTH_CSS =
  `${REPORT_PRINT_LAYOUT_WIDTH_PX}px` as const;

/**
 * Bottom margin for Puppeteer `page.pdf({ margin: { bottom } })` when using
 * `displayHeaderFooter` + {@link buildReportPdfFooterTemplateHtml}. Must be
 * large enough for the template block; tune if footer copy or font size changes.
 */
export const REPORT_PDF_PAGE_FOOTER_MARGIN_BOTTOM_CSS = '108px' as const;
