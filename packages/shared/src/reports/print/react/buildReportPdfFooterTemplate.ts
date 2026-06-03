import {
  REPORT_PDF_FOOTER_HINT_PRINT_PT,
  REPORT_PDF_FOOTER_MAIN_PRINT_PT,
  REPORT_PRINT_BODY_PDF_LAYOUT_TO_LETTER_SCALE,
  REPORT_PRINT_PAGE_HORIZONTAL_INSET_PX,
  reportPdfTemplateCssPxForPrintPt,
} from '../../reportPrintDimensions';
import {
  formatPrintReportGeneratedAt,
  PRINT_FOOTER_CHANGED_EXPLANATION_BODY,
} from './dateFormatters';

function escapeHtmlForPdfTemplate(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type BuildReportPdfFooterTemplateOptions = {
  /**
   * When false, omits the `Changed` glossary line (standalone cover merges, etc.).
   * Default true.
   */
  includeChangedHint?: boolean;
  /** Layout→Letter scale for the body PDF pass. Default: body scale. */
  pdfLayoutToLetterScale?: number;
};

/**
 * HTML for Puppeteer `page.pdf({ displayHeaderFooter: true, footerTemplate })`.
 * Runs in Chromium's isolated header/footer context — inline styles only; no
 * shared print CSS or `@font-face` from the document apply here.
 */
export function buildReportPdfFooterTemplateHtml(
  generatedAt: Date,
  options: BuildReportPdfFooterTemplateOptions = {}
): string {
  const includeChangedHint = options.includeChangedHint !== false;
  const pdfLayoutToLetterScale =
    options.pdfLayoutToLetterScale ??
    REPORT_PRINT_BODY_PDF_LAYOUT_TO_LETTER_SCALE;
  const mainFontPx = reportPdfTemplateCssPxForPrintPt(
    REPORT_PDF_FOOTER_MAIN_PRINT_PT,
    pdfLayoutToLetterScale
  );
  const hintFontPx = reportPdfTemplateCssPxForPrintPt(
    REPORT_PDF_FOOTER_HINT_PRINT_PT,
    pdfLayoutToLetterScale
  );
  const lastUpdatedInstant = escapeHtmlForPdfTemplate(
    formatPrintReportGeneratedAt(generatedAt)
  );
  const explanation = escapeHtmlForPdfTemplate(
    PRINT_FOOTER_CHANGED_EXPLANATION_BODY
  );

  const hintAndDivider = includeChangedHint
    ? `<div style="font-weight:400;font-size:${hintFontPx}px;line-height:1.35;color:#64748b;">* <strong style="font-weight:700;color:#64748b;">Changed</strong> ${explanation}</div><div style="height:0;margin:4px -4px;border-top:1px solid #c5cbd3;" aria-hidden="true"></div>`
    : '';

  const mainRow = `<div style="display:flex;flex-wrap:nowrap;justify-content:space-between;align-items:baseline;gap:16px;width:100%;font-size:${mainFontPx}px;line-height:1.45;color:#64748b;">
    <div style="color:#0f172a;flex:1 1 auto;min-width:0;">Last updated ${lastUpdatedInstant}</div>
    <div style="color:#0f172a;flex:0 0 auto;white-space:nowrap;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>
  </div>`;

  return `<div style="box-sizing:border-box;width:100%;margin:0;padding:8px ${REPORT_PRINT_PAGE_HORIZONTAL_INSET_PX}px 10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:#fff;">${hintAndDivider}${mainRow}</div>`;
}
