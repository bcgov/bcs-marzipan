import { BC_LOGO_PRINT_DATA_URL } from './bcLogoPrintDataUrl';
import { lookAheadCoverLayoutPx } from './lookAheadCoverLayout';

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
 * and confidential label ({@link lookAheadCoverLayoutPx} from 8 Figma px cover scale; uppercase bold,
 * `--corpcal-text-alert` colour inlined as {@link LOOK_AHEAD_COVER_CONFIDENTIAL_COLOR}).
 *
 * Runs in Chromium’s isolated header/footer context — inline styles only.
 * {@link REPORT_PDF_PAGE_HEADER_MARGIN_TOP_CSS} should fit this block’s height.
 */
export function buildLookAheadReportPdfHeaderTemplateHtml(): string {
  const label = escapeHtmlForPdfTemplate(LOOK_AHEAD_HEADER_CONFIDENTIAL_LABEL);
  const fontPx = lookAheadCoverLayoutPx(8);
  return `<div style="box-sizing:border-box;width:100%;margin:0;padding:8px 24px 10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:#fff;">
  <div style="display:flex;flex-direction:row;justify-content:space-between;align-items:center;width:100%;gap:16px;">
    <img src="${BC_LOGO_PRINT_DATA_URL}" alt="" style="height:${LOGO_DISPLAY_HEIGHT_PX}px;width:auto;max-width:45%;display:block;flex-shrink:0;object-fit:contain;object-position:left center;" />
    <div style="flex:1 1 auto;text-align:right;text-transform:uppercase;font-weight:700;font-size:${fontPx}px;line-height:1.2;color:${LOOK_AHEAD_COVER_CONFIDENTIAL_COLOR};white-space:nowrap;">${label}</div>
  </div>
</div>`;
}
