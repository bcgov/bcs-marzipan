import { REPORT_PRINT_PAGE_HORIZONTAL_INSET_PX } from '../../reportPrintDimensions';
import { BC_LOGO_PRINT_DATA_URL } from './bcLogoPrintDataUrl';
import {
  LOOK_AHEAD_COVER_PDF_HEADER_CONFIDENTIAL_FONT_BASELINE_PX,
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

const LOGO_DISPLAY_HEIGHT_PX = 28 as const;

function escapeHtmlForPdfTemplate(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Puppeteer header for look-ahead family PDFs: BC mark ({@link LOGO_DISPLAY_HEIGHT_PX}px tall)
 * and confidential label ({@link LOOK_AHEAD_COVER_PDF_HEADER_CONFIDENTIAL_FONT_BASELINE_PX} scaled with
 * {@link scaleLookAheadCoverLayoutPx}; uppercase bold, `--corpcal-text-alert` colour inlined as
 * {@link LOOK_AHEAD_COVER_CONFIDENTIAL_COLOR}).
 *
 * Horizontal padding uses {@link REPORT_PRINT_PAGE_HORIZONTAL_INSET_PX} (same value as the print
 * sheet horizontal insets). Runs in Chromium’s isolated header/footer context — inline styles only.
 * Top margin for `page.pdf` must fit this band — see {@link REPORT_PDF_PAGE_HEADER_MARGIN_TOP_CSS}.
 */
export function buildLookAheadReportPdfHeaderTemplateHtml(): string {
  const label = escapeHtmlForPdfTemplate(LOOK_AHEAD_HEADER_CONFIDENTIAL_LABEL);
  const fontPx = scaleLookAheadCoverLayoutPx(
    LOOK_AHEAD_COVER_PDF_HEADER_CONFIDENTIAL_FONT_BASELINE_PX
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
    <img src="${BC_LOGO_PRINT_DATA_URL}" alt="" style="height:${LOGO_DISPLAY_HEIGHT_PX}px;width:auto;max-width:45%;display:block;flex-shrink:0;object-fit:contain;object-position:left center;" />
    <div style="flex:1 1 auto;text-align:right;text-transform:uppercase;font-weight:700;font-size:${fontPx}px;line-height:1.2;color:${LOOK_AHEAD_COVER_CONFIDENTIAL_COLOR};white-space:nowrap;">${label}</div>
  </div>
</div>`;
}
