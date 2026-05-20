import { Mail, Phone } from 'lucide-react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { sanitizeLegendSwatchHexColor } from '../../../schemas/legend-swatch-hex';
import {
  LOOK_AHEAD_COVER_OVERLAY_BANNER_TOP_BASELINE_PX,
  LOOK_AHEAD_COVER_OVERLAY_CONTENTS_HEADING_RIGHT_BASELINE_PX,
  LOOK_AHEAD_COVER_OVERLAY_CONTENTS_HEADING_TOP_BASELINE_PX,
  LOOK_AHEAD_COVER_OVERLAY_CONTENTS_LIST_RIGHT_BASELINE_PX,
  LOOK_AHEAD_COVER_OVERLAY_CONTENTS_LIST_TOP_BASELINE_PX,
  LOOK_AHEAD_COVER_OVERLAY_DATE_RANGE_RIGHT_BASELINE_PX,
  LOOK_AHEAD_COVER_OVERLAY_DATE_RANGE_TOP_BASELINE_PX,
  LOOK_AHEAD_COVER_OVERLAY_FOOTER_RIGHT_BASELINE_PX,
  LOOK_AHEAD_COVER_OVERLAY_GCPE_TOP_BASELINE_PX,
  LOOK_AHEAD_COVER_OVERLAY_LEFT_COL_LEFT_BASELINE_PX,
  LOOK_AHEAD_COVER_OVERLAY_RIGHT_COLUMN_BASELINE_PX,
  LOOK_AHEAD_COVER_TYPO_FOOTER_FONT_BASELINE_PX,
  lookAheadCoverFooterTopBaselinePx,
  scaleLookAheadCoverLayoutPx,
} from './lookAheadCoverMetrics';

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
  return `${scaleLookAheadCoverLayoutPx(n)}px`;
}

/** Footer contact icons match footer type size (scaled with cover column width). */
function lookAheadCoverFooterContactIconSizePx(): number {
  return Math.max(
    12,
    Math.round(
      scaleLookAheadCoverLayoutPx(LOOK_AHEAD_COVER_TYPO_FOOTER_FONT_BASELINE_PX)
    )
  );
}

function renderLookAheadCoverFooterContactIconPhoneHtml(): string {
  return renderToStaticMarkup(
    createElement(Phone, {
      className: 'corpcal-print-cover-footer-contact-icon',
      'aria-hidden': true,
      size: lookAheadCoverFooterContactIconSizePx(),
      strokeWidth: 2,
    })
  );
}

function renderLookAheadCoverFooterContactIconMailHtml(): string {
  return renderToStaticMarkup(
    createElement(Mail, {
      className: 'corpcal-print-cover-footer-contact-icon',
      'aria-hidden': true,
      size: lookAheadCoverFooterContactIconSizePx(),
      strokeWidth: 2,
    })
  );
}

function renderLookAheadCoverFooterContactHtml(
  phone: string,
  email: string
): string {
  const chunks: string[] = [];
  if (phone.length > 0) {
    chunks.push(
      `<span class="corpcal-print-cover-footer-contact-item">${renderLookAheadCoverFooterContactIconPhoneHtml()}<span class="corpcal-print-cover-footer-contact-text">${phone}</span></span>`
    );
  }
  if (email.length > 0) {
    chunks.push(
      `<span class="corpcal-print-cover-footer-contact-item">${renderLookAheadCoverFooterContactIconMailHtml()}<span class="corpcal-print-cover-footer-contact-text">${email}</span></span>`
    );
  }
  return chunks.join('');
}

const LOOK_AHEAD_COVER_GCPE_TITLE =
  'Government Communications\nand Public Engagement' as const;

const LOOK_AHEAD_COVER_BC_GOVERNMENT = 'BC Government' as const;

const LOOK_AHEAD_COVER_CORPORATE_LINE_1 = 'CORPORATE' as const;
const LOOK_AHEAD_COVER_CORPORATE_LINE_2 = 'LOOK AHEAD' as const;

const LOOK_AHEAD_COVER_CONTENTS_HEADING = 'Contents:' as const;

const LOOK_AHEAD_COVER_DATE_EMPTY =
  'No activities in the selected range' as const;

const LOOK_AHEAD_COVER_FOOTER_INFO_CONFIDENTIAL =
  'Information is confidential and subject to change' as const;

const LOOK_AHEAD_COVER_FOOTER_QUESTIONS_PREFIX =
  'Questions or comments: ' as const;

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
 * HTML overlay for the look-ahead PDF cover. Positions are in the cover inner column
 * (same box as `.corpcal-print-cover-inner`), scaled with
 * {@link scaleLookAheadCoverLayoutPx} when the print cover column width changes.
 * BC Sans applies via `.corpcal-print-cover-overlay` in print styles.
 */
export function renderLookAheadCoverOverlayHtml(
  content: LookAheadCoverOverlayContent
): string {
  const dateLine =
    content.dateRangeLine.trim().length > 0
      ? escapeHtml(content.dateRangeLine)
      : escapeHtml(LOOK_AHEAD_COVER_DATE_EMPTY);
  const phone = escapeHtml(content.contactPhone.trim());
  const email = escapeHtml(content.contactEmail.trim());
  const contactMid = renderLookAheadCoverFooterContactHtml(phone, email);
  const contactWrapped =
    contactMid.length > 0
      ? `<span class="corpcal-print-cover-footer-contact-cluster">${contactMid}</span>`
      : '';
  const footerBody =
    escapeHtml(LOOK_AHEAD_COVER_FOOTER_INFO_CONFIDENTIAL) +
    '\n' +
    escapeHtml(LOOK_AHEAD_COVER_FOOTER_QUESTIONS_PREFIX) +
    contactWrapped;
  const contentsListHtml = renderContentsListHtml(content.sectionRows);
  const footerTop = scaleLookAheadCoverLayoutPx(
    lookAheadCoverFooterTopBaselinePx(content.sectionRows.length)
  );

  const gcpeTitle = escapeHtml(LOOK_AHEAD_COVER_GCPE_TITLE);
  const bannerBc = escapeHtml(LOOK_AHEAD_COVER_BC_GOVERNMENT);
  const corp1 = escapeHtml(LOOK_AHEAD_COVER_CORPORATE_LINE_1);
  const corp2 = escapeHtml(LOOK_AHEAD_COVER_CORPORATE_LINE_2);
  const contentsHeading = escapeHtml(LOOK_AHEAD_COVER_CONTENTS_HEADING);

  const col = LOOK_AHEAD_COVER_OVERLAY_RIGHT_COLUMN_BASELINE_PX;
  const colLeft = px(col.left);
  const colRight = px(col.rightInset);

  return `<div class="corpcal-print-cover-overlay" aria-hidden="true">
<div class="corpcal-print-cover-abs corpcal-print-cover-gcpe-title" style="left:${colLeft};top:${px(LOOK_AHEAD_COVER_OVERLAY_GCPE_TOP_BASELINE_PX)};right:${colRight}">${gcpeTitle}</div>
<div class="corpcal-print-cover-abs corpcal-print-cover-banner-stack" style="left:${colLeft};top:${px(LOOK_AHEAD_COVER_OVERLAY_BANNER_TOP_BASELINE_PX)};right:${colRight}">
<div class="corpcal-print-cover-banner-bc">${bannerBc}</div>
<div class="corpcal-print-cover-banner-corporate"><span class="corpcal-print-cover-banner-corporate-line">${corp1}</span><span class="corpcal-print-cover-banner-corporate-line">${corp2}</span></div>
</div>
<div class="corpcal-print-cover-abs corpcal-print-cover-date-range" style="left:${px(LOOK_AHEAD_COVER_OVERLAY_LEFT_COL_LEFT_BASELINE_PX)};top:${px(LOOK_AHEAD_COVER_OVERLAY_DATE_RANGE_TOP_BASELINE_PX)};right:${px(LOOK_AHEAD_COVER_OVERLAY_DATE_RANGE_RIGHT_BASELINE_PX)}">${dateLine}</div>
<div class="corpcal-print-cover-abs corpcal-print-cover-contents-heading" style="left:${px(LOOK_AHEAD_COVER_OVERLAY_LEFT_COL_LEFT_BASELINE_PX)};top:${px(LOOK_AHEAD_COVER_OVERLAY_CONTENTS_HEADING_TOP_BASELINE_PX)};right:${px(LOOK_AHEAD_COVER_OVERLAY_CONTENTS_HEADING_RIGHT_BASELINE_PX)}">${contentsHeading}</div>
<div class="corpcal-print-cover-abs corpcal-print-cover-contents-list" style="left:${px(LOOK_AHEAD_COVER_OVERLAY_LEFT_COL_LEFT_BASELINE_PX)};top:${px(LOOK_AHEAD_COVER_OVERLAY_CONTENTS_LIST_TOP_BASELINE_PX)};right:${px(LOOK_AHEAD_COVER_OVERLAY_CONTENTS_LIST_RIGHT_BASELINE_PX)}">${contentsListHtml}</div>
<div class="corpcal-print-cover-abs corpcal-print-cover-footer-note" style="left:${px(LOOK_AHEAD_COVER_OVERLAY_LEFT_COL_LEFT_BASELINE_PX)};top:${footerTop}px;right:${px(LOOK_AHEAD_COVER_OVERLAY_FOOTER_RIGHT_BASELINE_PX)}">${footerBody}</div>
</div>`;
}
