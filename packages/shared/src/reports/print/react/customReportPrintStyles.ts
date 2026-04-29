import { REPORT_PRINT_SHEET_CONTENT_MAX_WIDTH_CSS } from '../../reportPrintDimensions';

export const CUSTOM_REPORT_PRINT_STYLES = `
.custom-report-root {
  font-family: BCSans, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: 0.875rem;
  line-height: 1.4;
  color: #0f172a;
  box-sizing: border-box;
  max-width: var(--corpcal-print-root-max-width, ${REPORT_PRINT_SHEET_CONTENT_MAX_WIDTH_CSS});
  margin-left: auto;
  margin-right: auto;
  transition: max-width 300ms ease-out;
}
.custom-report-root *, .custom-report-root *::before, .custom-report-root *::after { box-sizing: border-box; }
.custom-report-doc-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 1rem;
  color: #0f172a;
}
.custom-report-table-wrap {
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  overflow: hidden;
  background: #fff;
}
.custom-report-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
  word-wrap: break-word;
  overflow-wrap: break-word;
}
.custom-report-table th,
.custom-report-table td {
  white-space: normal;
  vertical-align: top;
  text-align: left;
}
.custom-report-thead-row .custom-report-th {
  background: rgba(244, 244, 245, 0.95);
  font-weight: 600;
  font-size: 0.875rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  color: #0f172a;
}
.custom-report-col-date { width: 16.666%; }
.custom-report-col-lead { width: 16.666%; }
.custom-report-col-details { width: 50%; }
.custom-report-col-release { width: 16.666%; }
.custom-report-col-id { width: 16.666%; }
.custom-report-td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f1f5f9;
  background: #fff;
  font-size: 0.875rem;
}
.custom-report-td-break {
  overflow-wrap: break-word;
  word-wrap: break-word;
}
.custom-report-row-even .custom-report-td { background: #f8fafc; }
.custom-report-empty {
  padding: 2rem 1rem;
  text-align: center;
  color: #64748b;
  font-size: 0.875rem;
}
.custom-report-section-row td {
  padding: 0.5rem 1rem;
  font-weight: 600;
  font-size: 0.75rem;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
  color: #334155;
}
.custom-report-stack { display: flex; flex-direction: column; }
.custom-report-stack-sm > * + * { margin-top: 0.25rem; }
.custom-report-stack-md > * + * { margin-top: 0.375rem; }
.custom-report-stack-lg > * + * { margin-top: 0.5rem; }
.custom-report-text-xs-medium-muted {
  font-size: 0.75rem;
  font-weight: 500;
  color: #475569;
}
.custom-report-dt-value {
  font-weight: 500;
  color: #0f172a;
}
.custom-report-dt-inline-muted {
  font-weight: 500;
  color: #64748b;
}
.custom-report-dt-time-row {
  margin-top: 0.125rem;
}
.custom-report-text-sm-medium {
  font-size: 0.875rem;
  font-weight: 500;
  color: #0f172a;
}
.custom-report-text-sm-muted {
  font-size: 0.875rem;
  font-weight: 400;
  color: #334155;
}
.custom-report-text-xs-muted-plain {
  font-size: 0.75rem;
  color: #475569;
}
.custom-report-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
  overflow-wrap: break-word;
}
.custom-report-tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}
.custom-report-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  padding: 0.125rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.25;
}
.custom-report-badge-outline {
  border: 1px solid #e2e8f0;
  color: #475569;
  background: #fff;
}
.custom-report-badge-warning {
  border: 1px solid transparent;
  background: #fcba19;
  color: #0f172a;
}
.custom-report-badge-info {
  border: 1px solid transparent;
  background: #013366;
  color: #fff;
}
.custom-report-badge-secondary {
  border: 1px solid transparent;
  background: #f4f4f5;
  color: #0f172a;
}
.custom-report-la-badge-wrap,
.custom-report-status-badge-wrap {
  margin-top: 0.125rem;
}
.custom-report-display-id {
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 0.25rem;
}
.custom-report-exec-summary {
  font-size: 0.75rem;
  line-height: 1.625;
  color: #475569;
  font-weight: 400;
}
.custom-report-rich-wrap { min-width: 0; }
.custom-report-rich-text p { margin: 0 0 0.25rem; }
.custom-report-rich-text p:last-child { margin-bottom: 0; }
.custom-report-rich-text ul, .custom-report-rich-text ol {
  margin: 0.25rem 0;
  padding-left: 1.25rem;
}
.custom-report-rich-text li { margin: 0; }
.custom-report-rich-text a {
  color: #013366;
  text-decoration: underline;
  text-underline-offset: 2px;
}
`;
