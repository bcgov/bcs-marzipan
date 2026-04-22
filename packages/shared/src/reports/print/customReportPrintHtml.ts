import type { ReportDataResponse } from '../../api/report-data';
import type { ActivityResponse } from '../../schemas/activity-response.schema';
import { plainTextFromActivityRichField } from '../../utils/activity-rich-text';
import { activityStoredValueToSanitizedHtmlForPrint } from './activityRichTextPrintHtml';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isReportDataResponse(data: unknown): data is ReportDataResponse {
  if (!isRecord(data)) return false;
  const { report, sections } = data;
  if (!isRecord(report)) return false;
  if (typeof report.displayName !== 'string') return false;
  if (!Array.isArray(sections)) return false;
  return sections.every(
    (s) =>
      isRecord(s) && typeof s.name === 'string' && Array.isArray(s.activities)
  );
}

/** Matches calendar-ui `formatExactDate` (short month, day, year). */
function formatExactDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Matches calendar-ui `formatTime12h` for HH:mm strings. */
function formatTime12h(timeStr: string | null): string {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hourParsed = parseInt(h ?? '0', 10);
  const minuteParsed = parseInt((m ?? '00').padStart(2, '0'), 10);
  const hour = Number.isFinite(hourParsed)
    ? Math.min(23, Math.max(0, hourParsed))
    : 0;
  const minute = Number.isFinite(minuteParsed)
    ? Math.min(59, Math.max(0, minuteParsed))
    : 0;
  const minuteStr = String(minute).padStart(2, '0');
  const ampm = hour >= 12 ? 'pm' : 'am';
  const h12 = hour % 12 || 12;
  return `${h12}:${minuteStr} ${ampm}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatReportDate(activity: ActivityResponse): string {
  const startDate = activity.startDate ? new Date(activity.startDate) : null;
  return startDate ? formatExactDate(startDate) : '–';
}

function formatReportTime(activity: ActivityResponse): string {
  return activity.startTime ? formatTime12h(activity.startTime) : '–';
}

function getEventPlannerLeadName(
  activity: ActivityResponse
): string | undefined {
  const lead = activity.eventPlannerDetails?.find((p) => p.isLead);
  return lead?.name?.trim() || undefined;
}

function badgeOutline(text: string): string {
  return `<span class="custom-report-badge custom-report-badge-outline">${escapeHtml(text)}</span>`;
}

function badgeWarning(text: string): string {
  return `<span class="custom-report-badge custom-report-badge-warning">${escapeHtml(text)}</span>`;
}

function badgeInfo(text: string): string {
  return `<span class="custom-report-badge custom-report-badge-info">${escapeHtml(text)}</span>`;
}

function badgeSecondary(text: string): string {
  return `<span class="custom-report-badge custom-report-badge-secondary">${escapeHtml(text)}</span>`;
}

function buildDateTimeColumnHtml(activity: ActivityResponse): string {
  const parts: string[] = [];

  const dateLine = formatReportDate(activity);
  const timeLine = formatReportTime(activity);
  const timeStatus = activity.timeStatus?.trim();

  parts.push(`<div class="custom-report-stack custom-report-stack-md">`);
  parts.push(`<div>`);
  parts.push(
    `<div class="custom-report-text-xs-medium-muted">${escapeHtml(dateLine)}</div>`
  );
  parts.push(
    `<div class="custom-report-text-sm-medium">${escapeHtml(timeLine)}</div>`
  );
  if (timeStatus) {
    parts.push(
      `<div class="custom-report-text-sm-medium">${escapeHtml(timeStatus)}</div>`
    );
  }
  parts.push(`</div>`);

  if (activity.premierRequested) {
    parts.push(
      `<div>${badgeWarning(`Premier: ${activity.premierRequested}`)}</div>`
    );
  }

  if (activity.tags.length > 0) {
    parts.push(`<div class="custom-report-tag-row">`);
    for (const tag of activity.tags) {
      parts.push(badgeOutline(tag.text));
    }
    parts.push(`</div>`);
  }

  parts.push(`</div>`);
  return parts.join('');
}

function buildLeadColumnHtml(activity: ActivityResponse): string {
  const parts: string[] = [];
  parts.push(`<div class="custom-report-stack custom-report-stack-sm">`);

  const ministry =
    activity.leadMinistryAbbreviation ?? activity.leadMinistry ?? '–';
  parts.push(`<div>`);
  parts.push(`<div class="custom-report-text-xs-medium-muted">Ministry</div>`);
  parts.push(
    `<div class="custom-report-text-sm-medium">${escapeHtml(ministry)}</div>`
  );
  parts.push(`</div>`);

  if (activity.leadOrg) {
    parts.push(`<div>`);
    parts.push(
      `<div class="custom-report-text-xs-medium-muted">Organization</div>`
    );
    parts.push(
      `<div class="custom-report-text-sm-muted">${escapeHtml(activity.leadOrg)}</div>`
    );
    parts.push(`</div>`);
  }

  parts.push(`</div>`);
  return parts.join('');
}

function buildActivityDetailsColumnHtml(activity: ActivityResponse): string {
  const parts: string[] = [];
  parts.push(`<div class="custom-report-stack custom-report-stack-lg">`);

  parts.push(`<div>`);
  parts.push(
    `<div class="custom-report-title">${escapeHtml(activity.title)}</div>`
  );
  parts.push(`</div>`);

  if (activity.isConfidential) {
    parts.push(
      `<div class="custom-report-text-xs-medium-muted">Confidential</div>`
    );
  }
  if (activity.isIssue) {
    parts.push(`<div class="custom-report-text-xs-medium-muted">Issue</div>`);
  }
  if (activity.category.includes('FYI')) {
    parts.push(`<div class="custom-report-text-xs-medium-muted">FYI</div>`);
  }

  if (plainTextFromActivityRichField(activity.summary).length > 0) {
    const inner = activityStoredValueToSanitizedHtmlForPrint(activity.summary);
    if (inner) {
      parts.push(
        `<div class="custom-report-text-xs-medium-muted custom-report-rich-wrap"><div class="custom-report-rich-text">${inner}</div></div>`
      );
    }
  }

  if (
    plainTextFromActivityRichField(activity.executiveSummary ?? '').length > 0
  ) {
    const inner = activityStoredValueToSanitizedHtmlForPrint(
      activity.executiveSummary
    );
    if (inner) {
      parts.push(
        `<div class="custom-report-exec-summary custom-report-rich-wrap"><div class="custom-report-rich-text">${inner}</div></div>`
      );
    }
  }

  if (plainTextFromActivityRichField(activity.significance ?? '').length > 0) {
    const inner = activityStoredValueToSanitizedHtmlForPrint(
      activity.significance
    );
    if (inner) {
      parts.push(
        `<div class="custom-report-text-xs-medium-muted custom-report-rich-wrap"><div class="custom-report-rich-text">${inner}</div></div>`
      );
    }
  }

  const plannerLead = getEventPlannerLeadName(activity);
  if (plannerLead) {
    parts.push(
      `<div class="custom-report-text-xs-medium-muted">Event planner: ${escapeHtml(plannerLead)}</div>`
    );
  }

  parts.push(`</div>`);
  return parts.join('');
}

function buildReleaseColumnHtml(activity: ActivityResponse): string {
  const commsLead = activity.commsContacts.find((c) => c.isLead);
  const commsLeadName = commsLead?.name ?? '–';

  const parts: string[] = [];
  parts.push(`<div class="custom-report-stack custom-report-stack-md">`);

  if (activity.newsReleaseOrigin) {
    parts.push(
      `<div class="custom-report-text-xs-medium-muted">${escapeHtml(activity.newsReleaseOrigin)}</div>`
    );
  }
  if (activity.commsMaterials && activity.commsMaterials.length > 0) {
    parts.push(
      `<div class="custom-report-text-xs-medium-muted">${escapeHtml(activity.commsMaterials.join(', '))}</div>`
    );
  }
  if (activity.translationsRequiredStatus) {
    parts.push(
      `<div class="custom-report-text-xs-medium-muted">${escapeHtml(activity.translationsRequiredStatus)}</div>`
    );
  }
  if (
    activity.translationsRequired &&
    activity.translationsRequired.length > 0
  ) {
    parts.push(
      `<div class="custom-report-text-xs-medium-muted">${escapeHtml(activity.translationsRequired.join(', '))}</div>`
    );
  }

  if (commsLeadName !== '–') {
    parts.push(`<div>`);
    parts.push(
      `<div class="custom-report-text-xs-medium-muted">Comms Lead</div>`
    );
    parts.push(
      `<div class="custom-report-text-sm-muted">${escapeHtml(commsLeadName)}</div>`
    );
    parts.push(`</div>`);
  }

  if (activity.lookAheadStatus && activity.lookAheadStatus !== 'none') {
    parts.push(`<div>`);
    parts.push(
      `<div class="custom-report-text-xs-medium-muted">LA Status</div>`
    );
    const isNew = activity.lookAheadStatus === 'new';
    parts.push(
      `<div class="custom-report-la-badge-wrap">${isNew ? badgeInfo('NEW') : badgeWarning('CHANGED')}</div>`
    );
    parts.push(`</div>`);
  }

  parts.push(`</div>`);
  return parts.join('');
}

function buildActivityIdColumnHtml(activity: ActivityResponse): string {
  const displayIdText = activity.displayId ?? String(activity.id);
  const parts: string[] = [];
  parts.push(`<div class="custom-report-stack custom-report-stack-md">`);

  parts.push(
    `<div class="custom-report-display-id">${escapeHtml(displayIdText)}</div>`
  );

  if (activity.activityStatus) {
    parts.push(`<div>`);
    parts.push(`<div class="custom-report-text-xs-medium-muted">Status</div>`);
    parts.push(
      `<div class="custom-report-status-badge-wrap">${badgeSecondary(activity.activityStatus)}</div>`
    );
    parts.push(`</div>`);
  }

  if (activity.dateStatus) {
    parts.push(
      `<div class="custom-report-text-xs-muted-plain">Date: ${escapeHtml(activity.dateStatus)}</div>`
    );
  }

  parts.push(`</div>`);
  return parts.join('');
}

function buildTableHeaderRowHtml(): string {
  return `<thead><tr class="custom-report-thead-row">
    <th scope="col" class="custom-report-th custom-report-col-date">Date &amp; Time</th>
    <th scope="col" class="custom-report-th custom-report-col-lead">Lead</th>
    <th scope="col" class="custom-report-th custom-report-col-details">Activity Details</th>
    <th scope="col" class="custom-report-th custom-report-col-release">Release</th>
    <th scope="col" class="custom-report-th custom-report-col-id">Activity ID</th>
  </tr></thead>`;
}

function buildActivityRowHtml(
  activity: ActivityResponse,
  zebraEven: boolean
): string {
  const zebraClass = zebraEven
    ? ' custom-report-row-even'
    : ' custom-report-row-odd';
  return `<tr class="custom-report-tr${zebraClass}">
    <td class="custom-report-td">${buildDateTimeColumnHtml(activity)}</td>
    <td class="custom-report-td">${buildLeadColumnHtml(activity)}</td>
    <td class="custom-report-td custom-report-td-break">${buildActivityDetailsColumnHtml(activity)}</td>
    <td class="custom-report-td">${buildReleaseColumnHtml(activity)}</td>
    <td class="custom-report-td">${buildActivityIdColumnHtml(activity)}</td>
  </tr>`;
}

function buildEmbeddedStyles(): string {
  return `<style>
.custom-report-root {
  font-family: BCSans, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: 0.875rem;
  line-height: 1.4;
  color: #0f172a;
  box-sizing: border-box;
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
  font-size: 0.8125rem;
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
</style>`;
}

function buildCustomReportHtmlFromResponse(data: ReportDataResponse): string {
  const title = escapeHtml(data.report.displayName);
  const showSectionHeaders = data.sections.length > 1;

  const bodyRows: string[] = [];
  let zebraToggle = false;

  for (const section of data.sections) {
    if (showSectionHeaders) {
      const label = `${section.name} (${section.activities.length})`;
      bodyRows.push(
        `<tr class="custom-report-section-row"><td colspan="5">${escapeHtml(label)}</td></tr>`
      );
    }
    for (const activity of section.activities) {
      bodyRows.push(buildActivityRowHtml(activity, zebraToggle));
      zebraToggle = !zebraToggle;
    }
  }

  const totalActivities = data.sections.reduce(
    (n, s) => n + s.activities.length,
    0
  );

  const tableInner =
    totalActivities === 0
      ? `<div class="custom-report-empty">No activities to display.</div>`
      : `<table class="custom-report-table" role="table">
          ${buildTableHeaderRowHtml()}
          <tbody>${bodyRows.join('')}</tbody>
        </table>`;

  return `<div class="custom-report-root">
    ${buildEmbeddedStyles()}
    <h1 class="custom-report-doc-title">${title}</h1>
    <div class="custom-report-table-wrap">
      ${tableInner}
    </div>
  </div>`;
}

/**
 * HTML fragment for the Custom report (`report.name === 'custom'`).
 * Matches calendar-ui {@link ReportTable} / {@link ReportRow} layout; used by print preview and PDF export.
 */
export function buildCustomReportHtml(data: unknown): string {
  if (!isReportDataResponse(data)) {
    return '<div class="p-4 text-sm text-gray-600">Invalid report data for custom report.</div>';
  }
  return buildCustomReportHtmlFromResponse(data);
}
