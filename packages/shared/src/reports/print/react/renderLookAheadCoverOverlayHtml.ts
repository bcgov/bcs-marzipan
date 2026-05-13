import { sanitizeLegendSwatchHexColor } from '../../../schemas/legend-swatch-hex';
import { REPORT_PDF_PAGE_HEADER_MARGIN_TOP_PX } from '../../reportPrintDimensions';
import {
  lookAheadCoverLayoutPx,
  lookAheadCoverLayoutScale,
} from './lookAheadCoverLayout';

/**
 * Single contents-list entry: a label and an optional swatch color.
 * Caller (cover PDF builder) resolves these from the report config; this module
 * stays presentation-only and never reads `reports.config` directly.
 */
export interface LookAheadCoverOverlayRow {
  label: string;
  legendColor?: string | null;
}

export interface LookAheadCoverOverlayContent {
  /** Full date line; empty when no activities in range. */
  dateRangeLine: string;
  contactPhone: string;
  contactEmail: string;
  /** Section legend rows (label + optional color). When empty, no contents block is rendered. */
  sectionRows: ReadonlyArray<LookAheadCoverOverlayRow>;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function px(n: number): string {
  return `${lookAheadCoverLayoutPx(n)}px`;
}

const LOOK_AHEAD_COVER_GCPE_TITLE =
  'Government Communications\nand Public Engagement' as const;

const LOOK_AHEAD_COVER_BC_GOVERNMENT = 'BC Government' as const;

const LOOK_AHEAD_COVER_CORPORATE_LINE_1 = 'CORPORATE' as const;
const LOOK_AHEAD_COVER_CORPORATE_LINE_2 = 'LOOK AHEAD' as const;

/** Wider than original Figma 188px so larger `.corpcal-print-cover-banner-corporate` text fits without clipping. */
const LOOK_AHEAD_COVER_BANNER_STACK_WIDTH_FIGMA = 248 as const;

const LOOK_AHEAD_COVER_CONTENTS_HEADING = 'Contents:' as const;

const LOOK_AHEAD_COVER_DATE_EMPTY =
  'No activities in the selected range' as const;

const LOOK_AHEAD_COVER_FOOTER_INFO_CONFIDENTIAL =
  'Information is confidential and subject to change' as const;

const LOOK_AHEAD_COVER_FOOTER_QUESTIONS_PREFIX =
  'Questions or comments: ' as const;

/** Figma Y for `.corpcal-print-cover-date-range`. */
const LOOK_AHEAD_COVER_DATE_RANGE_TOP_FIGMA = 491 as const;
/** Figma Y for `.corpcal-print-cover-gcpe-title` before PDF header offset (see shifts in {@link renderLookAheadCoverOverlayHtml}). */
const LOOK_AHEAD_COVER_GCPE_TITLE_TOP_FIGMA = 72 as const;
/** Figma Y for `.corpcal-print-cover-banner-stack` before PDF header offset. */
const LOOK_AHEAD_COVER_BANNER_STACK_TOP_FIGMA = 118 as const;
/** Figma Y for `.corpcal-print-cover-contents-heading` (before other-column downward offset). */
const LOOK_AHEAD_COVER_CONTENTS_HEADING_TOP_FIGMA_BASE = 526 as const;
/** Figma Y for `.corpcal-print-cover-contents-list` (before other-column downward offset). */
const LOOK_AHEAD_COVER_CONTENTS_LIST_TOP_FIGMA_BASE = 548 as const;
/** Shifts date, Contents block, footer down by this many layout pixels vs Figma baseline. */
const LOOK_AHEAD_COVER_OTHER_TEXT_DOWN_RENDER_PX = 48 as const;
/** Shifts GCPE title + corporate banner stack down vs Figma baseline (layout px). */
const LOOK_AHEAD_COVER_HEADER_STACK_DOWN_RENDER_PX = 24 as const;
/**
 * Vertical gap from date line top to "Contents:" top in Figma coords (`526 − 491`).
 * Applied again below the contents block so footer spacing matches.
 */
const LOOK_AHEAD_COVER_DATE_TO_CONTENTS_TOP_GAP_FIGMA = 35 as const;
/** Matches `.corpcal-print-cover-contents-heading`: `font-size` 12px × `line-height` 1.3 on `--lc-s`. */
const LOOK_AHEAD_COVER_CONTENTS_HEADING_LINE_FIGMA = 12 * 1.3;
/**
 * Matches `.corpcal-print-cover-contents-list` rows: swatch `height` 16px on `--lc-s` (taller than the text line).
 */
const LOOK_AHEAD_COVER_CONTENTS_LIST_ROW_HEIGHT_FIGMA = 16 as const;
/** Matches `.corpcal-print-cover-contents-list` `gap`. */
const LOOK_AHEAD_COVER_CONTENTS_LIST_ROW_GAP_FIGMA = 4 as const;

function lookAheadCoverContentsBottomFigma(
  rowCount: number,
  otherDownFigma: number
): number {
  const contentsHeadingTop =
    LOOK_AHEAD_COVER_CONTENTS_HEADING_TOP_FIGMA_BASE + otherDownFigma;
  const contentsListTop =
    LOOK_AHEAD_COVER_CONTENTS_LIST_TOP_FIGMA_BASE + otherDownFigma;
  const headingBottom =
    contentsHeadingTop + LOOK_AHEAD_COVER_CONTENTS_HEADING_LINE_FIGMA;
  if (rowCount <= 0) return headingBottom;
  return (
    contentsListTop +
    rowCount * LOOK_AHEAD_COVER_CONTENTS_LIST_ROW_HEIGHT_FIGMA +
    (rowCount - 1) * LOOK_AHEAD_COVER_CONTENTS_LIST_ROW_GAP_FIGMA
  );
}

function renderContentsListHtml(
  rows: ReadonlyArray<LookAheadCoverOverlayRow>
): string {
  if (rows.length === 0) return '';
  const items = rows
    .map((row) => {
      const safeColor = sanitizeLegendSwatchHexColor(row.legendColor);
      const swatchStyle = safeColor ? ` style="background:${safeColor}"` : '';
      return `<div class="corpcal-print-cover-contents-row"><span class="corpcal-print-cover-contents-swatch"${swatchStyle} aria-hidden="true"></span><span class="corpcal-print-cover-contents-label">${escapeHtml(row.label)}</span></div>`;
    })
    .join('');
  return items;
}

/**
 * HTML overlay for the look-ahead PDF cover. Positions are scaled from a 612px-wide
 * Figma frame to the inset cover column (layout width minus 24px horizontal margins,
 * aligned with `.corpcal-print-body`). BC Sans applies via `.corpcal-print-cover-overlay`
 * in print styles.
 */
export function renderLookAheadCoverOverlayHtml(
  content: LookAheadCoverOverlayContent
): string {
  const scale = lookAheadCoverLayoutScale();
  const pdfHeaderReserveUpFigma = REPORT_PDF_PAGE_HEADER_MARGIN_TOP_PX / scale;
  const otherTextDownFigma = LOOK_AHEAD_COVER_OTHER_TEXT_DOWN_RENDER_PX / scale;
  const headerStackDownFigma =
    LOOK_AHEAD_COVER_HEADER_STACK_DOWN_RENDER_PX / scale;

  const s = (n: number) => px(n);
  const dateLine =
    content.dateRangeLine.trim().length > 0
      ? escapeHtml(content.dateRangeLine)
      : escapeHtml(LOOK_AHEAD_COVER_DATE_EMPTY);
  const phone = escapeHtml(content.contactPhone.trim());
  const email = escapeHtml(content.contactEmail.trim());
  const contactMid = [phone, email].filter((x) => x.length > 0).join(' ');
  const footerBody = `${LOOK_AHEAD_COVER_FOOTER_INFO_CONFIDENTIAL}\n${LOOK_AHEAD_COVER_FOOTER_QUESTIONS_PREFIX}${contactMid}`;
  const contentsListHtml = renderContentsListHtml(content.sectionRows);
  const footerTopFigma =
    lookAheadCoverContentsBottomFigma(
      content.sectionRows.length,
      otherTextDownFigma
    ) + LOOK_AHEAD_COVER_DATE_TO_CONTENTS_TOP_GAP_FIGMA;

  const gcpeTop =
    LOOK_AHEAD_COVER_GCPE_TITLE_TOP_FIGMA -
    pdfHeaderReserveUpFigma +
    headerStackDownFigma;
  const bannerTop =
    LOOK_AHEAD_COVER_BANNER_STACK_TOP_FIGMA -
    pdfHeaderReserveUpFigma +
    headerStackDownFigma;

  const dateTop = LOOK_AHEAD_COVER_DATE_RANGE_TOP_FIGMA + otherTextDownFigma;
  const contentsHeadingTop =
    LOOK_AHEAD_COVER_CONTENTS_HEADING_TOP_FIGMA_BASE + otherTextDownFigma;
  const contentsListTop =
    LOOK_AHEAD_COVER_CONTENTS_LIST_TOP_FIGMA_BASE + otherTextDownFigma;

  return `<div class="corpcal-print-cover-overlay" aria-hidden="true">
<div class="corpcal-print-cover-abs corpcal-print-cover-gcpe-title" style="left:${s(349)};top:${s(gcpeTop)};width:${s(211)}">${LOOK_AHEAD_COVER_GCPE_TITLE}</div>
<div class="corpcal-print-cover-abs corpcal-print-cover-banner-stack" style="left:${s(349)};top:${s(bannerTop)};width:${s(LOOK_AHEAD_COVER_BANNER_STACK_WIDTH_FIGMA)}">
<div class="corpcal-print-cover-banner-bc">${LOOK_AHEAD_COVER_BC_GOVERNMENT}</div>
<div class="corpcal-print-cover-banner-corporate"><span class="corpcal-print-cover-banner-corporate-line">${LOOK_AHEAD_COVER_CORPORATE_LINE_1}</span><span class="corpcal-print-cover-banner-corporate-line">${LOOK_AHEAD_COVER_CORPORATE_LINE_2}</span></div>
</div>
<div class="corpcal-print-cover-abs corpcal-print-cover-date-range" style="left:${s(52)};top:${s(dateTop)};width:${s(388)}">${dateLine}</div>
<div class="corpcal-print-cover-abs corpcal-print-cover-contents-heading" style="left:${s(52)};top:${s(contentsHeadingTop)};width:${s(64)}">${LOOK_AHEAD_COVER_CONTENTS_HEADING}</div>
<div class="corpcal-print-cover-abs corpcal-print-cover-contents-list" style="left:${s(52)};top:${s(contentsListTop)};width:${s(359)}">${contentsListHtml}</div>
<div class="corpcal-print-cover-abs corpcal-print-cover-footer-note" style="left:${s(52)};top:${s(footerTopFigma)};width:${s(334)}">${escapeHtml(footerBody)}</div>
</div>`;
}
