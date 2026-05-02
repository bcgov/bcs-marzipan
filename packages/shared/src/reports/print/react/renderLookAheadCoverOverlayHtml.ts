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

const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * Whitelist swatch hex colors before injecting them into a `style` attribute.
 * Validated upstream by `reportSectionSchema.legendColor`; this is defense in depth.
 */
function safeSwatchColor(color: string | null | undefined): string | null {
  if (!color) return null;
  return HEX_COLOR_REGEX.test(color) ? color : null;
}

function px(n: number): string {
  return `${lookAheadCoverLayoutPx(n)}px`;
}

const LOOK_AHEAD_COVER_CONFIDENTIAL_FLAG =
  'CONFIDENTIAL - NOT FOR CIRCULATION' as const;

const LOOK_AHEAD_COVER_GCPE_TITLE =
  'Government Communications\nand Public Engagement' as const;

const LOOK_AHEAD_COVER_BC_GOVERNMENT = 'BC Government' as const;

const LOOK_AHEAD_COVER_CORPORATE_TITLE = 'CORPORATE\nLOOK AHEAD' as const;

const LOOK_AHEAD_COVER_CONTENTS_HEADING = 'Contents:' as const;

const LOOK_AHEAD_COVER_DATE_EMPTY =
  'No activities in the selected range.' as const;

const LOOK_AHEAD_COVER_FOOTER_INFO_CONFIDENTIAL =
  'Information is confidential and subject to change.' as const;

const LOOK_AHEAD_COVER_FOOTER_QUESTIONS_PREFIX =
  'Questions or comments: ' as const;

function renderContentsListHtml(
  rows: ReadonlyArray<LookAheadCoverOverlayRow>
): string {
  if (rows.length === 0) return '';
  const items = rows
    .map((row) => {
      const safeColor = safeSwatchColor(row.legendColor);
      const swatchStyle = safeColor ? ` style="background:${safeColor}"` : '';
      return `<div class="corpcal-print-cover-contents-row"><span class="corpcal-print-cover-contents-swatch"${swatchStyle} aria-hidden="true"></span><span class="corpcal-print-cover-contents-label">${escapeHtml(row.label)}</span></div>`;
    })
    .join('');
  return items;
}

/**
 * HTML overlay for the look-ahead PDF cover. Positions are scaled from a 612px-wide
 * Figma frame to the canonical print layout width (1024px). BC Sans applies via
 * `.corpcal-print-cover-overlay` in print styles.
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
  const footerBody = `${LOOK_AHEAD_COVER_FOOTER_INFO_CONFIDENTIAL}\n\n${LOOK_AHEAD_COVER_FOOTER_QUESTIONS_PREFIX}${contactMid}`;
  const contentsListHtml = renderContentsListHtml(content.sectionRows);

  return `<div class="corpcal-print-cover-overlay" aria-hidden="true">
<div class="corpcal-print-cover-abs corpcal-print-cover-confidential-flag" style="left:${s(349)};top:${s(8)};width:${s(239)}">${LOOK_AHEAD_COVER_CONFIDENTIAL_FLAG}</div>
<div class="corpcal-print-cover-abs corpcal-print-cover-gcpe-title" style="left:${s(349)};top:${s(72)};width:${s(211)}">${LOOK_AHEAD_COVER_GCPE_TITLE}</div>
<div class="corpcal-print-cover-abs corpcal-print-cover-banner-stack" style="left:${s(349)};top:${s(118)};width:${s(188)}">
<div class="corpcal-print-cover-banner-bc">${LOOK_AHEAD_COVER_BC_GOVERNMENT}</div>
<div class="corpcal-print-cover-banner-corporate">${LOOK_AHEAD_COVER_CORPORATE_TITLE}</div>
</div>
<div class="corpcal-print-cover-abs corpcal-print-cover-date-range" style="left:${s(52)};top:${s(491)};width:${s(388)}">${dateLine}</div>
<div class="corpcal-print-cover-abs corpcal-print-cover-contents-heading" style="left:${s(52)};top:${s(526)};width:${s(64)}">${LOOK_AHEAD_COVER_CONTENTS_HEADING}</div>
<div class="corpcal-print-cover-abs corpcal-print-cover-contents-list" style="left:${s(52)};top:${s(548)};width:${s(359)}">${contentsListHtml}</div>
<div class="corpcal-print-cover-abs corpcal-print-cover-footer-note" style="left:${s(52)};bottom:${s(52)};width:${s(334)}">${escapeHtml(footerBody)}</div>
</div>`;
}
