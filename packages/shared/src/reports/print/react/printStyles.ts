import { CORPCAL_SEMANTIC_TOKEN_CSS } from '../../../styles/corpcalTokensEmbedded.generated';

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

  font-family: 'BCSans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 11px;
  line-height: 1.4;
  color: var(--print-ink);
  background: var(--corpcal-surface);
  box-sizing: border-box;
}
.${CORPCAL_PRINT_ROOT_CLASS} *,
.${CORPCAL_PRINT_ROOT_CLASS} *::before,
.${CORPCAL_PRINT_ROOT_CLASS} *::after {
  box-sizing: border-box;
}
.${CORPCAL_PRINT_ROOT_CLASS} a {
  color: var(--print-accent-blue);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.${CORPCAL_PRINT_ROOT_CLASS} a:hover {
  text-decoration-thickness: 2px;
}

.corpcal-print-header {
  background: var(--print-header-bg);
  color: var(--print-header-fg);
  padding: 18px 24px 14px;
  position: relative;
}
.corpcal-print-header-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.corpcal-print-header-range {
  margin: 6px 0 0;
  font-size: 12px;
  font-weight: 400;
  opacity: 0.95;
}
.corpcal-print-header-confidential {
  position: absolute;
  top: 18px;
  right: 24px;
  font-size: 11px;
  font-weight: 700;
  color: var(--print-accent-red);
  letter-spacing: 0.06em;
}

.corpcal-print-banner {
  background: var(--print-banner-bg);
  border-bottom: 1px solid var(--print-border);
  padding: 8px 24px;
  font-size: 10px;
  font-weight: 700;
  color: var(--print-banner-fg);
}
.corpcal-print-banner-sub {
  display: block;
  font-weight: 400;
  color: var(--print-ink-muted);
  margin-top: 2px;
}

.corpcal-print-contents {
  padding: 12px 24px 4px;
  font-size: 10px;
  color: var(--print-ink-muted);
}
.corpcal-print-contents-title {
  font-weight: 700;
  margin-bottom: 4px;
}
.corpcal-print-contents ul {
  margin: 0;
  padding-left: 18px;
}

.corpcal-print-body {
  padding: 4px 24px 24px;
}
.corpcal-print-day {
  margin-top: 16px;
}
.corpcal-print-day:first-child {
  margin-top: 6px;
}
.corpcal-print-day-heading {
  margin: 0 0 6px;
  padding: 6px 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--print-section-fg);
  border-bottom: 2px solid var(--print-section-fg);
  text-align: center;
}
.corpcal-print-section-heading {
  margin: 12px 0 4px;
  font-size: 11px;
  font-weight: 700;
  color: var(--print-section-fg);
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
  font-size: 10.5px;
}
.corpcal-print-table th {
  text-align: left;
  padding: 6px 8px;
  background: var(--corpcal-table-header-bg);
  color: var(--corpcal-table-header-fg);
  font-weight: 600;
  font-size: 10px;
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
.corpcal-print-col-1 { width: 20%; }
.corpcal-print-col-2 { width: 20%; }
.corpcal-print-col-3 { width: 42%; }
.corpcal-print-col-4 { width: 18%; }

.corpcal-print-stack > * + * { margin-top: 4px; }
.corpcal-print-stack-md > * + * { margin-top: 6px; }
.corpcal-print-stack-lg > * + * { margin-top: 8px; }

.corpcal-print-meta-strong {
  font-weight: 700;
  font-size: 11px;
  color: var(--print-ink);
}
.corpcal-print-meta {
  font-size: 10px;
  color: var(--print-ink-muted);
}
.corpcal-print-meta-faint {
  font-size: 10px;
  color: var(--print-ink-faint);
}
.corpcal-print-title {
  font-weight: 700;
  font-size: 11.5px;
  line-height: 1.35;
  color: var(--print-ink);
}
.corpcal-print-rich {
  font-size: 10.5px;
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
  color: var(--print-accent-blue);
  text-decoration: underline;
}

.corpcal-print-flags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 2px;
}
.corpcal-print-pill {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 2px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border: 1px solid var(--print-border);
  background: var(--corpcal-surface);
  color: var(--print-ink-muted);
}
.corpcal-print-pill-issue {
  background: var(--print-accent-red-soft);
  color: var(--print-accent-red);
  border-color: var(--print-accent-red);
}
.corpcal-print-pill-confidential {
  background: var(--print-accent-amber-soft);
  color: var(--print-accent-amber);
  border-color: var(--print-accent-amber);
}
.corpcal-print-pill-fyi {
  background: var(--print-accent-blue-soft);
  color: var(--print-accent-blue);
  border-color: var(--print-accent-blue);
}
.corpcal-print-pill-la-new {
  background: var(--print-accent-blue-soft);
  color: var(--print-accent-blue);
  border-color: var(--print-accent-blue);
}
.corpcal-print-pill-la-changed {
  background: var(--print-accent-amber-soft);
  color: var(--print-accent-amber);
  border-color: var(--print-accent-amber);
}

.corpcal-print-link {
  font-weight: 600;
}
.corpcal-print-empty {
  padding: 12px;
  font-size: 11px;
  font-style: italic;
  color: var(--print-ink-faint);
  border: 1px dashed var(--print-border);
  background: var(--corpcal-table-row-alt-bg);
}

.corpcal-print-footer {
  margin-top: 18px;
  padding: 8px 24px 16px;
  font-size: 9px;
  color: var(--print-ink-faint);
  border-top: 1px solid var(--print-border-soft);
}
.corpcal-print-footer-confidential {
  font-weight: 700;
  color: var(--print-accent-red);
  margin-bottom: 3px;
}

@media print {
  .${CORPCAL_PRINT_ROOT_CLASS} {
    font-size: 10.5px;
  }
  .corpcal-print-table { page-break-inside: auto; }
  .corpcal-print-table tr { page-break-inside: avoid; page-break-after: auto; }
  .corpcal-print-day { page-break-inside: avoid; }
}
`;
