import { ExternalLink, Languages } from 'lucide-react';
import type { ReactNode } from 'react';

import { PrintRichText } from './PrintRichText';
import {
  type PrintReportVariant,
  type PrintRowViewModel,
  splitActivityDisplayIdForPrint,
} from './rowViewModel';

/** Corporate Look Ahead and Executive Look Ahead print layouts. */
function isLookAheadRollupVariant(variant: PrintReportVariant): boolean {
  return variant === 'lookAhead' || variant === 'execLookAhead';
}

/** Column‑3 narrative: executive summary vs title + summary. */
function narrativeIsExecutiveSummaryInline(variant: PrintReportVariant): boolean {
  return variant === 'lookAhead';
}

function NarrativeInlineFlag({ label }: { label: string }) {
  return (
    <span className="corpcal-print-flag corpcal-print-flag-narrative-inline">
      {label}
    </span>
  );
}

function ActivityIdLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <a
      className="corpcal-print-link corpcal-print-activity-link"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span>{label}</span>
      <ExternalLink
        className="corpcal-print-activity-link-icon"
        size={14}
        strokeWidth={2}
        aria-hidden
      />
    </a>
  );
}

/**
 * Four-column body row (date, activity details, release, activity id) shared across
 * Corporate Look Ahead, 30/60/90, and Executive Look Ahead. The details column
 * differs by {@link PrintReportVariant}.
 */
export function PrintRow({
  row,
  variant,
  showEventLead = false,
  omitReleaseColumn = false,
}: {
  row: PrintRowViewModel;
  variant: PrintReportVariant;
  /** When true and variant is Look Ahead, render comms lead under executive summary. */
  showEventLead?: boolean;
  /** When true, skip the Release column; Activity details uses the wider layout. */
  omitReleaseColumn?: boolean;
}) {
  return (
    <tr>
      <td className="corpcal-print-col-1">
        <DateTimeCell row={row} variant={variant} />
      </td>
      <td className="corpcal-print-col-2">
        <ActivityDetailsCell
          row={row}
          variant={variant}
          showEventLead={showEventLead}
        />
      </td>
      {!omitReleaseColumn ? (
        <td className="corpcal-print-col-3">
          <ReleaseCell row={row} variant={variant} />
        </td>
      ) : null}
      <td className="corpcal-print-col-4">
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

function ActivityDetailsCell({
  row,
  variant,
  showEventLead,
}: {
  row: PrintRowViewModel;
  variant: PrintReportVariant;
  showEventLead: boolean;
}) {
  const flags: { key: string; label: string; className: string }[] = [];
  if (row.flags.isIssue && variant !== 'lookAhead') {
    flags.push({
      key: 'issue',
      label: 'ISSUE',
      className: 'corpcal-print-flag',
    });
  }
  if (row.flags.isConfidential) {
    flags.push({
      key: 'confidential',
      label: 'CONFIDENTIAL',
      className: 'corpcal-print-flag corpcal-print-flag-alert',
    });
  }

  const venueLines: string[] = [];
  if (row.venue.city) venueLines.push(row.venue.city);
  if (row.venue.name) venueLines.push(row.venue.name);
  if (row.venue.address) venueLines.push(row.venue.address);

  const showVenuePlanner = variant !== 'lookAhead';
  const eventPlannerLeadClass = isLookAheadRollupVariant(variant)
    ? 'corpcal-print-meta-look-ahead-green'
    : 'corpcal-print-meta-faint';

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
        <>
          <div className="corpcal-print-exec-summary-inline corpcal-print-narrative-head">
            {row.flags.isIssue ? <NarrativeInlineFlag label="ISSUE" /> : null}
            {row.flags.isIssue && row.flags.isFyi ? ' ' : null}
            {row.flags.isFyi ? <NarrativeInlineFlag label="FYI" /> : null}
            {row.flags.isIssue || row.flags.isFyi ? ' ' : null}
            <PrintRichText
              value={row.executiveSummaryStored}
              className="corpcal-print-rich corpcal-print-rich-inline"
            />
          </div>
          {showEventLead && row.eventLeadStored ? (
            <div className="corpcal-print-meta-faint">
              Event lead: {row.eventLeadStored}
            </div>
          ) : null}
        </>
      ) : (
        <>
          {row.title ? (
            <div className="corpcal-print-title corpcal-print-narrative-head">
              {row.flags.isFyi ? <NarrativeInlineFlag label="FYI" /> : null}
              {row.flags.isFyi ? ' ' : null}
              {row.title}
            </div>
          ) : null}
          <PrintRichText value={row.summaryStored} />
        </>
      )}

      {showVenuePlanner && venueLines.length > 0 ? (
        <div className="corpcal-print-meta-strong">{venueLines.join(', ')}</div>
      ) : null}

      {showVenuePlanner && row.eventPlannerLead ? (
        <div className={eventPlannerLeadClass}>
          Event planner: {row.eventPlannerLead}
        </div>
      ) : null}
    </div>
  );
}

function ReleaseCell({
  row,
  variant,
}: {
  row: PrintRowViewModel;
  variant: PrintReportVariant;
}) {
  const { release } = row;
  const translationsClass = isLookAheadRollupVariant(variant)
    ? 'corpcal-print-meta-look-ahead-green'
    : 'corpcal-print-meta';
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
        <div
          className={
            isLookAheadRollupVariant(variant)
              ? 'corpcal-print-inline-row corpcal-print-translations-row'
              : 'corpcal-print-inline-row'
          }
        >
          {isLookAheadRollupVariant(variant) ? (
            <Languages
              className="corpcal-print-translations-icon"
              size={14}
              strokeWidth={2}
              aria-hidden
            />
          ) : null}
          <span className={translationsClass}>{release.translationsLine}</span>
        </div>
      ) : null}
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
  const splitId = isLookAheadRollupVariant(variant)
    ? splitActivityDisplayIdForPrint(activityLink.label)
    : null;

  return (
    <div className="corpcal-print-stack">
      <div className="corpcal-print-meta">
        {splitId ? (
          <div className="corpcal-print-activity-id-stacked">
            {splitId.acronym ? (
              <div className="corpcal-print-activity-id-acronym">
                <strong>{splitId.acronym}</strong>
              </div>
            ) : null}
            <div>
              <ActivityIdLink
                href={activityLink.href}
                label={splitId.idForLink}
              />
            </div>
          </div>
        ) : (
          <a
            className="corpcal-print-link"
            href={activityLink.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {activityLink.label}
          </a>
        )}
      </div>
      {showUpdated && lastUpdated ? (
        <div className="corpcal-print-meta-faint">Updated {lastUpdated}</div>
      ) : null}
    </div>
  );
}
