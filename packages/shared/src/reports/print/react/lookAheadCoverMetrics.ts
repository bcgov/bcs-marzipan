import { REPORT_PRINT_COVER_CONTENT_WIDTH_PX } from '../../reportPrintDimensions';

/**
 * Width of {@link REPORT_PRINT_COVER_CONTENT_WIDTH_PX} **at which every baseline px in this file
 * was tuned** (1024px cover sheet − horizontal insets = 976px). Cover geometry scales only when
 * {@link REPORT_PRINT_COVER_SHEET_WIDTH_PX} changes — not when body {@link REPORT_PRINT_LAYOUT_WIDTH_PX} changes.
 *
 * Baseline geometry and typography use a 4px grid (multiples of 4 at this width).
 */
export const LOOK_AHEAD_COVER_METRICS_BASE_WIDTH_PX = 976 as const;

/**
 * Scale a distance measured at {@link LOOK_AHEAD_COVER_METRICS_BASE_WIDTH_PX} to the
 * current cover column width.
 */
export function scaleLookAheadCoverLayoutPx(pxAtBaseline: number): number {
  return (
    (pxAtBaseline * REPORT_PRINT_COVER_CONTENT_WIDTH_PX) /
    LOOK_AHEAD_COVER_METRICS_BASE_WIDTH_PX
  );
}

/**
 * Whole-pixel CSS length from a baseline px value for print stylesheet injection.
 */
export function formatLookAheadCoverLayoutLength(pxAtBaseline: number): string {
  const v =
    (pxAtBaseline * REPORT_PRINT_COVER_CONTENT_WIDTH_PX) /
    LOOK_AHEAD_COVER_METRICS_BASE_WIDTH_PX;
  return `${Math.round(v)}px`;
}

// --- Baseline layout px (cover inner column at LOOK_AHEAD_COVER_METRICS_BASE_WIDTH_PX) ---

/** Left edge for date, contents, footer blocks. */
export const LOOK_AHEAD_COVER_OVERLAY_LEFT_COL_LEFT_BASELINE_PX = 84 as const;

/**
 * Shared horizontal band for GCPE title and `.corpcal-print-cover-banner-stack`
 * (`left` + `right` insets in baseline column px).
 */
export const LOOK_AHEAD_COVER_OVERLAY_RIGHT_COLUMN_BASELINE_PX = {
  left: 556,
  rightInset: 24,
} as const;

/** Inset from inner column right edge. */
export const LOOK_AHEAD_COVER_OVERLAY_DATE_RANGE_RIGHT_BASELINE_PX =
  272 as const;
export const LOOK_AHEAD_COVER_OVERLAY_CONTENTS_HEADING_RIGHT_BASELINE_PX =
  792 as const;
export const LOOK_AHEAD_COVER_OVERLAY_CONTENTS_LIST_RIGHT_BASELINE_PX =
  320 as const;
export const LOOK_AHEAD_COVER_OVERLAY_FOOTER_RIGHT_BASELINE_PX = 360 as const;

export const LOOK_AHEAD_COVER_OVERLAY_GCPE_TOP_BASELINE_PX = 84 as const;
export const LOOK_AHEAD_COVER_OVERLAY_BANNER_TOP_BASELINE_PX = 156 as const;
export const LOOK_AHEAD_COVER_OVERLAY_DATE_RANGE_TOP_BASELINE_PX = 832 as const;
export const LOOK_AHEAD_COVER_OVERLAY_CONTENTS_HEADING_TOP_BASELINE_PX =
  888 as const;
export const LOOK_AHEAD_COVER_OVERLAY_CONTENTS_LIST_TOP_BASELINE_PX =
  920 as const;

/** `font-size` × `line-height` for `.corpcal-print-cover-contents-heading` at baseline column width. */
export const LOOK_AHEAD_COVER_CONTENTS_HEADING_BLOCK_BASELINE_PX = 24 as const;

/** Vertical gap from contents block bottom to footer top (mirrors date → “Contents:”). */
export const LOOK_AHEAD_COVER_CONTENTS_TO_FOOTER_GAP_BASELINE_PX = 56 as const;

/** Row block height for contents list (swatch-led row) at baseline. */
export const LOOK_AHEAD_COVER_CONTENTS_LIST_ROW_HEIGHT_BASELINE_PX =
  24 as const;

export const LOOK_AHEAD_COVER_CONTENTS_LIST_ROW_GAP_BASELINE_PX = 8 as const;

/** PDF header confidential label `font-size` at baseline column width. */
export const LOOK_AHEAD_COVER_PDF_HEADER_CONFIDENTIAL_FONT_BASELINE_PX =
  12 as const;

/** Vertical / flex gap for look-ahead PDF header band (scaled like overlay type). */
export const LOOK_AHEAD_COVER_PDF_HEADER_PADDING_TOP_BASELINE_PX = 8 as const;
export const LOOK_AHEAD_COVER_PDF_HEADER_PADDING_BOTTOM_BASELINE_PX =
  10 as const;
export const LOOK_AHEAD_COVER_PDF_HEADER_INNER_ROW_GAP_BASELINE_PX =
  16 as const;

// --- Typography baselines (physical px at LOOK_AHEAD_COVER_METRICS_BASE_WIDTH_PX) ---

export const LOOK_AHEAD_COVER_TYPO_GCPE_FONT_BASELINE_PX = 24 as const;
export const LOOK_AHEAD_COVER_TYPO_GCPE_LINE_HEIGHT_BASELINE_PX = 28 as const;

export const LOOK_AHEAD_COVER_TYPO_BANNER_BC_FONT_BASELINE_PX = 32 as const;
export const LOOK_AHEAD_COVER_TYPO_BANNER_BC_LINE_HEIGHT_BASELINE_PX =
  32 as const;

export const LOOK_AHEAD_COVER_TYPO_BANNER_CORP_FONT_BASELINE_PX = 56 as const;
export const LOOK_AHEAD_COVER_TYPO_BANNER_CORP_LINE_HEIGHT_BASELINE_PX =
  48 as const;

export const LOOK_AHEAD_COVER_TYPO_DATE_FONT_BASELINE_PX = 24 as const;

export const LOOK_AHEAD_COVER_TYPO_CONTENTS_FONT_BASELINE_PX = 20 as const;

export const LOOK_AHEAD_COVER_TYPO_FOOTER_FONT_BASELINE_PX = 16 as const;

export const LOOK_AHEAD_COVER_TYPO_BANNER_STACK_GAP_BASELINE_PX = 4 as const;
export const LOOK_AHEAD_COVER_TYPO_CONTENTS_LIST_GAP_BASELINE_PX = 8 as const;
export const LOOK_AHEAD_COVER_TYPO_CONTENTS_ROW_GAP_BASELINE_PX = 12 as const;

export const LOOK_AHEAD_COVER_TYPO_SWATCH_SIZE_BASELINE_PX = 24 as const;
export const LOOK_AHEAD_COVER_TYPO_SWATCH_RADIUS_BASELINE_PX = 4 as const;

/**
 * Footer `top` in baseline column px (before {@link scaleLookAheadCoverLayoutPx}).
 *
 * Uses the same row block and gap baselines as `.corpcal-print-cover-contents-list` in
 * `printStyles.ts` ({@link LOOK_AHEAD_COVER_CONTENTS_LIST_ROW_HEIGHT_BASELINE_PX},
 * {@link LOOK_AHEAD_COVER_CONTENTS_LIST_ROW_GAP_BASELINE_PX}). Change those together with
 * list `gap` / swatch sizing so the footer stays clear of the last row.
 */
export function lookAheadCoverFooterTopBaselinePx(rowCount: number): number {
  const contentsBottom =
    rowCount <= 0
      ? LOOK_AHEAD_COVER_OVERLAY_CONTENTS_HEADING_TOP_BASELINE_PX +
        LOOK_AHEAD_COVER_CONTENTS_HEADING_BLOCK_BASELINE_PX
      : LOOK_AHEAD_COVER_OVERLAY_CONTENTS_LIST_TOP_BASELINE_PX +
        rowCount * LOOK_AHEAD_COVER_CONTENTS_LIST_ROW_HEIGHT_BASELINE_PX +
        (rowCount - 1) * LOOK_AHEAD_COVER_CONTENTS_LIST_ROW_GAP_BASELINE_PX;

  return contentsBottom + LOOK_AHEAD_COVER_CONTENTS_TO_FOOTER_GAP_BASELINE_PX;
}
