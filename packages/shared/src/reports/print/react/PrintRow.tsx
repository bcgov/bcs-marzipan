import { PrintRichText } from './PrintRichText';
import type { PrintReportVariant, PrintRowViewModel } from './rowViewModel';

/**
 * Five-column body row shared across Look Ahead, 30/60/90, and Exec Look Ahead
 * variants. Column 3 content changes per variant; all other columns match.
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
        <DateTimeCell row={row} />
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
        <ActivityCell row={row} />
      </td>
    </tr>
  );
}

function DateTimeCell({ row }: { row: PrintRowViewModel }) {
  const { dateTime } = row;
  const dateRange = dateTime.endDate
    ? `${dateTime.startDate} – ${dateTime.endDate}`
    : dateTime.startDate;
  const showTimeLine = Boolean(
    dateTime.startTime || dateTime.timeStatus
  );
  return (
    <div className="corpcal-print-stack">
      {dateRange || dateTime.dateStatus ? (
        <div className="corpcal-print-inline-row">
          {dateRange ? (
            <span className="corpcal-print-meta-strong">{dateRange}</span>
          ) : null}
          {dateTime.dateStatus ? (
            <span className="corpcal-print-inline-status">
              {dateRange ? ' · ' : null}
              {dateTime.dateStatus}
            </span>
          ) : null}
        </div>
      ) : null}
      {showTimeLine ? (
        <div className="corpcal-print-inline-row">
          {dateTime.startTime ? (
            <span className="corpcal-print-meta-strong">
              {dateTime.startTime}
            </span>
          ) : null}
          {dateTime.timeStatus ? (
            <span className="corpcal-print-inline-status">
              {dateTime.startTime ? ' · ' : null}
              {dateTime.timeStatus}
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
      className: 'corpcal-print-flag',
    });
  }

  const venueLines: string[] = [];
  if (row.venue.city) venueLines.push(row.venue.city);
  if (row.venue.name) venueLines.push(row.venue.name);
  if (row.venue.address) venueLines.push(row.venue.address);

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

      {variant === 'lookAhead' ? (
        <>
          {row.venue.city ? (
            <div className="corpcal-print-meta-faint">{row.venue.city}</div>
          ) : null}
          {row.title ? (
            <div className="corpcal-print-title">{row.title}</div>
          ) : null}
          <PrintRichText value={row.summaryStored} />
        </>
      ) : (
        <div className="corpcal-print-exec-summary-inline">
          {row.venue.city ? (
            <span className="corpcal-print-meta-faint">{row.venue.city}: </span>
          ) : null}
          <PrintRichText
            value={row.executiveSummaryStored}
            className="corpcal-print-rich corpcal-print-rich-inline"
          />
        </div>
      )}

      {venueLines.length > 0 ? (
        <div className="corpcal-print-meta">{venueLines.join(', ')}</div>
      ) : null}

      {row.eventPlannerLead ? (
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

function ActivityCell({ row }: { row: PrintRowViewModel }) {
  const { activityLink, lastUpdated } = row;
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
      {lastUpdated ? (
        <div className="corpcal-print-meta-faint">Updated {lastUpdated}</div>
      ) : null}
    </div>
  );
}
