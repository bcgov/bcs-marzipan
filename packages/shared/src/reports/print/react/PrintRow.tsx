import { ExternalLink, Languages } from 'lucide-react';
import type { ReactNode } from 'react';

import { PrintRichText } from './PrintRichText';
import {
  type ColumnFlags,
  type PrintReportVariant,
  type PrintRowViewModel,
  splitActivityDisplayIdForPrint,
} from './rowViewModel';

/** Corporate Look Ahead and Executive Look Ahead print layouts. */
function isLookAheadRollupVariant(variant: PrintReportVariant): boolean {
  return variant === 'lookAhead' || variant === 'execLookAhead';
}

/** Corporate Look Ahead: executive summary (flags render as badges above). */
function narrativeIsExecutiveSummaryInline(variant: PrintReportVariant): boolean {
  return variant === 'lookAhead';
}

/** Exec Look Ahead: title + inline summary (flags render as badges above). */
function narrativeIsExecTitleSummaryInline(variant: PrintReportVariant): boolean {
  return variant === 'execLookAhead';
}

/** Confidential, Issue, and FYI badges on one line at the top of Activity details. */
function LookAheadActivityBadges({ flags }: { flags: ColumnFlags }) {
  if (!flags.isConfidential && !flags.isIssue && !flags.isFyi) {
    return null;
  }

  return (
    <div className="corpcal-print-flags">
      {flags.isConfidential ? (
        <span className="corpcal-print-pill corpcal-print-pill-confidential">
          Confidential
        </span>
      ) : null}
      {flags.isIssue ? (
        <span className="corpcal-print-pill corpcal-print-pill-issue">Issue</span>
      ) : null}
      {flags.isFyi ? (
        <span className="corpcal-print-pill corpcal-print-pill-fyi">FYI</span>
      ) : null}
    </div>
  );
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
  highlightActivityIds,
}: {
  row: PrintRowViewModel;
  variant: PrintReportVariant;
  /** When true and variant is Look Ahead, render comms lead under executive summary. */
  showEventLead?: boolean;
  /** When true, skip the Release column; Activity details uses the wider layout. */
  omitReleaseColumn?: boolean;
  /**
   * In-app preview: flash rows after remote activity updates (`live-row-highlight` CSS in shell).
   */
  highlightActivityIds?: ReadonlySet<number>;
}) {
  const highlighted = highlightActivityIds?.has(row.activityId) ?? false;

  return (
    <tr className={highlighted ? 'live-row-highlight' : undefined}>
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

/** En dash in compact date ranges; screen readers should hear "to" instead. */
const PRINT_DATE_RANGE_EN_DASH = '\u2013';

function printDateRangeAriaLabel(display: string): string {
  return display.replaceAll(PRINT_DATE_RANGE_EN_DASH, ' to ');
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
    ? `${dateTime.startDate} ${PRINT_DATE_RANGE_EN_DASH} ${dateTime.endDate}`
    : dateTime.startDate;
  const dateRangeAriaLabel = dateRange.includes(PRINT_DATE_RANGE_EN_DASH)
    ? printDateRangeAriaLabel(dateRange)
    : undefined;
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
            <span className={valueClass} aria-label={dateRangeAriaLabel}>
              {dateRange}
            </span>
          ) : null}
          {dateTime.dateStatus ? (
            <>
              {dateRange ? (
                <span className="corpcal-print-inline-sep" aria-hidden>
                  ·
                </span>
              ) : null}
              <span className="corpcal-print-inline-status">
                {lookAheadDateTimeStatusContent(variant, dateTime.dateStatus)}
              </span>
            </>
          ) : null}
        </div>
      ) : null}
      {showTimeLine ? (
        <div className="corpcal-print-inline-row corpcal-print-dt-inline-row">
          {dateTime.startTime ? (
            <span className={valueClass}>{dateTime.startTime}</span>
          ) : null}
          {dateTime.timeStatus ? (
            <>
              {dateTime.startTime ? (
                <span className="corpcal-print-inline-sep" aria-hidden>
                  ·
                </span>
              ) : null}
              <span className="corpcal-print-inline-status">
                {lookAheadDateTimeStatusContent(variant, dateTime.timeStatus)}
              </span>
            </>
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
  const useLookAheadBadges = isLookAheadRollupVariant(variant);
  const legacyFlags: { key: string; label: string; className: string }[] = [];
  if (!useLookAheadBadges && row.flags.isIssue) {
    legacyFlags.push({
      key: 'issue',
      label: 'ISSUE',
      className: 'corpcal-print-flag',
    });
  }
  if (!useLookAheadBadges && row.flags.isConfidential) {
    legacyFlags.push({
      key: 'confidential',
      label: 'CONFIDENTIAL',
      className: 'corpcal-print-flag corpcal-print-flag-alert',
    });
  }

  const venueLines: string[] = [];
  if (row.venue.city) venueLines.push(row.venue.city);
  if (row.venue.name) venueLines.push(row.venue.name);
  if (row.venue.address) venueLines.push(row.venue.address);

  const showVenue =
    variant === 'execLookAhead' || variant === 'thirtySixtyNinety';
  const showEventPlanner = variant === 'thirtySixtyNinety';
  const showLastUpdatedInDetails = variant === 'execLookAhead';
  const eventPlannerLeadClass = isLookAheadRollupVariant(variant)
    ? 'corpcal-print-meta-look-ahead-green'
    : 'corpcal-print-meta-faint';

  return (
    <div className="corpcal-print-stack-md">
      {useLookAheadBadges ? <LookAheadActivityBadges flags={row.flags} /> : null}

      {legacyFlags.length > 0 ? (
        <div className="corpcal-print-flags">
          {legacyFlags.map((flag) => (
            <span key={flag.key} className={flag.className}>
              {flag.label}
            </span>
          ))}
        </div>
      ) : null}

      {narrativeIsExecutiveSummaryInline(variant) ? (
        <>
          <div className="corpcal-print-exec-summary-inline corpcal-print-narrative-head">
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
      ) : narrativeIsExecTitleSummaryInline(variant) ? (
        <>
          <div className="corpcal-print-exec-summary-inline corpcal-print-narrative-head">
            {row.title ? <strong>{row.title}</strong> : null}
            {row.title && row.summaryStored ? ' ' : null}
            <PrintRichText
              value={row.summaryStored}
              className="corpcal-print-rich corpcal-print-rich-inline"
            />
          </div>
          <PrintRichText value={row.significanceStored} />
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

      {showVenue && venueLines.length > 0 ? (
        <div className="corpcal-print-meta-strong">{venueLines.join(', ')}</div>
      ) : null}

      {showEventPlanner && row.eventPlannerLead ? (
        <div className={eventPlannerLeadClass}>
          Event planner: {row.eventPlannerLead}
        </div>
      ) : null}

      {showLastUpdatedInDetails && row.lastUpdated ? (
        <div className="corpcal-print-meta-faint">
          Last updated {row.lastUpdated}
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
  const showUpdated =
    variant !== 'lookAhead' && variant !== 'execLookAhead';
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
        <div className="corpcal-print-meta-faint">
          Last updated {lastUpdated}
        </div>
      ) : null}
    </div>
  );
}
