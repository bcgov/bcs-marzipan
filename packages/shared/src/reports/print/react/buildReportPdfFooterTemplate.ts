import { formatPrintReportGeneratedAt } from './dateFormatters';

function escapeHtmlForPdfTemplate(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * HTML for Puppeteer `page.pdf({ displayHeaderFooter: true, footerTemplate })`.
 * Runs in Chromium's isolated header/footer context — inline styles only; no
 * shared print CSS or `@font-face` from the document apply here.
 *
 * One band: "Last updated …" (left) and page x of y (right). Chromium fills
 * `span.pageNumber` and `span.totalPages` (Puppeteer `PDFOptions.footerTemplate`).
 * The Changed hint line is in the body (`.corpcal-print-pdf-footer-hint-line`).
 * `REPORT_PDF_PAGE_FOOTER_MARGIN_BOTTOM_CSS` should fit this band.
 */
export function buildReportPdfFooterTemplateHtml(generatedAt: Date): string {
  const lastUpdatedInstant = escapeHtmlForPdfTemplate(
    formatPrintReportGeneratedAt(generatedAt)
  );
  return `<div style="box-sizing:border-box;width:100%;margin:0;padding:8px 24px 10px;border-top:1px solid #c5cbd3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:1.45;color:#64748b;background:#fff;">
  <div style="display:flex;flex-wrap:nowrap;justify-content:space-between;align-items:baseline;gap:16px;width:100%;">
    <div style="font-size:12px;color:#0f172a;flex:1 1 auto;min-width:0;">Last updated ${lastUpdatedInstant}</div>
    <div style="font-size:12px;color:#0f172a;flex:0 0 auto;white-space:nowrap;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>
  </div>
</div>`;
}
