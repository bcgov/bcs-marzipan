import type { ReactNode } from 'react';

import { PrintRichText } from './PrintRichText';
import type { PrintReportVariant, PrintRowViewModel } from './rowViewModel';

/** Column‑3 narrative: executive summary vs title + summary. */
function narrativeIsExecutiveSummaryInline(variant: PrintReportVariant): boolean {
  return variant === 'lookAhead';
}

/**
 * Five-column body row shared across Corporate Look Ahead, 30/60/90,
 * and Executive Look Ahead. Column‑3 differs by {@link PrintReportVariant}.
 */
export function PrintRow({
  row,
  variant,
}: {
  row: PrintRowViewModel;
  variant: PrintReportVariant;
}) {
  return (
    <tr>
      <td className="corpcal-print-col-1">
        <DateTimeCell row={row} variant={variant} />
      </td>
      <td className="corpcal-print-col-2">
        <LeadCell row={row} />
      </td>
      <td className="corpcal-print-col-3">
        <ActivityDetailsCell row={row} variant={variant} />
      </td>
      <td className="corpcal-print-col-4">
        <ReleaseCell row={row} />
      </td>
      <td className="corpcal-print-col-5">
        <ActivityCell row={row} variant={variant} />
      </td>
    </tr>
  );
}

function lookAheadDateTimeStatusContent(
  variant: PrintReportVariant,
  status: string
): ReactNode {
  const isLookAheadVariant =
    variant === 'lookAhead' || variant === 'execLookAhead';
  if (isLookAheadVariant && status === 'Date TBD') {
    return (
      <strong className="corpcal-print-tbd-strong">Date TBD</strong>
    );
  }
  if (isLookAheadVariant && status === 'Time TBD') {
    return (
      <strong className="corpcal-print-tbd-strong">Time TBD</strong>
    );
  }
  return status;
}

function DateTimeCell({
  row,
  variant,
}: {
  row: PrintRowViewModel;
  variant: PrintReportVariant;
}) {
  const { dateTime } = row;
  const dateRange = dateTime.endDate
    ? `${dateTime.startDate} – ${dateTime.endDate}`
    : dateTime.startDate;
  const showTimeLine = Boolean(dateTime.startTime || dateTime.timeStatus);
  const useLookAheadDtValueStyle =
    variant === 'lookAhead' || variant === 'execLookAhead';
  const valueClass = useLookAheadDtValueStyle
    ? 'corpcal-print-dt-value'
    : 'corpcal-print-meta-strong';

  return (
    <div className="corpcal-print-stack">
      {dateRange || dateTime.dateStatus ? (
        <div className="corpcal-print-inline-row corpcal-print-dt-inline-row">
          {dateRange ? (
            <span className={valueClass}>{dateRange}</span>
          ) : null}
          {dateRange && dateTime.dateStatus ? (
            <span className="corpcal-print-inline-sep" aria-hidden="true">
              ·
            </span>
          ) : null}
          {dateTime.dateStatus ? (
            <span className="corpcal-print-inline-status">
              {lookAheadDateTimeStatusContent(variant, dateTime.dateStatus)}
            </span>
          ) : null}
        </div>
      ) : null}
      {showTimeLine ? (
        <div className="corpcal-print-inline-row corpcal-print-dt-inline-row">
          {dateTime.startTime ? (
            <span className={valueClass}>{dateTime.startTime}</span>
          ) : null}
          {dateTime.startTime && dateTime.timeStatus ? (
            <span className="corpcal-print-inline-sep" aria-hidden="true">
              ·
            </span>
          ) : null}
          {dateTime.timeStatus ? (
            <span className="corpcal-print-inline-status">
              {lookAheadDateTimeStatusContent(variant, dateTime.timeStatus)}
            </span>
          ) : null}
        </div>
      ) : null}
      {dateTime.lookAheadStatus ? (
        <div>
          <span
            className={
              dateTime.lookAheadStatus === 'new'
                ? 'corpcal-print-pill corpcal-print-pill-la-new'
                : 'corpcal-print-pill corpcal-print-pill-la-changed'
            }
          >
            {dateTime.lookAheadStatus === 'new' ? 'New' : 'Changed'}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function LeadCell({ row }: { row: PrintRowViewModel }) {
  const { lead } = row;
  return (
    <div className="corpcal-print-stack">
      {lead.ministryOrTeam ? (
        <div className="corpcal-print-meta-strong">{lead.ministryOrTeam}</div>
      ) : null}
      {lead.org ? <div className="corpcal-print-meta">{lead.org}</div> : null}
    </div>
  );
}

function ActivityDetailsCell({
  row,
  variant,
}: {
  row: PrintRowViewModel;
  variant: PrintReportVariant;
}) {
  const flags: { key: string; label: string; className: string }[] = [];
  if (row.flags.isIssue) {
    flags.push({
      key: 'issue',
      label: 'ISSUE',
      className: 'corpcal-print-flag corpcal-print-flag-alert',
    });
  }
  if (row.flags.isConfidential) {
    flags.push({
      key: 'confidential',
      label: 'CONFIDENTIAL',
      className: 'corpcal-print-flag corpcal-print-flag-alert',
    });
  }
  if (row.flags.isFyi) {
    flags.push({
      key: 'fyi',
      label: 'FYI',
      className: 'corpcal-print-flag corpcal-print-flag-fyi',
    });
  }

  const venueLines: string[] = [];
  if (row.venue.city) venueLines.push(row.venue.city);
  if (row.venue.name) venueLines.push(row.venue.name);
  if (row.venue.address) venueLines.push(row.venue.address);

  const showVenuePlanner = variant !== 'lookAhead';

  return (
    <div className="corpcal-print-stack-md">
      {flags.length > 0 ? (
        <div className="corpcal-print-flags">
          {flags.map((flag) => (
            <span key={flag.key} className={flag.className}>
              {flag.label}
            </span>
          ))}
        </div>
      ) : null}

      {narrativeIsExecutiveSummaryInline(variant) ? (
        <div className="corpcal-print-exec-summary-inline">
          <PrintRichText
            value={row.executiveSummaryStored}
            className="corpcal-print-rich corpcal-print-rich-inline"
          />
        </div>
      ) : (
        <>
          {row.title ? (
            <div className="corpcal-print-title">{row.title}</div>
          ) : null}
          <PrintRichText value={row.summaryStored} />
        </>
      )}

      {showVenuePlanner && venueLines.length > 0 ? (
        <div className="corpcal-print-meta-strong">{venueLines.join(', ')}</div>
      ) : null}

      {showVenuePlanner && row.eventPlannerLead ? (
        <div className="corpcal-print-meta-faint">
          Event planner: {row.eventPlannerLead}
        </div>
      ) : null}
    </div>
  );
}

function ReleaseCell({ row }: { row: PrintRowViewModel }) {
  const { release } = row;
  if (!release.newsReleaseOrigin && !release.translationsLine) {
    return <span className="corpcal-print-meta-faint">—</span>;
  }
  return (
    <div className="corpcal-print-stack">
      {release.newsReleaseOrigin ? (
        <div className="corpcal-print-meta-strong">
          {release.newsReleaseOrigin}
        </div>
      ) : null}
      <div className="corpcal-print-inline-row">
        <span className="corpcal-print-meta">{release.translationsLine}</span>
      </div>
    </div>
  );
}

function ActivityCell({
  row,
  variant,
}: {
  row: PrintRowViewModel;
  variant: PrintReportVariant;
}) {
  const { activityLink, lastUpdated } = row;
  const showUpdated = variant !== 'lookAhead';

  return (
    <div className="corpcal-print-stack">
      <div className="corpcal-print-meta">
        <a
          className="corpcal-print-link"
          href={activityLink.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {activityLink.label}
        </a>
      </div>
      {showUpdated && lastUpdated ? (
        <div className="corpcal-print-meta-faint">Updated {lastUpdated}</div>
      ) : null}
    </div>
  );
}
