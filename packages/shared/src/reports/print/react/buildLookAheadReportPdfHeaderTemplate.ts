import {
  REPORT_PDF_HEADER_CONFIDENTIAL_PRINT_PT,
  REPORT_PDF_HEADER_LOGO_PRINT_PT,
  REPORT_PRINT_BODY_PDF_LAYOUT_TO_LETTER_SCALE,
  REPORT_PRINT_PAGE_HORIZONTAL_INSET_PX,
  reportPdfTemplateCssPxForPrintPt,
} from '../../reportPrintDimensions';
import { BC_LOGO_PRINT_DATA_URL } from './bcLogoPrintDataUrl';
import {
  LOOK_AHEAD_COVER_PDF_HEADER_INNER_ROW_GAP_BASELINE_PX,
  LOOK_AHEAD_COVER_PDF_HEADER_PADDING_BOTTOM_BASELINE_PX,
  LOOK_AHEAD_COVER_PDF_HEADER_PADDING_TOP_BASELINE_PX,
  scaleLookAheadCoverLayoutPx,
} from './lookAheadCoverMetrics';

/** Matches copy on former cover overlay; inlined for Chromium header/footer context. */
const LOOK_AHEAD_HEADER_CONFIDENTIAL_LABEL =
  'CONFIDENTIAL - NOT FOR CIRCULATION' as const;

/** Design token `--corpcal-text-alert` / `--bcsds-red-60` — cover confidential flag uses this colour. */
const LOOK_AHEAD_COVER_CONFIDENTIAL_COLOR = '#ce3e39' as const;

function escapeHtmlForPdfTemplate(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type BuildLookAheadReportPdfHeaderTemplateOptions = {
  /** Layout→Letter scale for this PDF pass (body vs cover). Default: body scale. */
  pdfLayoutToLetterScale?: number;
};

/**
 * Puppeteer header for look-ahead family PDFs: BC mark and confidential label sized for
 * target print pt on Letter ({@link REPORT_PDF_HEADER_LOGO_PRINT_PT},
 * {@link REPORT_PDF_HEADER_CONFIDENTIAL_PRINT_PT}), independent of body layout width.
 *
 * Horizontal padding uses {@link REPORT_PRINT_PAGE_HORIZONTAL_INSET_PX}. Runs in Chromium’s
 * isolated header/footer context — inline styles only.
 */
export function buildLookAheadReportPdfHeaderTemplateHtml(
  options: BuildLookAheadReportPdfHeaderTemplateOptions = {}
): string {
  const pdfLayoutToLetterScale =
    options.pdfLayoutToLetterScale ??
    REPORT_PRINT_BODY_PDF_LAYOUT_TO_LETTER_SCALE;
  const label = escapeHtmlForPdfTemplate(LOOK_AHEAD_HEADER_CONFIDENTIAL_LABEL);
  const fontPx = reportPdfTemplateCssPxForPrintPt(
    REPORT_PDF_HEADER_CONFIDENTIAL_PRINT_PT,
    pdfLayoutToLetterScale
  );
  const logoHeightPx = reportPdfTemplateCssPxForPrintPt(
    REPORT_PDF_HEADER_LOGO_PRINT_PT,
    pdfLayoutToLetterScale
  );
  const padTop = scaleLookAheadCoverLayoutPx(
    LOOK_AHEAD_COVER_PDF_HEADER_PADDING_TOP_BASELINE_PX
  );
  const padBottom = scaleLookAheadCoverLayoutPx(
    LOOK_AHEAD_COVER_PDF_HEADER_PADDING_BOTTOM_BASELINE_PX
  );
  const rowGap = scaleLookAheadCoverLayoutPx(
    LOOK_AHEAD_COVER_PDF_HEADER_INNER_ROW_GAP_BASELINE_PX
  );
  return `<div style="box-sizing:border-box;width:100%;margin:0;padding:${padTop}px ${REPORT_PRINT_PAGE_HORIZONTAL_INSET_PX}px ${padBottom}px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:#fff;">
  <div style="display:flex;flex-direction:row;justify-content:space-between;align-items:center;width:100%;gap:${rowGap}px;">
    <img src="${BC_LOGO_PRINT_DATA_URL}" alt="" style="height:${logoHeightPx}px;width:auto;max-width:45%;display:block;flex-shrink:0;object-fit:contain;object-position:left center;" />
    <div style="flex:1 1 auto;text-align:right;text-transform:uppercase;font-weight:700;font-size:${fontPx}px;line-height:1.2;color:${LOOK_AHEAD_COVER_CONFIDENTIAL_COLOR};white-space:nowrap;">${label}</div>
  </div>
</div>`;
}
