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
};

/**
 * HTML for Puppeteer `page.pdf({ displayHeaderFooter: true, footerTemplate })`.
 * Runs in Chromium's isolated header/footer context — inline styles only; no
 * shared print CSS or `@font-face` from the document apply here.
 *
 * Top row: “Last updated …” (left) and page x of y (right). A divider
 * separates that row from the optional `Changed` hint so the hint reads like
 * a secondary note without overlapping the printable body.
 * Chromium fills `span.pageNumber` and `span.totalPages`.
 * {@link REPORT_PDF_PAGE_FOOTER_MARGIN_BOTTOM_CSS} should fit this band.
 */
export function buildReportPdfFooterTemplateHtml(
  generatedAt: Date,
  options: BuildReportPdfFooterTemplateOptions = {}
): string {
  const includeChangedHint = options.includeChangedHint !== false;
  const lastUpdatedInstant = escapeHtmlForPdfTemplate(
    formatPrintReportGeneratedAt(generatedAt)
  );
  const explanation = escapeHtmlForPdfTemplate(
    PRINT_FOOTER_CHANGED_EXPLANATION_BODY
  );

  /* Tight spacing under “Last updated” so the divider reads as separating two footer zones. */
  const hintBlock = includeChangedHint
    ? `<div style="margin-top:5px;padding-top:5px;border-top:1px solid #c5cbd3;font-weight:400;font-size:11.5px;line-height:1.35;color:#64748b;">* <strong style="font-weight:700;color:#64748b;">Changed</strong> ${explanation}</div>`
    : '';

  /* No outer border-top: Chromium’s margin separates body from footer; divider is internal. */
  return `<div style="box-sizing:border-box;width:100%;margin:0;padding:8px 24px 10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:#fff;">
  <div style="display:flex;flex-wrap:nowrap;justify-content:space-between;align-items:baseline;gap:16px;width:100%;font-size:12px;line-height:1.45;color:#64748b;">
    <div style="color:#0f172a;flex:1 1 auto;min-width:0;">Last updated ${lastUpdatedInstant}</div>
    <div style="color:#0f172a;flex:0 0 auto;white-space:nowrap;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>
  </div>${hintBlock}
</div>`;
}
