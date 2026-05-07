import { CORPCAL_SEMANTIC_TOKEN_CSS } from '../../../styles/corpcalTokensEmbedded.generated';
import {
  REPORT_PRINT_LAYOUT_WIDTH_PX,
  REPORT_PRINT_SHEET_CONTENT_MAX_WIDTH_CSS,
} from '../../reportPrintDimensions';
import { LOOK_AHEAD_COVER_FIGMA_PAGE_WIDTH_PX } from './lookAheadCoverLayout';

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
  --print-header-bg: var(--corpcal-table-header-bg);
  --print-header-fg: var(--corpcal-table-header-fg);
  --print-banner-bg: var(--corpcal-table-row-alt-bg);
  --print-banner-fg: var(--corpcal-table-cell-muted-fg);
  --print-section-fg: var(--corpcal-text);
  --print-zebra: var(--corpcal-table-row-alt-bg);
  --print-accent-red: var(--corpcal-print-accent-red);
  --print-accent-red-soft: var(--corpcal-print-accent-red-soft);
  --print-accent-blue: var(--corpcal-print-accent-blue);
  --print-accent-blue-soft: var(--corpcal-print-accent-blue-soft);
  --print-accent-amber: var(--corpcal-print-accent-amber);
  --print-accent-amber-soft: var(--corpcal-print-accent-amber-soft);
  --print-status-new: #b7e8ea;
  --print-status-changed: #ffddb3;
  --print-status-red: #ff978d;

  /* Body size for the whole subtree; descendant font sizes use em so they scale with this root (browser zoom still applies to the page). */
  --print-body-font-size: 14px;
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

.corpcal-print-header {
  background: var(--print-header-bg);
  color: var(--print-header-fg);
  padding: 18px 24px 14px;
  position: relative;
}
.corpcal-print-header-title {
  margin: 0;
  font-size: calc(1em * 20 / 12);
  font-weight: 700;
  letter-spacing: 0.02em;
}
.corpcal-print-header-range {
  margin: 6px 0 0;
  font-size: 1em;
  font-weight: 400;
  opacity: 0.95;
}
.corpcal-print-header-confidential {
  position: absolute;
  top: 18px;
  right: 24px;
  font-size: 1em;
  font-weight: 700;
  color: var(--corpcal-text-alert);
  letter-spacing: 0.06em;
}

.corpcal-print-banner {
  background: var(--print-banner-bg);
  border-bottom: 1px solid var(--print-border);
  padding: 8px 24px;
  font-size: 1em;
  font-weight: 700;
  color: var(--print-banner-fg);
}
.corpcal-print-banner-sub {
  display: block;
  font-weight: 400;
  color: var(--print-ink-muted);
  margin-top: 2px;
}

.corpcal-print-body {
  padding: 4px 24px 20px;
}
.corpcal-print-body > .corpcal-print-section-block + .corpcal-print-section-block {
  margin-top: 8px;
}
.corpcal-print-day {
  margin-top: 16px;
}
.corpcal-print-section-heading + .corpcal-print-day {
  margin-top: 6px;
}
.corpcal-print-day-heading {
  margin: 0 0 6px;
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
.corpcal-print-table col.corpcal-print-col-1 { width: 20%; }
.corpcal-print-table col.corpcal-print-col-2 { width: 8%; }
.corpcal-print-table col.corpcal-print-col-3 { width: 45%; }
.corpcal-print-table col.corpcal-print-col-4 { width: 15%; }
.corpcal-print-table col.corpcal-print-col-5 { width: 12%; }
.corpcal-print-root .corpcal-print-table thead th.corpcal-print-col-1,
.corpcal-print-root .corpcal-print-table tbody td.corpcal-print-col-1 {
  width: 20%;
}
.corpcal-print-root .corpcal-print-table thead th.corpcal-print-col-2,
.corpcal-print-root .corpcal-print-table tbody td.corpcal-print-col-2 {
  width: 8%;
}
.corpcal-print-root .corpcal-print-table thead th.corpcal-print-col-3,
.corpcal-print-root .corpcal-print-table tbody td.corpcal-print-col-3 {
  width: 45%;
}
.corpcal-print-root .corpcal-print-table thead th.corpcal-print-col-4,
.corpcal-print-root .corpcal-print-table tbody td.corpcal-print-col-4 {
  width: 15%;
}
.corpcal-print-root .corpcal-print-table thead th.corpcal-print-col-5,
.corpcal-print-root .corpcal-print-table tbody td.corpcal-print-col-5 {
  width: 12%;
}

/* Look-ahead section legend fill on thead cells: preserve in PDF/export (Chrome). */
.corpcal-print-table thead th.corpcal-print-section-thead-cell {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.corpcal-print-stack > * + * { margin-top: 4px; }
.corpcal-print-stack-md > * + * { margin-top: 6px; }
.corpcal-print-stack-lg > * + * { margin-top: 8px; }

.corpcal-print-meta-strong {
  font-weight: 700;
  font-size: 1em;
  color: var(--print-ink);
}
.corpcal-print-meta {
  font-size: 1em;
  color: var(--print-ink-muted);
}
.corpcal-print-inline-status {
  font-weight: 500;
  color: var(--print-ink-muted);
  white-space: normal;
}
.corpcal-print-inline-row {
  display: flex;
  align-items: center;
  gap: 0;
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
  color: var(--print-ink-muted);
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
.corpcal-print-flag {
  font-size: 1em;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--print-ink-muted);
}
.corpcal-print-flag-alert {
  color: var(--corpcal-text-alert);
}
.corpcal-print-flag-fyi {
  color: var(--bc-gold);
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
.corpcal-print-pill-issue {
  border: 1px solid color-mix(in oklch, var(--bcsds-red-90) 20%, transparent);
  background: var(--print-accent-red-soft);
  color: var(--print-accent-red);
}
.corpcal-print-pill-confidential {
  border: 1px solid color-mix(in oklch, var(--bcsds-gold-80) 30%, transparent);
  background: var(--print-accent-amber-soft);
  color: #0f172a;
}
.corpcal-print-pill-fyi {
  border: 1px solid color-mix(in oklch, var(--bc-gold) 45%, transparent);
  background: color-mix(in oklch, var(--bc-gold) 22%, var(--corpcal-surface));
  color: var(--print-ink);
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

/* Look-ahead PDF cover only: one US Letter–aspect sheet at canonical print layout width. */
.corpcal-print-cover-sheet {
  box-sizing: border-box;
  position: relative;
  width: ${REPORT_PRINT_LAYOUT_WIDTH_PX}px;
  height: calc(${REPORT_PRINT_LAYOUT_WIDTH_PX}px * 11 / 8.5);
  margin: 0 auto;
  padding: 0;
  page-break-after: always;
  break-after: page;
  overflow: hidden;
  background: #fff;
}
.corpcal-print-cover-sheet img {
  display: block;
  position: relative;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  margin: 0;
}
.corpcal-print-cover-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  font-family: 'BCSans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  /* Scale Figma typography (612px frame) to print layout width */
  --lc-s: calc(${REPORT_PRINT_LAYOUT_WIDTH_PX} / ${LOOK_AHEAD_COVER_FIGMA_PAGE_WIDTH_PX});
}
.corpcal-print-cover-abs {
  position: absolute;
  margin: 0;
  white-space: pre-line;
}
/* Figma 188×73 hug: flex + 1px gap; old banner-bc margin-bottom was ~12 Figma-px too tall. */
.corpcal-print-cover-banner-stack {
  display: flex;
  flex-direction: column;
  text-align: left;
  gap: calc(1px * var(--lc-s));
  white-space: normal;
}
.corpcal-print-cover-confidential-flag {
  text-align: right;
  text-transform: uppercase;
  font-weight: 700;
  font-size: calc(12px * var(--lc-s));
  line-height: 1.2;
  color: var(--corpcal-text-alert);
}
.corpcal-print-cover-gcpe-title {
  font-weight: 700;
  font-size: calc(14px * var(--lc-s));
  line-height: calc(16px * var(--lc-s));
  color: var(--corpcal-text);
}
.corpcal-print-cover-banner-bc {
  font-weight: 700;
  font-size: calc(20px * var(--lc-s));
  line-height: calc(20px * var(--lc-s));
  color: #fff;
  margin: 0;
}
.corpcal-print-cover-banner-corporate {
  font-weight: 400;
  font-size: calc(30px * var(--lc-s));
  line-height: calc(26px * var(--lc-s));
  color: #fff;
  margin: 0;
  white-space: pre-line;
}
.corpcal-print-cover-date-range {
  font-weight: 700;
  font-size: calc(16px * var(--lc-s));
  line-height: 1.35;
  color: var(--corpcal-text);
}
.corpcal-print-cover-contents-heading {
  font-weight: 400;
  font-size: calc(14px * var(--lc-s));
  line-height: 1.35;
  color: var(--corpcal-text);
}
.corpcal-print-cover-contents-list {
  font-weight: 400;
  font-size: calc(14px * var(--lc-s));
  line-height: 1.35;
  color: var(--corpcal-text);
  display: flex;
  flex-direction: column;
  gap: calc(4px * var(--lc-s));
}
.corpcal-print-cover-contents-row {
  display: flex;
  align-items: center;
  gap: calc(8px * var(--lc-s));
}
.corpcal-print-cover-contents-swatch {
  display: inline-block;
  width: calc(16px * var(--lc-s));
  height: calc(16px * var(--lc-s));
  border-radius: calc(3px * var(--lc-s));
  border: 1px solid var(--print-border);
  flex: 0 0 auto;
}
.corpcal-print-cover-contents-label {
  flex: 1 1 auto;
}
.corpcal-print-cover-footer-note {
  font-weight: 400;
  font-size: calc(12px * var(--lc-s));
  line-height: 1.4;
  color: var(--corpcal-text);
}

.corpcal-print-page-footer {
  margin-top: 16px;
  padding: 10px 24px 14px;
  font-size: 1em;
  line-height: 1.45;
  color: var(--print-ink-muted);
  border-top: 1px solid var(--print-border-soft);
  background: var(--corpcal-surface);
}
.corpcal-print-page-footer-line + .corpcal-print-page-footer-line {
  margin-top: 4px;
}
.corpcal-print-page-footer-confidential {
  font-size: 1em;
  font-weight: 700;
  color: var(--corpcal-text-alert);
  letter-spacing: 0.04em;
}
.corpcal-print-page-footer-timestamp {
  font-size: 1em;
  color: var(--print-ink);
}
.corpcal-print-page-footer-hint {
  font-size: 1em;
  color: var(--print-ink-muted);
}

@media print {
  /* Cover is a body sibling before the report; fixed footer would otherwise print on
     every sheet. Stack the one-page cover above the footer so sheet 1 has no footer. */
  .corpcal-print-cover-sheet {
    z-index: 2;
  }
  .corpcal-print-root:has(> .corpcal-print-page-footer),
  .custom-report-root:has(> .corpcal-print-page-footer) {
    padding-bottom: 5.5rem;
    position: relative;
    z-index: 0;
  }
  .corpcal-print-page-footer {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
    margin-top: 0;
  }
  .${CORPCAL_PRINT_ROOT_CLASS} {
    font-size: var(--print-body-font-size);
  }
  .corpcal-print-table { page-break-inside: auto; }
  .corpcal-print-table tr { page-break-inside: avoid; page-break-after: auto; }
  .corpcal-print-day { page-break-inside: avoid; }
}
`;
