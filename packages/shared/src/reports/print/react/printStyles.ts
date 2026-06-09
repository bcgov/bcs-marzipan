import { CORPCAL_SEMANTIC_TOKEN_CSS } from '../../../styles/corpcalTokensEmbedded.generated';
import {
  REPORT_PRINT_COVER_SHEET_WIDTH_PX,
  REPORT_PRINT_LANDSCAPE_LAYOUT_WIDTH_PX,
  REPORT_PRINT_PAGE_HORIZONTAL_INSET_PX,
  REPORT_PRINT_PDF_BODY_CONTENT_HEIGHT_PX,
  REPORT_PRINT_SHEET_CONTENT_MAX_WIDTH_CSS,
} from '../../reportPrintDimensions';
import {
  formatLookAheadCoverLayoutLength,
  LOOK_AHEAD_COVER_CONTENTS_LINE_HEIGHT,
  LOOK_AHEAD_COVER_FOOTER_CONFIDENTIAL_TO_QUESTIONS_GAP_BASELINE_PX,
  LOOK_AHEAD_COVER_TYPO_BANNER_BC_FONT_BASELINE_PX,
  LOOK_AHEAD_COVER_TYPO_BANNER_BC_LINE_HEIGHT_BASELINE_PX,
  LOOK_AHEAD_COVER_TYPO_BANNER_CORP_FONT_BASELINE_PX,
  LOOK_AHEAD_COVER_TYPO_BANNER_CORP_LINE_HEIGHT_BASELINE_PX,
  LOOK_AHEAD_COVER_TYPO_BANNER_STACK_GAP_BASELINE_PX,
  LOOK_AHEAD_COVER_TYPO_CONTENTS_FONT_BASELINE_PX,
  LOOK_AHEAD_COVER_TYPO_CONTENTS_LIST_GAP_BASELINE_PX,
  LOOK_AHEAD_COVER_TYPO_CONTENTS_ROW_GAP_BASELINE_PX,
  LOOK_AHEAD_COVER_TYPO_DATE_FONT_BASELINE_PX,
  LOOK_AHEAD_COVER_TYPO_FOOTER_FONT_BASELINE_PX,
  LOOK_AHEAD_COVER_TYPO_GCPE_FONT_BASELINE_PX,
  LOOK_AHEAD_COVER_TYPO_GCPE_LINE_HEIGHT_BASELINE_PX,
  LOOK_AHEAD_COVER_TYPO_SWATCH_RADIUS_BASELINE_PX,
  LOOK_AHEAD_COVER_TYPO_SWATCH_SIZE_BASELINE_PX,
} from './lookAheadCoverMetrics';

/**
 * Single source of print styles for both in-app preview and Puppeteer-generated
 * PDFs. Shared semantic tokens are prepended so the standalone PDF document and
 * calendar-ui preview use the same table surfaces, borders, text, and radius.
 *
 * Scoped under `.corpcal-print-root` so the rules never leak into the
 * surrounding calendar-ui shell when mounted in the preview pane.
 */
export const CORPCAL_PRINT_ROOT_CLASS = 'corpcal-print-root';

export const PRINT_STYLES = `${CORPCAL_SEMANTIC_TOKEN_CSS}
.${CORPCAL_PRINT_ROOT_CLASS} {
  --print-ink: var(--corpcal-text);
  --print-ink-muted: var(--corpcal-table-cell-muted-fg);
  --print-ink-faint: var(--corpcal-table-cell-subtle-fg);
  --print-border: var(--corpcal-table-border);
  --print-border-soft: color-mix(in oklch, var(--corpcal-table-border) 70%, transparent);
  --print-section-fg: var(--corpcal-text);
  --print-zebra: var(--corpcal-table-row-alt-bg);
  --print-accent-red: var(--corpcal-print-accent-red);
  --print-accent-red-soft: var(--corpcal-print-accent-red-soft);
  --print-accent-blue: var(--corpcal-print-accent-blue);
  --print-accent-blue-soft: var(--corpcal-print-accent-blue-soft);
  --print-accent-amber: var(--corpcal-print-accent-amber);
  --print-accent-amber-soft: var(--corpcal-print-accent-amber-soft);
  --print-accent-purple: var(--corpcal-print-accent-purple);
  --print-accent-purple-soft: var(--corpcal-print-accent-purple-soft);
  /** Look Ahead / Exec: planner + translations foreground (WCAG on table + zebra striping). */
  --print-look-ahead-accent-green: var(--bcsds-green-90);
  --print-status-new: var(--status-blue);
  --print-status-changed: var(--status-yellow);

  /* Body size for the whole subtree; descendant font sizes use em so they scale with this root (browser zoom still applies to the page). */
  --print-body-font-size: 16px;
  font-family: 'BCSans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: var(--print-body-font-size);
  line-height: 1.4;
  color: var(--print-ink);
  background: var(--corpcal-surface);
  box-sizing: border-box;
  max-width: var(--corpcal-print-root-max-width, ${REPORT_PRINT_SHEET_CONTENT_MAX_WIDTH_CSS});
  margin-left: auto;
  margin-right: auto;
  transition: max-width 300ms ease-out;
}
.${CORPCAL_PRINT_ROOT_CLASS} *,
.${CORPCAL_PRINT_ROOT_CLASS} *::before,
.${CORPCAL_PRINT_ROOT_CLASS} *::after {
  box-sizing: border-box;
}
.${CORPCAL_PRINT_ROOT_CLASS} a {
  color: var(--corpcal-link);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.${CORPCAL_PRINT_ROOT_CLASS} a:hover {
  text-decoration-thickness: 2px;
}
.${CORPCAL_PRINT_ROOT_CLASS} a.corpcal-print-link {
  color: var(--corpcal-link);
  text-decoration: none;
}
.${CORPCAL_PRINT_ROOT_CLASS} a.corpcal-print-link:hover {
  text-decoration: none;
}

.corpcal-print-body {
  padding: 4px 24px 20px;
}
.corpcal-print-body > .corpcal-print-section-block + .corpcal-print-section-block {
  margin-top: 8px;
}
.corpcal-print-day-heading {
  margin: 0 0 4px;
  padding: 6px 0;
  font-size: 1em;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--print-section-fg);
  text-align: left;
}
.corpcal-print-section-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 0 4px;
  font-size: 1.35em;
  font-weight: 700;
  color: var(--print-section-fg);
}
.corpcal-print-section-swatch {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: 1px solid var(--print-border);
  flex: 0 0 auto;
}

.corpcal-print-table-wrap {
  border: 1px solid var(--print-border);
  border-radius: var(--corpcal-table-radius);
  overflow: hidden;
  background: var(--corpcal-table-surface);
}
/* Look-ahead multi-day section: section title repeats in thead for print/PDF — no outer border/panel around it. */
.corpcal-print-table-wrap--section-rollup {
  border: none;
  border-radius: 0;
  background: transparent;
  overflow: visible;
}
.corpcal-print-section-rollup-table thead {
  display: table-header-group;
}
.corpcal-print-section-rollup-table .corpcal-print-section-heading-cell {
  border: none;
  padding: 12px 0 6px;
  vertical-align: middle;
  background: var(--corpcal-surface);
}
.corpcal-print-section-rollup-table .corpcal-print-section-heading-cell .corpcal-print-section-heading {
  margin: 0;
}
/* Bordered "card" for rollup grids:
   - Per-day chrome: day/date sits outside the card (no side/top/table border).
     The rounded teal clone header row starts the bordered panel; each day's
     last activity row closes it with bottom radius.
   - Flat days: top edge + top radius sit on thead column header (th); bottom
     radius on the single tbody's last row. */
.corpcal-print-section-rollup-table:has(.corpcal-print-rollup-thead-column-header-row) thead tr.corpcal-print-rollup-thead-column-header-row th {
  border-top: 1px solid var(--corpcal-table-border);
}
.corpcal-print-section-rollup-table:has(.corpcal-print-rollup-thead-column-header-row) thead tr.corpcal-print-rollup-thead-column-header-row th:first-child {
  border-top-left-radius: var(--corpcal-table-radius);
  border-left: 1px solid var(--corpcal-table-border);
}
.corpcal-print-section-rollup-table:has(.corpcal-print-rollup-thead-column-header-row) thead tr.corpcal-print-rollup-thead-column-header-row th:last-child {
  border-top-right-radius: var(--corpcal-table-radius);
  border-right: 1px solid var(--corpcal-table-border);
}
.corpcal-print-section-rollup-table tbody td:first-child:not(.corpcal-print-day-heading-cell) {
  border-left: 1px solid var(--corpcal-table-border);
}
.corpcal-print-section-rollup-table tbody td:last-child:not(.corpcal-print-day-heading-cell) {
  border-right: 1px solid var(--corpcal-table-border);
}
.corpcal-print-section-rollup-table tbody.corpcal-print-day-tbody > tr:last-child > td:first-child {
  border-bottom-left-radius: var(--corpcal-table-radius);
}
.corpcal-print-section-rollup-table tbody.corpcal-print-day-tbody > tr:last-child > td:last-child {
  border-bottom-right-radius: var(--corpcal-table-radius);
}
.corpcal-print-section-rollup-table tbody.corpcal-print-day-tbody > tr:last-child > th:first-child {
  border-bottom-left-radius: var(--corpcal-table-radius);
}
.corpcal-print-section-rollup-table tbody.corpcal-print-day-tbody > tr:last-child > th:last-child {
  border-bottom-right-radius: var(--corpcal-table-radius);
}
.corpcal-print-section-rollup-table .corpcal-print-day-heading-cell {
  padding: 0;
  vertical-align: middle;
  background: transparent;
  border: none;
}
.corpcal-print-section-rollup-table .corpcal-print-day-heading-row td {
  border: none;
}
.corpcal-print-section-rollup-table .corpcal-print-day-heading {
  margin: 0 0 4px;
  padding: 16px 0 0;
}
/* Per-day column header band: starts the bordered panel (top edge + radius).
   Legend swatch fill uses inline styles on PrintSectionColumnHeaderRow. */
.corpcal-print-section-rollup-table tbody tr.corpcal-print-per-day-column-header-row th {
  border-top: 1px solid var(--corpcal-table-border);
}
.corpcal-print-section-rollup-table tbody tr.corpcal-print-per-day-column-header-row th:first-child {
  border-top-left-radius: var(--corpcal-table-radius);
  border-left: 1px solid var(--corpcal-table-border);
}
.corpcal-print-section-rollup-table tbody tr.corpcal-print-per-day-column-header-row th:last-child {
  border-top-right-radius: var(--corpcal-table-radius);
  border-right: 1px solid var(--corpcal-table-border);
}

.corpcal-print-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
  font-size: 1em;
}
.corpcal-print-table th {
  text-align: left;
  padding: 6px 8px;
  background: var(--corpcal-table-header-bg);
  color: var(--corpcal-table-header-fg);
  font-weight: 600;
  font-size: 1em;
  border-bottom: 1px solid var(--corpcal-table-border);
}
.corpcal-print-table td {
  vertical-align: top;
  padding: 8px;
  background: var(--corpcal-table-row-bg);
  border-bottom: 1px solid var(--corpcal-table-border);
  word-wrap: break-word;
  overflow-wrap: break-word;
}
.corpcal-print-table th + th,
.corpcal-print-table td + td {
  border-left: 1px solid var(--corpcal-table-border);
}
.corpcal-print-table tbody tr:nth-child(even) td {
  background: var(--print-zebra);
}
/* Fixed layout widths: tie to table + col so preview/PDF respects the grid (colgroup + th/td avoids resets equalizing columns). */
.corpcal-print-table col.corpcal-print-col-1 { width: 18%; }
.corpcal-print-table col.corpcal-print-col-2 { width: 54%; }
.corpcal-print-table col.corpcal-print-col-3 { width: 17%; }
.corpcal-print-table col.corpcal-print-col-4 { width: 11%; }
.corpcal-print-root .corpcal-print-table thead th.corpcal-print-col-1,
.corpcal-print-root .corpcal-print-table tbody td.corpcal-print-col-1 {
  width: 18%;
}
.corpcal-print-root .corpcal-print-table thead th.corpcal-print-col-2,
.corpcal-print-root .corpcal-print-table tbody td.corpcal-print-col-2 {
  width: 54%;
}
.corpcal-print-root .corpcal-print-table thead th.corpcal-print-col-3,
.corpcal-print-root .corpcal-print-table tbody td.corpcal-print-col-3 {
  width: 17%;
}
.corpcal-print-root .corpcal-print-table thead th.corpcal-print-col-4,
.corpcal-print-root .corpcal-print-table tbody td.corpcal-print-col-4 {
  width: 11%;
}
/* Awareness / Long-term: Release omitted; Activity details absorbs col-3 width (54% + 17% = 71%). */
.corpcal-print-table--omit-release col.corpcal-print-col-2 { width: 71%; }
.corpcal-print-root .corpcal-print-table--omit-release thead th.corpcal-print-col-2,
.corpcal-print-root .corpcal-print-table--omit-release tbody td.corpcal-print-col-2 {
  width: 71%;
}

/* Look-ahead section legend fill on thead cells: preserve in PDF/export (Chrome). */
.corpcal-print-table thead th.corpcal-print-section-thead-cell {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.corpcal-print-stack > * + * { margin-top: 4px; }
.corpcal-print-stack-md > * + * { margin-top: 6px; }
.corpcal-print-stack-lg > * + * { margin-top: 8px; }

.corpcal-print-text {
  font-size: 1em;
  font-weight: 400;
  color: var(--print-ink);
}
.corpcal-print-meta-strong {
  font-weight: 700;
  font-size: 1em;
  color: var(--print-ink);
}
.corpcal-print-meta {
  font-size: 1em;
  color: var(--print-ink-muted);
}
.corpcal-print-root .corpcal-print-meta-look-ahead-green {
  font-size: 1em;
  font-weight: 500;
  /* Literal first: guaranteed contrast on table + zebra if a custom property chain fails. */
  color: #2e5a34;
  color: var(--print-look-ahead-accent-green);
}
.corpcal-print-inline-status {
  font-weight: 400;
  color: var(--print-ink);
  white-space: normal;
}
.corpcal-print-inline-row {
  display: flex;
  align-items: center;
  gap: 0;
}
.corpcal-print-translations-row {
  align-items: flex-start;
  gap: 0.35em;
}
.corpcal-print-translations-icon {
  flex: 0 0 auto;
  margin-top: 0.15em;
  color: #2e5a34;
  color: var(--print-look-ahead-accent-green);
}
.corpcal-print-comms-materials-icon {
  flex: 0 0 auto;
  margin-top: 0.15em;
  color: var(--print-ink);
}
.corpcal-print-narrative-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.35em 0.5em;
}
.corpcal-print-activity-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25em;
}
.corpcal-print-activity-link-icon {
  flex: 0 0 auto;
  color: var(--corpcal-link);
}
.corpcal-print-activity-id-stacked {
  text-align: left;
}
.corpcal-print-activity-id-acronym {
  line-height: 1.2;
  margin-bottom: 2px;
  font-weight: 400;
}
.corpcal-print-activity-id-acronym strong {
  font-weight: 700;
}
.corpcal-print-dt-line {
  font-size: 1em;
  line-height: 1.35;
}
.corpcal-print-dt-time-line {
  margin-top: 2px;
}
.corpcal-print-dt-value {
  font-weight: 700;
  font-size: 1em;
  color: var(--print-ink);
}
.corpcal-print-meta-faint {
  font-size: 1em;
  color: var(--print-ink-faint);
}
.corpcal-print-title {
  font-weight: 600;
  font-size: 1em;
  line-height: 1.35;
  color: var(--print-ink);
}
.corpcal-print-rich {
  font-size: 1em;
  line-height: 1.5;
  color: var(--print-ink);
}
.corpcal-print-rich p { margin: 0 0 4px; }
.corpcal-print-rich p:last-child { margin-bottom: 0; }
.corpcal-print-rich ul,
.corpcal-print-rich ol {
  margin: 4px 0;
  padding-left: 18px;
}
.corpcal-print-rich li { margin: 0; }
.corpcal-print-rich a {
  color: var(--corpcal-link);
  text-decoration: underline;
}

.corpcal-print-flags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 2px;
}
/* Shad-style badge: rounded-full, body em, font-semibold, border/padding */
.corpcal-print-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  padding: 0.125rem 0.625rem;
  font-size: 1em;
  font-weight: 600;
  line-height: 1.25;
  border: 1px solid var(--print-border);
  background: var(--corpcal-surface);
  color: var(--print-ink-muted);
}
.corpcal-print-pill-confidential {
  border: 1px solid transparent;
  background: var(--corpcal-print-badge-confidential);
  color: #0f172a;
}
.corpcal-print-pill-issue {
  border: 1px solid transparent;
  background: var(--corpcal-print-badge-issue);
  color: #0f172a;
}
.corpcal-print-pill-fyi {
  border: 1px solid transparent;
  background: var(--corpcal-print-badge-fyi);
  color: #0f172a;
}
.corpcal-print-pill-la-new {
  border: 1px solid transparent;
  background: var(--print-status-new);
  color: #0f172a;
}
.corpcal-print-pill-la-changed {
  border: 1px solid transparent;
  background: var(--print-status-changed);
  color: #0f172a;
}
.corpcal-print-exec-summary-inline {
  display: inline;
}
.corpcal-print-rich-inline {
  display: inline;
}
.corpcal-print-rich-inline p,
.corpcal-print-rich-inline ul,
.corpcal-print-rich-inline ol,
.corpcal-print-rich-inline li {
  display: inline;
  margin: 0;
  padding: 0;
}

.corpcal-print-link {
  font-weight: 600;
}
.corpcal-print-empty {
  padding: 12px;
  font-size: 1em;
  font-style: italic;
  color: var(--print-ink-faint);
  border: 1px dashed var(--print-border);
  background: var(--corpcal-table-row-alt-bg);
}
.corpcal-print-empty-month {
  padding: 12px 8px;
  font-size: 0.9375em;
  font-style: italic;
  color: var(--print-ink-faint);
  text-align: center;
}

/* Look-ahead PDF cover only: one US Letter–aspect sheet at cover sheet width. */
.corpcal-print-cover-sheet {
  box-sizing: border-box;
  position: relative;
  width: ${REPORT_PRINT_COVER_SHEET_WIDTH_PX}px;
  height: calc(${REPORT_PRINT_COVER_SHEET_WIDTH_PX}px * 11 / 8.5);
  margin: 0 auto;
  padding: 0;
  page-break-after: always;
  break-after: page;
  overflow: hidden;
  background: #fff;
}
/* Inset matches .corpcal-print-body horizontal padding — artwork proportion-preserved inside. */
.corpcal-print-cover-inner {
  position: absolute;
  top: 0;
  bottom: 0;
  left: ${REPORT_PRINT_PAGE_HORIZONTAL_INSET_PX}px;
  right: ${REPORT_PRINT_PAGE_HORIZONTAL_INSET_PX}px;
  overflow: hidden;
}
.corpcal-print-cover-sheet img {
  display: block;
  position: relative;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  margin: 0;
}
.corpcal-print-cover-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  font-family: 'BCSans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.corpcal-print-cover-abs {
  position: absolute;
  margin: 0;
  white-space: pre-line;
}
/* Banner stack gap matches lookAheadCoverMetrics. */
.corpcal-print-cover-banner-stack {
  display: flex;
  flex-direction: column;
  text-align: left;
  gap: ${formatLookAheadCoverLayoutLength(LOOK_AHEAD_COVER_TYPO_BANNER_STACK_GAP_BASELINE_PX)};
  white-space: normal;
}
.corpcal-print-cover-gcpe-title {
  font-weight: 700;
  font-size: ${formatLookAheadCoverLayoutLength(LOOK_AHEAD_COVER_TYPO_GCPE_FONT_BASELINE_PX)};
  line-height: ${formatLookAheadCoverLayoutLength(LOOK_AHEAD_COVER_TYPO_GCPE_LINE_HEIGHT_BASELINE_PX)};
  color: var(--corpcal-text);
  text-align: left;
}
.corpcal-print-cover-banner-bc {
  font-weight: 700;
  font-size: ${formatLookAheadCoverLayoutLength(LOOK_AHEAD_COVER_TYPO_BANNER_BC_FONT_BASELINE_PX)};
  line-height: ${formatLookAheadCoverLayoutLength(LOOK_AHEAD_COVER_TYPO_BANNER_BC_LINE_HEIGHT_BASELINE_PX)};
  color: #fff;
  margin: 0;
}
.corpcal-print-cover-banner-corporate {
  font-weight: 400;
  font-size: ${formatLookAheadCoverLayoutLength(LOOK_AHEAD_COVER_TYPO_BANNER_CORP_FONT_BASELINE_PX)};
  line-height: ${formatLookAheadCoverLayoutLength(LOOK_AHEAD_COVER_TYPO_BANNER_CORP_LINE_HEIGHT_BASELINE_PX)};
  color: #fff;
  margin: 0;
  display: flex;
  flex-direction: column;
}
.corpcal-print-cover-banner-corporate-line {
  white-space: nowrap;
}
.corpcal-print-cover-date-range {
  font-weight: 700;
  font-size: ${formatLookAheadCoverLayoutLength(LOOK_AHEAD_COVER_TYPO_DATE_FONT_BASELINE_PX)};
  line-height: ${LOOK_AHEAD_COVER_CONTENTS_LINE_HEIGHT};
  color: var(--corpcal-text);
}
.corpcal-print-cover-contents-heading {
  font-weight: 400;
  font-size: ${formatLookAheadCoverLayoutLength(LOOK_AHEAD_COVER_TYPO_CONTENTS_FONT_BASELINE_PX)};
  line-height: ${LOOK_AHEAD_COVER_CONTENTS_LINE_HEIGHT};
  color: var(--corpcal-text);
}
.corpcal-print-cover-contents-list {
  /* List gap & row layout must stay aligned with lookAheadCoverFooterTopBaselinePx in lookAheadCoverMetrics. */
  font-weight: 400;
  font-size: ${formatLookAheadCoverLayoutLength(LOOK_AHEAD_COVER_TYPO_CONTENTS_FONT_BASELINE_PX)};
  line-height: ${LOOK_AHEAD_COVER_CONTENTS_LINE_HEIGHT};
  color: var(--corpcal-text);
  display: flex;
  flex-direction: column;
  gap: ${formatLookAheadCoverLayoutLength(LOOK_AHEAD_COVER_TYPO_CONTENTS_LIST_GAP_BASELINE_PX)};
}
.corpcal-print-cover-contents-row {
  display: flex;
  align-items: center;
  gap: ${formatLookAheadCoverLayoutLength(LOOK_AHEAD_COVER_TYPO_CONTENTS_ROW_GAP_BASELINE_PX)};
}
.corpcal-print-cover-contents-swatch {
  display: inline-block;
  width: ${formatLookAheadCoverLayoutLength(LOOK_AHEAD_COVER_TYPO_SWATCH_SIZE_BASELINE_PX)};
  height: ${formatLookAheadCoverLayoutLength(LOOK_AHEAD_COVER_TYPO_SWATCH_SIZE_BASELINE_PX)};
  border-radius: ${formatLookAheadCoverLayoutLength(LOOK_AHEAD_COVER_TYPO_SWATCH_RADIUS_BASELINE_PX)};
  border: 1px solid var(--print-border);
  flex: 0 0 auto;
}
.corpcal-print-cover-contents-label {
  flex: 1 1 auto;
}
.corpcal-print-cover-footer-note {
  font-weight: 400;
  font-size: ${formatLookAheadCoverLayoutLength(LOOK_AHEAD_COVER_TYPO_FOOTER_FONT_BASELINE_PX)};
  line-height: ${LOOK_AHEAD_COVER_CONTENTS_LINE_HEIGHT};
  color: var(--corpcal-text);
  max-width: 100%;
  overflow-wrap: anywhere;
  white-space: normal;
}
.corpcal-print-cover-footer-confidential {
  display: block;
}
.corpcal-print-cover-footer-questions {
  display: block;
  margin-top: ${formatLookAheadCoverLayoutLength(LOOK_AHEAD_COVER_FOOTER_CONFIDENTIAL_TO_QUESTIONS_GAP_BASELINE_PX)};
}
.corpcal-print-cover-footer-questions-line {
  display: inline-grid;
  grid-template-columns: max-content minmax(0, 1fr);
  column-gap: ${formatLookAheadCoverLayoutLength(LOOK_AHEAD_COVER_TYPO_BANNER_STACK_GAP_BASELINE_PX)};
  row-gap: 0;
  align-items: baseline;
  max-width: 100%;
  min-width: 0;
}
.corpcal-print-cover-footer-questions-prefix {
  grid-column: 1;
  grid-row: 1;
}
.corpcal-print-cover-footer-contact-item--phone {
  grid-column: 2;
  grid-row: 1;
}
.corpcal-print-cover-footer-contact-item--email {
  grid-column: 2;
  grid-row: 1;
  min-width: 0;
}
.corpcal-print-cover-footer-questions-line--stacked .corpcal-print-cover-footer-contact-item--email {
  grid-row: 2;
}
.corpcal-print-cover-footer-contact-item {
  display: inline-flex;
  align-items: baseline;
  flex: 0 1 auto;
  min-width: 0;
  max-width: 100%;
  gap: ${formatLookAheadCoverLayoutLength(LOOK_AHEAD_COVER_TYPO_BANNER_STACK_GAP_BASELINE_PX)};
}
.corpcal-print-cover-footer-contact-icon {
  flex: 0 0 auto;
  align-self: center;
  color: var(--corpcal-text);
}
.corpcal-print-cover-footer-contact-icon svg {
  display: block;
}
.corpcal-print-cover-footer-contact-text {
  flex: 1 1 auto;
  min-width: 0;
  overflow-wrap: anywhere;
}

/* Browser print only: Puppeteer puts the hint in footerTemplate ({@link buildReportPdfFooterTemplateHtml}). */
.corpcal-print-pdf-footer-hint-line {
  display: none;
}

.${CORPCAL_PRINT_ROOT_CLASS}[data-report-template="PLANNING"] {
  max-width: var(
    --corpcal-print-root-max-width,
    ${REPORT_PRINT_LANDSCAPE_LAYOUT_WIDTH_PX}px
  );
}

.${CORPCAL_PRINT_ROOT_CLASS}[data-report-template="PLANNING"] .corpcal-print-table col.corpcal-print-col-1 { width: 22%; }
.${CORPCAL_PRINT_ROOT_CLASS}[data-report-template="PLANNING"] .corpcal-print-table col.corpcal-print-col-2 { width: 38%; }
.${CORPCAL_PRINT_ROOT_CLASS}[data-report-template="PLANNING"] .corpcal-print-table col.corpcal-print-col-3 { width: 24%; }
.${CORPCAL_PRINT_ROOT_CLASS}[data-report-template="PLANNING"] .corpcal-print-table col.corpcal-print-col-4 { width: 16%; }
.${CORPCAL_PRINT_ROOT_CLASS}[data-report-template="PLANNING"] .corpcal-print-table thead th.corpcal-print-col-1,
.${CORPCAL_PRINT_ROOT_CLASS}[data-report-template="PLANNING"] .corpcal-print-table tbody td.corpcal-print-col-1 {
  width: 22%;
}
.${CORPCAL_PRINT_ROOT_CLASS}[data-report-template="PLANNING"] .corpcal-print-table thead th.corpcal-print-col-2,
.${CORPCAL_PRINT_ROOT_CLASS}[data-report-template="PLANNING"] .corpcal-print-table tbody td.corpcal-print-col-2 {
  width: 38%;
}
.${CORPCAL_PRINT_ROOT_CLASS}[data-report-template="PLANNING"] .corpcal-print-table thead th.corpcal-print-col-3,
.${CORPCAL_PRINT_ROOT_CLASS}[data-report-template="PLANNING"] .corpcal-print-table tbody td.corpcal-print-col-3 {
  width: 24%;
}
.${CORPCAL_PRINT_ROOT_CLASS}[data-report-template="PLANNING"] .corpcal-print-table thead th.corpcal-print-col-4,
.${CORPCAL_PRINT_ROOT_CLASS}[data-report-template="PLANNING"] .corpcal-print-table tbody td.corpcal-print-col-4 {
  width: 16%;
}
.corpcal-print-planning-date-extras {
  margin-top: 6px;
}

.${CORPCAL_PRINT_ROOT_CLASS}[data-report-template="THIRTY_SIXTY_NINETY"] .corpcal-print-pdf-first-page-title,
.${CORPCAL_PRINT_ROOT_CLASS}[data-report-template="PLANNING"] .corpcal-print-pdf-first-page-title {
  display: none;
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
  padding: 24px 0 20px;
  color: var(--print-ink);
}
.corpcal-print-preview-shell .corpcal-print-pdf-first-page-title {
  display: none !important;
}

/* Preview-only sticky stacking for the look-ahead rollup table. Wrapped in
   .corpcal-print-preview-shell so the same PRINT_STYLES string that powers the
   Puppeteer PDF stays unaffected (the wrapper is only injected by the in-app
   preview component).
   Bands: section title (top: 0) -> flat rollup: thead column header | per-day:
   day heading then cloned column header row. Tight preview-only paddings keep
   sticky offsets aligned so content does not show between bands.
   --corpcal-print-sticky-section-band / --corpcal-print-sticky-day-band must
   match painted row heights under these preview overrides (adjust if typography
   changes). */
.corpcal-print-preview-shell {
  --corpcal-print-sticky-section-band: 46px;
  --corpcal-print-sticky-day-band: 42px;
}
.corpcal-print-preview-shell .corpcal-print-section-rollup-table .corpcal-print-section-heading-cell {
  position: sticky;
  top: 0;
  z-index: 5;
  background: var(--corpcal-surface);
  padding: 16px 0 4px;
}
.corpcal-print-preview-shell .corpcal-print-section-rollup-table .corpcal-print-day-heading {
  padding-top: 16px;
}
.corpcal-print-preview-shell .corpcal-print-section-rollup-table thead tr.corpcal-print-rollup-thead-column-header-row th {
  position: sticky;
  top: var(--corpcal-print-sticky-section-band);
  z-index: 4;
}
.corpcal-print-preview-shell .corpcal-print-section-rollup-table thead tr.corpcal-print-rollup-thead-column-header-row th:not(.corpcal-print-section-thead-cell) {
  background: var(--corpcal-table-header-bg);
  color: var(--corpcal-table-header-fg);
}
.corpcal-print-preview-shell .corpcal-print-section-rollup-table .corpcal-print-day-heading-cell {
  position: sticky;
  top: var(--corpcal-print-sticky-section-band);
  z-index: 4;
  background: var(--corpcal-surface);
}
.corpcal-print-preview-shell .corpcal-print-section-rollup-table tbody tr.corpcal-print-per-day-column-header-row th {
  position: sticky;
  top: calc(
    var(--corpcal-print-sticky-section-band) + var(--corpcal-print-sticky-day-band)
  );
  z-index: 3;
}
.corpcal-print-preview-shell .corpcal-print-section-rollup-table tbody tr.corpcal-print-per-day-column-header-row th:not(.corpcal-print-section-thead-cell) {
  background: var(--corpcal-table-header-bg);
  color: var(--corpcal-table-header-fg);
}

@media print {
  @page {
    size: letter;
  }
  @page planning-page {
    size: letter landscape;
  }
  .${CORPCAL_PRINT_ROOT_CLASS}[data-report-template="PLANNING"] {
    max-width: none;
    page: planning-page;
  }
  /*
   * Standalone cover PDF (merged with body in a second pass): do not force a page break after
   * the only cover block — avoids a trailing blank Letter page before the merger appends pages.
   * (Non-standalone HTML keeps page-break-after: always so body content starts on page 2.)
   */
  .corpcal-print-pdf-cover-sheet-only-doc .corpcal-print-cover-sheet {
    page-break-after: auto;
    break-after: auto;
  }
  /*
   * Letter-aspect cover at layout width (~1325px) exceeds one PDF page when paired with header/footer;
   * height uses REPORT_PRINT_PDF_BODY_CONTENT_HEIGHT_PX (tuned for overlay/footer visibility).
   * Image uses cover + top anchoring so width fills and bottom art may crop (see img rules below).
   */
  .corpcal-print-cover-sheet {
    z-index: 2;
    height: ${REPORT_PRINT_PDF_BODY_CONTENT_HEIGHT_PX}px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .corpcal-print-cover-sheet img {
    object-fit: cover;
    object-position: top center;
  }
  .${CORPCAL_PRINT_ROOT_CLASS} {
    font-size: var(--print-body-font-size);
  }
  .${CORPCAL_PRINT_ROOT_CLASS}[data-report-template="THIRTY_SIXTY_NINETY"] .corpcal-print-pdf-first-page-title,
  .${CORPCAL_PRINT_ROOT_CLASS}[data-report-template="PLANNING"] .corpcal-print-pdf-first-page-title {
    display: block;
    page-break-after: avoid;
    break-after: avoid;
  }
  .corpcal-print-table { page-break-inside: auto; }
  .corpcal-print-table tr { page-break-inside: avoid; page-break-after: auto; }
  .corpcal-print-day-tbody { page-break-inside: avoid; }
  .corpcal-print-pdf-footer-hint-line {
    display: block;
    box-sizing: border-box;
    position: fixed;
    left: 0;
    right: 0;
    bottom: -4px;
    margin: 0;
    padding: 2px calc(${REPORT_PRINT_PAGE_HORIZONTAL_INSET_PX}px + 2px) 3px ${REPORT_PRINT_PAGE_HORIZONTAL_INSET_PX}px;
    font-family: 'BCSans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.4;
    color: var(--corpcal-table-cell-muted-fg);
    background: #fff;
    z-index: 1;
    pointer-events: none;
  }
  .corpcal-print-pdf-footer-hint-line strong {
    color: inherit;
    font-weight: 700;
  }
}
`;
