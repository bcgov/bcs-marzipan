import {
  formatPrintReportGeneratedAt,
  PRINT_FOOTER_CHANGED_EXPLANATION,
} from './dateFormatters';

function escapeHtmlForPdfTemplate(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * HTML for Puppeteer `page.pdf({ displayHeaderFooter: true, footerTemplate })`.
 * Runs in Chromium’s isolated header/footer context — inline styles only; no
 * shared print CSS or `@font-face` from the document apply here.
 *
 * Draft/confidential footer appears only here and in Chromium’s footer margin,
 * not in the report HTML body. `REPORT_PDF_PAGE_FOOTER_MARGIN_BOTTOM_CSS` in
 * `reportPrintDimensions.ts` should fit this block’s height.
 */
export function buildReportPdfFooterTemplateHtml(generatedAt: Date): string {
  const timestamp = escapeHtmlForPdfTemplate(
    formatPrintReportGeneratedAt(generatedAt)
  );
  const hint = escapeHtmlForPdfTemplate(PRINT_FOOTER_CHANGED_EXPLANATION);
  return `<div style="box-sizing:border-box;width:100%;margin:0;padding:10px 24px 12px;border-top:1px solid #c5cbd3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:1.45;color:#64748b;background:#fff;">
  <div style="font-weight:700;font-size:12px;color:#b91c1c;letter-spacing:0.04em;">DRAFT AND CONFIDENTIAL</div>
  <div style="margin-top:4px;font-size:12px;color:#0f172a;">${timestamp}</div>
  <div style="margin-top:4px;font-size:12px;">${hint}</div>
</div>`;
}
