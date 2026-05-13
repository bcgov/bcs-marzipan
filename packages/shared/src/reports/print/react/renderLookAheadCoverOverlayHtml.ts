import { sanitizeLegendSwatchHexColor } from '../../../schemas/legend-swatch-hex';
import { lookAheadCoverLayoutPx } from './lookAheadCoverLayout';

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

/** Figma Y for `.corpcal-print-cover-contents-heading` (must match inline `top:${s(526)}`). */
const LOOK_AHEAD_COVER_CONTENTS_HEADING_TOP_FIGMA = 526 as const;
/** Figma Y for `.corpcal-print-cover-contents-list` (must match inline `top:${s(548)}`). */
const LOOK_AHEAD_COVER_CONTENTS_LIST_TOP_FIGMA = 548 as const;
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

function lookAheadCoverContentsBottomFigma(rowCount: number): number {
  const headingBottom =
    LOOK_AHEAD_COVER_CONTENTS_HEADING_TOP_FIGMA +
    LOOK_AHEAD_COVER_CONTENTS_HEADING_LINE_FIGMA;
  if (rowCount <= 0) return headingBottom;
  return (
    LOOK_AHEAD_COVER_CONTENTS_LIST_TOP_FIGMA +
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
    lookAheadCoverContentsBottomFigma(content.sectionRows.length) +
    LOOK_AHEAD_COVER_DATE_TO_CONTENTS_TOP_GAP_FIGMA;

  return `<div class="corpcal-print-cover-overlay" aria-hidden="true">
<div class="corpcal-print-cover-abs corpcal-print-cover-gcpe-title" style="left:${s(349)};top:${s(72)};width:${s(211)}">${LOOK_AHEAD_COVER_GCPE_TITLE}</div>
<div class="corpcal-print-cover-abs corpcal-print-cover-banner-stack" style="left:${s(349)};top:${s(118)};width:${s(LOOK_AHEAD_COVER_BANNER_STACK_WIDTH_FIGMA)}">
<div class="corpcal-print-cover-banner-bc">${LOOK_AHEAD_COVER_BC_GOVERNMENT}</div>
<div class="corpcal-print-cover-banner-corporate"><span class="corpcal-print-cover-banner-corporate-line">${LOOK_AHEAD_COVER_CORPORATE_LINE_1}</span><span class="corpcal-print-cover-banner-corporate-line">${LOOK_AHEAD_COVER_CORPORATE_LINE_2}</span></div>
</div>
<div class="corpcal-print-cover-abs corpcal-print-cover-date-range" style="left:${s(52)};top:${s(491)};width:${s(388)}">${dateLine}</div>
<div class="corpcal-print-cover-abs corpcal-print-cover-contents-heading" style="left:${s(52)};top:${s(526)};width:${s(64)}">${LOOK_AHEAD_COVER_CONTENTS_HEADING}</div>
<div class="corpcal-print-cover-abs corpcal-print-cover-contents-list" style="left:${s(52)};top:${s(548)};width:${s(359)}">${contentsListHtml}</div>
<div class="corpcal-print-cover-abs corpcal-print-cover-footer-note" style="left:${s(52)};top:${s(footerTopFigma)};width:${s(334)}">${escapeHtml(footerBody)}</div>
</div>`;
}
