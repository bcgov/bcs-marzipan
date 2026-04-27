import { PrintRichText } from './PrintRichText';
import type { PrintReportVariant, PrintRowViewModel } from './rowViewModel';

/**
 * Four-column body row shared across Look Ahead, 30/60/90, and Exec Look Ahead
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
    </tr>
  );
}

function DateTimeCell({ row }: { row: PrintRowViewModel }) {
  const { dateTime } = row;
  const dateRange = dateTime.endDate
    ? `${dateTime.startDate} – ${dateTime.endDate}`
    : dateTime.startDate;
  return (
    <div className="corpcal-print-stack">
      {dateRange ? (
        <div className="corpcal-print-meta-strong">{dateRange}</div>
      ) : null}
      {dateTime.dateStatus ? (
        <div className="corpcal-print-meta">{dateTime.dateStatus}</div>
      ) : null}
      {dateTime.startTime ? (
        <div className="corpcal-print-meta-strong">{dateTime.startTime}</div>
      ) : null}
      {dateTime.timeStatus ? (
        <div className="corpcal-print-meta">{dateTime.timeStatus}</div>
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
  const { lead, activityLink, lastUpdated } = row;
  return (
    <div className="corpcal-print-stack">
      {lead.ministryOrTeam ? (
        <div className="corpcal-print-meta-strong">{lead.ministryOrTeam}</div>
      ) : null}
      {lead.org ? <div className="corpcal-print-meta">{lead.org}</div> : null}
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

function ActivityDetailsCell({
  row,
  variant,
}: {
  row: PrintRowViewModel;
  variant: PrintReportVariant;
}) {
  const flagPills: { key: string; label: string; className: string }[] = [];
  if (row.flags.isIssue) {
    flagPills.push({
      key: 'issue',
      label: 'Issue',
      className: 'corpcal-print-pill corpcal-print-pill-issue',
    });
  }
  if (row.flags.isConfidential) {
    flagPills.push({
      key: 'confidential',
      label: 'Confidential',
      className: 'corpcal-print-pill corpcal-print-pill-confidential',
    });
  }
  if (row.flags.isFyi) {
    flagPills.push({
      key: 'fyi',
      label: 'FYI',
      className: 'corpcal-print-pill corpcal-print-pill-fyi',
    });
  }

  const venueLines: string[] = [];
  if (row.venue.city) venueLines.push(row.venue.city);
  if (row.venue.name) venueLines.push(row.venue.name);
  if (row.venue.address) venueLines.push(row.venue.address);

  return (
    <div className="corpcal-print-stack-md">
      {flagPills.length > 0 ? (
        <div className="corpcal-print-flags">
          {flagPills.map((pill) => (
            <span key={pill.key} className={pill.className}>
              {pill.label}
            </span>
          ))}
        </div>
      ) : null}

      {row.venue.city ? (
        <div className="corpcal-print-meta-faint">{row.venue.city}</div>
      ) : null}

      {variant === 'lookAhead' ? (
        <>
          {row.title ? (
            <div className="corpcal-print-title">{row.title}</div>
          ) : null}
          <PrintRichText value={row.summaryStored} />
        </>
      ) : (
        <PrintRichText value={row.executiveSummaryStored} />
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
      {release.translationsLine ? (
        <div className="corpcal-print-meta">{release.translationsLine}</div>
      ) : null}
    </div>
  );
}
