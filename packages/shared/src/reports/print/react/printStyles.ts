/**
 * Single source of print styles for both in-app preview and Puppeteer-generated
 * PDFs. Exported as a verbatim string so the calendar-service can inject the
 * same bytes the browser sees — no drift, no runtime Tailwind.
 *
 * This replaces the originally planned two-step Tailwind build artifact: the
 * maintainability goal (one stylesheet, consumed identically by both paths) is
 * met with a single hand-authored rule set compiled into the shared package's
 * ESM and CJS outputs. The service reads these bytes via a normal import —
 * no build orchestration, no filesystem lookups.
 *
 * Scoped under `.corpcal-print-root` so the rules never leak into the
 * surrounding calendar-ui shell when mounted in the preview pane.
 */
export const CORPCAL_PRINT_ROOT_CLASS = 'corpcal-print-root';

export const PRINT_STYLES = `
.${CORPCAL_PRINT_ROOT_CLASS} {
  --print-ink: #111418;
  --print-ink-muted: #3f4a5a;
  --print-ink-faint: #5b6472;
  --print-border: #c7ccd4;
  --print-border-soft: #e5e8ee;
  --print-header-bg: #013366;
  --print-header-fg: #ffffff;
  --print-banner-bg: #fff8e1;
  --print-banner-fg: #5c4a00;
  --print-section-fg: #223b6b;
  --print-zebra: #f6f7fa;
  --print-accent-red: #902b28;
  --print-accent-red-soft: #f4e1e2;
  --print-accent-blue: #1e5189;
  --print-accent-blue-soft: #d8eafd;
  --print-accent-amber: #a5792b;
  --print-accent-amber-soft: #fef1d8;

  font-family: 'BCSans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 11px;
  line-height: 1.4;
  color: var(--print-ink);
  background: #ffffff;
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
  color: #ffc7c3;
  letter-spacing: 0.06em;
}

.corpcal-print-banner {
  background: var(--print-banner-bg);
  border-bottom: 1px solid #e0c766;
  padding: 8px 24px;
  font-size: 10px;
  font-weight: 700;
  color: var(--print-banner-fg);
}
.corpcal-print-banner-sub {
  display: block;
  font-weight: 400;
  color: #6a5a10;
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
  border-radius: 2px;
  overflow: hidden;
}
.corpcal-print-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 10.5px;
}
.corpcal-print-table th {
  text-align: left;
  padding: 6px 8px;
  background: #1a1a1a;
  color: #ffffff;
  font-weight: 700;
  font-size: 10px;
  border: 1px solid #1a1a1a;
}
.corpcal-print-table td {
  vertical-align: top;
  padding: 8px;
  border: 1px solid var(--print-border);
  word-wrap: break-word;
  overflow-wrap: break-word;
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
  background: #ffffff;
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
  background: #fafbfc;
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
