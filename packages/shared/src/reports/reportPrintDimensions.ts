/** Body `font-size` in print CSS (`--print-body-font-size`). */
export const REPORT_PRINT_BODY_FONT_SIZE_PX = 16 as const;

/** Target body size on exported Letter PDF at {@link REPORT_PRINT_BODY_FONT_SIZE_PX}. */
export const REPORT_PRINT_BODY_TARGET_PRINT_PT = 10.5 as const;

/**
 * US Letter content width at 96 CSS px/in with zero margins (8.5in × 96).
 */
export const REPORT_LETTER_CONTENT_WIDTH_PX = 816 as const;

/**
 * Canonical layout width (CSS px) for report body HTML: Puppeteer viewport and the
 * in-app “PDF width” preview. WYSIWYG line breaks are computed at this width.
 *
 * `REPORT_PRINT_BODY_FONT_SIZE_PX × REPORT_LETTER_CONTENT_WIDTH_PX / width` →
 * {@link REPORT_PRINT_BODY_TARGET_PRINT_PT} on Letter after Puppeteer scaling
 * (933 = round(16 × 816 / 14)).
 */
export const REPORT_PRINT_LAYOUT_WIDTH_PX = 933 as const;

/** US Letter page height at 96 CSS px/in (11in × 96). Used with Puppeteer PDF margins. */
export const REPORT_LETTER_PAGE_HEIGHT_PX = 1056 as const;

/**
 * Look-ahead cover sheet width — independent of {@link REPORT_PRINT_LAYOUT_WIDTH_PX} so
 * cover artwork/overlay typography stay at their tuned size when body layout narrows.
 */
export const REPORT_PRINT_COVER_SHEET_WIDTH_PX = 1024 as const;

/**
 * Max width for `.corpcal-print-root` / `.custom-report-root` — same value in
 * Puppeteer body PDF and in-app preview (“PDF width”). Fixed width so the sheet does not
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
 * Width inside horizontal insets on the cover sheet
 * ({@link REPORT_PRINT_COVER_SHEET_WIDTH_PX} − 2× {@link REPORT_PRINT_PAGE_HORIZONTAL_INSET_PX}).
 * Look-ahead cover overlay geometry is tuned for this column (see print/react/lookAheadCoverMetrics.ts).
 */
export const REPORT_PRINT_COVER_CONTENT_WIDTH_PX =
  REPORT_PRINT_COVER_SHEET_WIDTH_PX - 2 * REPORT_PRINT_PAGE_HORIZONTAL_INSET_PX;

/** Puppeteer `scale` mapping a layout viewport width onto Letter content width. */
export function reportPdfLayoutToLetterScale(layoutWidthPx: number): number {
  return REPORT_LETTER_CONTENT_WIDTH_PX / layoutWidthPx;
}

export const REPORT_PRINT_BODY_PDF_LAYOUT_TO_LETTER_SCALE =
  reportPdfLayoutToLetterScale(REPORT_PRINT_LAYOUT_WIDTH_PX);

export const REPORT_PRINT_COVER_PDF_LAYOUT_TO_LETTER_SCALE =
  reportPdfLayoutToLetterScale(REPORT_PRINT_COVER_SHEET_WIDTH_PX);

/**
 * CSS px for Puppeteer header/footer inline styles so text renders at `printPt` on the
 * exported PDF given the layout→Letter scale for that pass.
 */
export function reportPdfTemplateCssPxForPrintPt(
  printPt: number,
  pdfLayoutToLetterScale: number
): number {
  const printCssPx = (printPt * 96) / 72;
  return Math.round(printCssPx / pdfLayoutToLetterScale);
}

/**
 * PDF header/footer print sizes (pt on Letter). Baseline was ~7.17pt at 14px body / 1024 layout;
 * scaled by 16/14, rounded to whole or .5 pt.
 */
export const REPORT_PDF_HEADER_CONFIDENTIAL_PRINT_PT = 8.5 as const;
export const REPORT_PDF_HEADER_LOGO_PRINT_PT = 19 as const;
export const REPORT_PDF_FOOTER_MAIN_PRINT_PT = 8.5 as const;
export const REPORT_PDF_FOOTER_HINT_PRINT_PT = 8 as const;

/** Look-ahead cover overlay footer note (`corpcal-print-cover-footer-note`) on Letter PDF. */
export const LOOK_AHEAD_COVER_FOOTER_PRINT_PT = 12 as const;

/** Look-ahead cover overlay date, contents heading, and list on Letter PDF. */
export const LOOK_AHEAD_COVER_CONTENTS_PRINT_PT = 14 as const;

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
 * “Last updated” row, divider, and `Changed` hint (all in the footer template);
 * tune if copy or fonts change.
 */
export const REPORT_PDF_PAGE_FOOTER_MARGIN_BOTTOM_PX = 94 as const;
export const REPORT_PDF_PAGE_FOOTER_MARGIN_BOTTOM_CSS =
  `${REPORT_PDF_PAGE_FOOTER_MARGIN_BOTTOM_PX}px` as const;

/**
 * CSS height for `.corpcal-print-cover-sheet` in `@media print` / Puppeteer PDF.
 * Nominal Letter drawable stripe with header+footer is 924px
 * ({@link REPORT_LETTER_PAGE_HEIGHT_PX} − header − footer); this value is set higher so cover
 * overlay/footer content is not clipped. May paginate if Chromium enforces the physical page box.
 */
export const REPORT_PRINT_PDF_BODY_CONTENT_HEIGHT_PX = 1200 as const;
