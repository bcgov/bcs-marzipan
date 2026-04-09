import type { ActivityResponse } from '@corpcal/shared/api/types';
import type { ReportDataResponse } from '@/api/reportsApi';

const LA_NS = 'la-legacy';

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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

/** Calendar day key YYYY-MM-DD in local timezone */
function dateKeyLocal(isoDate: string | null): string | null {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatWeekdayMonthDayYear(d: Date): string {
  return d
    .toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    .toUpperCase();
}

/** e.g. Friday, Apr. 3, 2026 (legacy cover style) */
function formatCoverDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Table body cell: Tue Apr 7 */
function formatShortRowDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTimeAmPm(
  isoDate: string | null,
  timeStr: string | null
): string {
  if (timeStr) {
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
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${minuteStr} ${ampm}`;
  }
  if (isoDate) {
    const d = new Date(isoDate);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
  }
  return '—';
}

function formatVenueLocation(activity: ActivityResponse): string {
  const v = activity.venueAddress;
  if (!v) return '';
  const parts: string[] = [];
  if (v.venueName) parts.push(v.venueName);
  if (v.city) parts.push(v.city);
  if (v.provinceOrState) parts.push(v.provinceOrState);
  return parts.join(', ');
}

function laStatusLabel(status: string | null | undefined): string {
  if (!status || status === 'none') return '';
  return status === 'new' ? 'NEW' : 'CHANGED';
}

function compareTimeThenTitle(
  a: ActivityResponse,
  b: ActivityResponse
): number {
  const ta = a.startTime ?? '';
  const tb = b.startTime ?? '';
  if (ta !== tb) return ta.localeCompare(tb);
  return (a.title ?? '').localeCompare(b.title ?? '');
}

interface SectionSlice {
  id: string;
  name: string;
  order: number;
  activities: ActivityResponse[];
}

function collectDateRangeKeys(sections: SectionSlice[]): string[] {
  const keys = new Set<string>();
  for (const s of sections) {
    for (const a of s.activities) {
      const k = dateKeyLocal(a.startDate);
      if (k) keys.add(k);
    }
  }
  return [...keys].sort();
}

function parseKeyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function buildLookAheadLegacyStyles(): string {
  return `
.${LA_NS} { font-family: Arial, Helvetica, sans-serif; font-size: 11px; line-height: 1.35; color: #000; background: #fff; box-sizing: border-box; }
.${LA_NS} *, .${LA_NS} *::before, .${LA_NS} *::after { box-sizing: border-box; }
.${LA_NS}-header {
  background: #002452;
  color: #fff;
  padding: 16px 20px 14px;
  position: relative;
  border-bottom: 3px solid #001a3d;
}
.${LA_NS}-header-title { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.04em; }
.${LA_NS}-header-sub { margin: 8px 0 0; font-size: 13px; font-weight: 400; opacity: 0.95; }
.${LA_NS}-header-range { margin: 10px 0 0; font-size: 12px; font-weight: 400; }
.${LA_NS}-confidential {
  position: absolute;
  top: 16px;
  right: 20px;
  font-size: 11px;
  font-weight: 700;
  color: #ffb4b4;
  letter-spacing: 0.06em;
}
.${LA_NS}-draft-banner {
  background: #fff8e1;
  border-bottom: 1px solid #e0c766;
  padding: 8px 20px;
  font-size: 10px;
  font-weight: 700;
  color: #5c4a00;
}
.${LA_NS}-draft-sub { font-weight: 400; color: #6a5a10; margin-top: 2px; display: block; }
.${LA_NS}-contents { padding: 12px 20px 8px; font-size: 10px; color: #333; }
.${LA_NS}-contents-title { font-weight: 700; margin-bottom: 4px; }
.${LA_NS}-contents ul { margin: 0; padding-left: 18px; }
.${LA_NS}-body { padding: 0 20px 24px; }
.${LA_NS}-date-heading {
  margin: 10px 0 0;
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  align-items: center;
  justify-content: center;
  display: flex;
  color: #384c73;
}
.${LA_NS}-subsection {
  padding: 5px 8px 5px 0px;
  border-bottom: none;
  font-size: 11px;
  font-weight: 700;
  color: #384c73;
}
.${LA_NS}-table-wrap { overflow-x: auto; border: 1px solid #999; margin-bottom: 4px; }
.${LA_NS}-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 10px;
}
.${LA_NS}-table th {
  text-align: left;
  padding: 5px 6px;
  background: #000000;
  border: 1px solid #999;
  font-weight: 700;
  font-size: 10px;
  color: #ffffff;
}
.${LA_NS}-table td {
  vertical-align: top;
  padding: 8px 6px;
  font-size: 11px;
  border: 1px solid #999;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: normal;
}
.${LA_NS}-table tbody tr:nth-child(even) { background: #fff; }
.${LA_NS}-table tbody tr:nth-child(odd) { background: #f7f7f7; }
.${LA_NS}-col1 { width: 16%; }
.${LA_NS}-col2 { width: 10%; }
.${LA_NS}-col3 { width: 58%; }
.${LA_NS}-col4 { width: 16%; }
.${LA_NS}-meta-strong { font-weight: 700; font-size: 11px; display: block; margin-bottom: 2px; }
.${LA_NS}-meta { font-size: 10px; color: #222; }
.${LA_NS}-title { font-weight: 700; font-size: 11px; margin-bottom: 4px; line-height: 1.3; }
.${LA_NS}-detail { font-size: 10px; margin-top: 4px; color: #222; }
.${LA_NS}-exec-label {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #444;
  margin-top: 8px;
  margin-bottom: 2px;
  border-top: 1px solid #ccc;
  padding-top: 6px;
}
.${LA_NS}-exec { font-size: 10px; color: #333; }
.${LA_NS}-pill {
  display: inline-block;
  font-size: 9px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 2px;
  margin: 2px 4px 0 0;
  border: 1px solid #999;
  background: #f5f5f5;
}
.${LA_NS}-pill-premier { background: #fff3cd; border-color: #c9a227; color: #664d03; }
.${LA_NS}-pill-new { background: #dbeafe; border-color: #2563eb; color: #1e3a8a; }
.${LA_NS}-pill-changed { background: #ffedd5; border-color: #ea580c; color: #9a3412; }
.${LA_NS}-no-act {
  padding: 10px 12px;
  border: 1px solid #999;
  background: #fafafa;
  font-size: 11px;
  font-style: italic;
  color: #444;
}
.${LA_NS}-footer {
  margin-top: 16px;
  padding: 8px 20px 16px;
  font-size: 9px;
  color: #555;
  border-top: 1px solid #ccc;
}
.${LA_NS}-footer-conf { font-weight: 700; color: #8b0000; margin-bottom: 4px; }
`;
}

function supportingLine(activity: ActivityResponse): string {
  const parts: string[] = [];
  if (activity.leadOrg) parts.push(activity.leadOrg);
  if (activity.representativesAttending?.length) {
    parts.push(activity.representativesAttending.join(', '));
  }
  return parts.join(' · ');
}

function buildRowCells(activity: ActivityResponse): string {
  const start = activity.startDate ? new Date(activity.startDate) : null;
  const dateBold =
    start && !Number.isNaN(start.getTime()) ? formatShortRowDate(start) : '—';
  const timeLine = formatTimeAmPm(activity.startDate, activity.startTime);
  const location = formatVenueLocation(activity);
  const la = laStatusLabel(activity.lookAheadStatus);

  const col1: string[] = [
    `<span class="${LA_NS}-meta-strong">${escapeHtml(dateBold)}</span>`,
    `<span class="${LA_NS}-meta">${escapeHtml(timeLine)}</span>`,
  ];
  if (location) {
    col1.push(
      `<span class="${LA_NS}-meta" style="display:block;margin-top:3px;">${escapeHtml(location)}</span>`
    );
  }
  if (activity.premierRequested) {
    col1.push(
      `<span class="${LA_NS}-pill ${LA_NS}-pill-premier">Premier requested</span>`
    );
  }
  if (activity.tags.length > 0) {
    const tags = activity.tags
      .map((t) => `<span class="${LA_NS}-pill">${escapeHtml(t.text)}</span>`)
      .join('');
    col1.push(`<div style="margin-top:4px;">${tags}</div>`);
  }
  if (la) {
    const cls =
      la === 'NEW'
        ? `${LA_NS}-pill ${LA_NS}-pill-new`
        : `${LA_NS}-pill ${LA_NS}-pill-changed`;
    col1.push(
      `<div style="margin-top:4px;"><span class="${cls}">${escapeHtml(la)}</span></div>`
    );
  }

  const ministry =
    activity.leadMinistryAbbreviation ?? activity.leadMinistry ?? '—';
  const col2: string[] = [
    `<span class="${LA_NS}-meta-strong">${escapeHtml(ministry)}</span>`,
  ];
  const support = supportingLine(activity);
  if (support) {
    col2.push(
      `<span class="${LA_NS}-meta" style="display:block;margin-top:4px;">${escapeHtml(support)}</span>`
    );
  }

  const col3: string[] = [
    `<div class="${LA_NS}-title">${escapeHtml(activity.title ?? '')}</div>`,
  ];
  if (activity.summary) {
    col3.push(
      `<div class="${LA_NS}-detail">${escapeHtml(activity.summary)}</div>`
    );
  }
  // if (activity.executiveSummary) {
  //   col3.push(
  //     `<div class="${LA_NS}-exec-label">Executive summary</div>`,
  //     `<div class="${LA_NS}-exec">${escapeHtml(activity.executiveSummary)}</div>`
  //   );
  // }

  const commsLead = activity.commsContacts.find((c) => c.isLead);
  const col4: string[] = [];
  if (commsLead?.name) {
    col4.push(
      `<span class="${LA_NS}-meta-strong">Comms</span>`,
      `<span class="${LA_NS}-meta">${escapeHtml(commsLead.name)}</span>`
    );
  }
  if (activity.newsReleaseOrigin) {
    col4.push(
      `<span class="${LA_NS}-meta" style="display:block;margin-top:4px;">${escapeHtml(activity.newsReleaseOrigin)}</span>`
    );
  }
  if (activity.displayId) {
    col4.push(
      `<span class="${LA_NS}-meta" style="display:block;margin-top:4px;font-weight:700;">${escapeHtml(activity.displayId)}</span>`
    );
  }
  if (activity.activityStatus) {
    col4.push(
      `<span class="${LA_NS}-meta" style="display:block;margin-top:3px;">${escapeHtml(activity.activityStatus)}</span>`
    );
  }
  if (activity.dateStatus) {
    col4.push(
      `<span class="${LA_NS}-meta" style="display:block;margin-top:2px;">Date: ${escapeHtml(activity.dateStatus)}</span>`
    );
  }

  return `<tr>
<td class="${LA_NS}-col1">${col1.join('')}</td>
<td class="${LA_NS}-col2">${col2.join('')}</td>
<td class="${LA_NS}-col3">${col3.join('')}</td>
<td class="${LA_NS}-col4">${col4.join('')}</td>
</tr>`;
}

/**
 * Legacy print-style HTML for the Look Ahead report (PDF-aligned layout).
 * Consumes the same payload as {@link fetchReportData} / Reports page preview.
 */
export function buildLookAheadLegacyPrintHtml(data: unknown): string {
  if (!isReportDataResponse(data)) {
    return `<div data-report-template="LOOK_AHEAD" class="${LA_NS}"><p style="padding:12px;color:#666;">No report data loaded.</p></div>`;
  }

  const sections: SectionSlice[] = [...data.sections]
    .sort((a, b) => a.order - b.order)
    .map((s) => ({
      id: s.id,
      name: s.name,
      order: s.order,
      activities: [...s.activities].sort(compareTimeThenTitle),
    }));

  const dateKeys = collectDateRangeKeys(sections);
  let rangeLine = '';
  if (dateKeys.length > 0) {
    const startD = parseKeyToDate(dateKeys[0]);
    const endD = parseKeyToDate(dateKeys[dateKeys.length - 1]);
    rangeLine = `${formatCoverDate(startD)} to ${formatCoverDate(endD)}`;
  }

  const contentsItems = sections
    .map((s) => `<li>${escapeHtml(s.name)}</li>`)
    .join('');

  const bodyParts: string[] = [];

  if (dateKeys.length === 0) {
    bodyParts.push(
      `<div class="${LA_NS}-no-act">No activities in the selected range.</div>`
    );
  } else {
    for (const key of dateKeys) {
      const dayDate = parseKeyToDate(key);
      const heading = formatWeekdayMonthDayYear(dayDate);
      let anyOnDay = false;
      for (const s of sections) {
        const onDay = s.activities.filter(
          (a) => dateKeyLocal(a.startDate) === key
        );
        if (onDay.length > 0) anyOnDay = true;
      }

      bodyParts.push(
        `<h2 class="${LA_NS}-date-heading">${escapeHtml(heading)}</h2>`
      );

      if (!anyOnDay) {
        const polite = dayDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
        bodyParts.push(
          `<div class="${LA_NS}-no-act">No Activities for ${escapeHtml(polite)}</div>`
        );
        continue;
      }

      for (const s of sections) {
        const onDay = s.activities.filter(
          (a) => dateKeyLocal(a.startDate) === key
        );
        if (onDay.length === 0) continue;

        bodyParts.push(
          `<div class="${LA_NS}-subsection">${escapeHtml(s.name)}</div>`,
          `<div class="${LA_NS}-table-wrap"><table class="${LA_NS}-table" role="grid">
<thead><tr>
<th class="${LA_NS}-col1" scope="col">Time / Meta</th>
<th class="${LA_NS}-col2" scope="col">Lead</th>
<th class="${LA_NS}-col3" scope="col">Activity / Details</th>
<th class="${LA_NS}-col4" scope="col">Comms / ID</th>
</tr></thead>
<tbody>${onDay.map((a) => buildRowCells(a)).join('')}</tbody>
</table></div>`
        );
      }
    }
  }

  const generated = new Date().toLocaleString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const styles = buildLookAheadLegacyStyles();

  return `<div data-report-template="LOOK_AHEAD" class="${LA_NS}">
<style type="text/css">${styles}</style>
<div class="${LA_NS}-header">
<div class="${LA_NS}-confidential">DRAFT AND CONFIDENTIAL</div>
${rangeLine ? `<p class="${LA_NS}-header-range">${escapeHtml(rangeLine)}</p>` : ''}
</div>
<div class="${LA_NS}-draft-banner">DRAFT ONLY — NOT FOR CIRCULATION<span class="${LA_NS}-draft-sub">Information is confidential and subject to change</span></div>
<div class="${LA_NS}-contents"><div class="${LA_NS}-contents-title">Contents:</div><ul>${contentsItems}</ul></div>
<div class="${LA_NS}-body">${bodyParts.join('\n')}</div>
<div class="${LA_NS}-footer">
<div class="${LA_NS}-footer-conf">DRAFT AND CONFIDENTIAL</div>
<div>Report generated ${escapeHtml(generated)}. &quot;CHANGED&quot; applies to major detail or date changes only (not time switches).</div>
</div>
</div>`;
}
