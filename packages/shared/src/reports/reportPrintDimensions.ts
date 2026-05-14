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

/** US Letter page height at 96 CSS px/in (11in × 96). Used with Puppeteer PDF margins. */
export const REPORT_LETTER_PAGE_HEIGHT_PX = 1056 as const;

/**
 * Max width for `.corpcal-print-root` / `.custom-report-root` — same value in
 * Puppeteer and in-app preview (“PDF width”). Fixed width so the sheet does not
 * shrink below the canonical layout; parents should scroll horizontally when
 * the viewport is narrower.
 */
export const REPORT_PRINT_SHEET_CONTENT_MAX_WIDTH_CSS =
  `${REPORT_PRINT_LAYOUT_WIDTH_PX}px` as const;

/**
 * Horizontal inset for look-ahead PDF cover artwork and overlay coordinates.
 * Matches `.corpcal-print-body` horizontal padding so the cover aligns with report text.
 */
export const REPORT_PRINT_PAGE_HORIZONTAL_INSET_PX = 24 as const;

/**
 * Width inside horizontal insets ({@link REPORT_PRINT_LAYOUT_WIDTH_PX} − 2× {@link REPORT_PRINT_PAGE_HORIZONTAL_INSET_PX}).
 * Look-ahead cover overlay geometry is tuned for this column (see print/react/lookAheadCoverMetrics.ts).
 */
export const REPORT_PRINT_COVER_CONTENT_WIDTH_PX =
  REPORT_PRINT_LAYOUT_WIDTH_PX - 2 * REPORT_PRINT_PAGE_HORIZONTAL_INSET_PX;

/**
 * Top margin for Puppeteer `page.pdf({ margin: { top } })` when using
 * `displayHeaderFooter` + {@link buildLookAheadReportPdfHeaderTemplateHtml}.
 * Must be large enough for the template band; tune if header layout changes.
 */
export const REPORT_PDF_PAGE_HEADER_MARGIN_TOP_PX = 56 as const;
export const REPORT_PDF_PAGE_HEADER_MARGIN_TOP_CSS =
  `${REPORT_PDF_PAGE_HEADER_MARGIN_TOP_PX}px` as const;

/**
 * Bottom margin for Puppeteer `page.pdf({ margin: { bottom } })` when using
 * `displayHeaderFooter` + {@link buildReportPdfFooterTemplateHtml}. Must fit the
 * footer band and leave room above it for the print-only Changed hint / table
 * tails; tune if copy or fonts change.
 */
export const REPORT_PDF_PAGE_FOOTER_MARGIN_BOTTOM_PX = 76 as const;
export const REPORT_PDF_PAGE_FOOTER_MARGIN_BOTTOM_CSS =
  `${REPORT_PDF_PAGE_FOOTER_MARGIN_BOTTOM_PX}px` as const;

/**
 * CSS height for `.corpcal-print-cover-sheet` in `@media print` / Puppeteer PDF.
 * Nominal Letter drawable stripe with header+footer is 924px
 * ({@link REPORT_LETTER_PAGE_HEIGHT_PX} − header − footer); this value is set higher so cover
 * overlay/footer content is not clipped. May paginate if Chromium enforces the physical page box.
 */
export const REPORT_PRINT_PDF_BODY_CONTENT_HEIGHT_PX = 1200 as const;
