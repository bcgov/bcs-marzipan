import { ExternalLink, Languages, NotebookText } from 'lucide-react';

import { PrintRichText } from './PrintRichText';
import {
  isExecLikeRollupVariant,
  splitActivityDisplayIdForPrint,
  type ColumnFlags,
  type PrintReportVariant,
  type PrintRowViewModel,
} from './rowViewModel';

/** Corporate Look Ahead and Executive Look Ahead print layouts. */
function isLookAheadRollupVariant(variant: PrintReportVariant): boolean {
  return variant === 'lookAhead' || variant === 'execLookAhead';
}

/** Corporate Look Ahead: executive summary (flags render as badges above). */
function narrativeIsExecutiveSummaryInline(
  variant: PrintReportVariant
): boolean {
  return variant === 'lookAhead';
}

/** Exec Look Ahead and 30/60/90: title + inline summary (flags render as badges above). */
function narrativeIsExecTitleSummaryInline(
  variant: PrintReportVariant
): boolean {
  return isExecLikeRollupVariant(variant);
}

/** Confidential, Issue, and FYI badges on one line at the top of Activity details. */
function ActivityDetailBadges({ flags }: { flags: ColumnFlags }) {
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
        <span className="corpcal-print-pill corpcal-print-pill-issue">
          Issue
        </span>
      ) : null}
      {flags.isFyi ? (
        <span className="corpcal-print-pill corpcal-print-pill-fyi">FYI</span>
      ) : null}
    </div>
  );
}

function ActivityIdLink({ href, label }: { href: string; label: string }) {
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
          {variant === 'planning' ? (
            <SignificanceCell row={row} />
          ) : variant === 'thirtySixtyNinety' ? (
            <CommsStrategyCell row={row} />
          ) : (
            <ReleaseCell row={row} variant={variant} />
          )}
        </td>
      ) : null}
      <td className="corpcal-print-col-4">
        <ActivityCell row={row} variant={variant} />
      </td>
    </tr>
  );
}

/** En dash in compact date ranges; screen readers should hear "to" instead. */
const PRINT_DATE_RANGE_EN_DASH = '\u2013';

/** Gap before date/time status labels (en space; breaks independently of the value). */
const PRINT_DATE_TIME_STATUS_GAP = '\u2002';

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
  const useLookAheadDtValueStyle = isExecLikeRollupVariant(variant);
  const valueClass = useLookAheadDtValueStyle
    ? 'corpcal-print-dt-value'
    : 'corpcal-print-meta-strong';

  return (
    <div className="corpcal-print-stack">
      {dateRange || dateTime.dateStatus ? (
        <div className="corpcal-print-dt-line">
          {dateRange ? (
            <span className={valueClass} aria-label={dateRangeAriaLabel}>
              {dateRange}
            </span>
          ) : null}
          {dateTime.dateStatus ? (
            <span className="corpcal-print-inline-status">
              {dateRange ? PRINT_DATE_TIME_STATUS_GAP : null}
              {dateTime.dateStatus}
            </span>
          ) : null}
        </div>
      ) : null}
      {showTimeLine ? (
        <div className="corpcal-print-dt-line corpcal-print-dt-time-line">
          {dateTime.startTime ? (
            <span className={valueClass}>{dateTime.startTime}</span>
          ) : null}
          {dateTime.timeStatus ? (
            <span className="corpcal-print-inline-status">
              {dateTime.startTime ? PRINT_DATE_TIME_STATUS_GAP : null}
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
      {variant === 'planning' ? (
        <PlanningDateExtras row={row} />
      ) : null}
    </div>
  );
}

function PlanningDateExtras({ row }: { row: PrintRowViewModel }) {
  const { schedulingNotesStored, premierRequested } = row;
  if (!schedulingNotesStored && !premierRequested) return null;

  return (
    <div className="corpcal-print-stack-md corpcal-print-planning-date-extras">
      {schedulingNotesStored ? (
        <div className="corpcal-print-text">{schedulingNotesStored}</div>
      ) : null}
      {premierRequested ? (
        <div className="corpcal-print-meta-faint">{premierRequested}</div>
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
  const venueLines: string[] = [];
  if (row.venue.city) venueLines.push(row.venue.city);
  if (row.venue.name) venueLines.push(row.venue.name);
  if (row.venue.address) venueLines.push(row.venue.address);

  const showVenue = isExecLikeRollupVariant(variant);
  const showLastUpdatedInDetails = isExecLikeRollupVariant(variant);
  const showSignificanceInDetails =
    isExecLikeRollupVariant(variant) && variant !== 'planning';

  return (
    <div className="corpcal-print-stack-md">
      <ActivityDetailBadges flags={row.flags} />

      {narrativeIsExecutiveSummaryInline(variant) ? (
        <>
          <div className="corpcal-print-exec-summary-inline corpcal-print-narrative-head">
            <PrintRichText
              value={row.executiveSummaryStored}
              className="corpcal-print-rich corpcal-print-rich-inline"
            />
          </div>
          {showEventLead && row.commsContactLead ? (
            <div className="corpcal-print-meta-faint">
              Event lead: {row.commsContactLead}
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
          {showSignificanceInDetails ? (
            <PrintRichText value={row.significanceStored} />
          ) : null}
        </>
      ) : (
        <>
          {row.title ? (
            <div className="corpcal-print-title corpcal-print-narrative-head">
              {row.title}
            </div>
          ) : null}
          <PrintRichText value={row.summaryStored} />
        </>
      )}

      {showVenue && venueLines.length > 0 ? (
        <div className="corpcal-print-meta-strong">{venueLines.join(', ')}</div>
      ) : null}

      {showLastUpdatedInDetails && row.lastUpdated ? (
        <div className="corpcal-print-meta-faint">
          Last updated {row.lastUpdated}
        </div>
      ) : null}
    </div>
  );
}

function SignificanceCell({ row }: { row: PrintRowViewModel }) {
  if (!row.significanceStored) {
    return <span className="corpcal-print-meta-faint">—</span>;
  }

  return <PrintRichText value={row.significanceStored} />;
}

function CommsStrategyCell({ row }: { row: PrintRowViewModel }) {
  const hasCommsMaterials = row.commsMaterials.length > 0;
  const hasStrategy = Boolean(row.strategyStored);
  const translationsLine = row.release.translationsLine.trim();
  const hasTranslations =
    translationsLine.length > 0 && translationsLine !== 'none';

  if (!hasCommsMaterials && !hasStrategy && !hasTranslations) {
    return <span className="corpcal-print-meta-faint">—</span>;
  }

  return (
    <div className="corpcal-print-stack">
      {hasCommsMaterials ? (
        <div className="corpcal-print-inline-row corpcal-print-translations-row">
          <NotebookText
            className="corpcal-print-comms-materials-icon"
            size={14}
            strokeWidth={2}
            aria-hidden
          />
          <span className="corpcal-print-text">
            {row.commsMaterials.join(', ')}
          </span>
        </div>
      ) : null}
      {hasTranslations ? (
        <div className="corpcal-print-inline-row corpcal-print-translations-row">
          <Languages
            className="corpcal-print-translations-icon"
            size={14}
            strokeWidth={2}
            aria-hidden
          />
          <span className="corpcal-print-meta-look-ahead-green">
            {translationsLine}
          </span>
        </div>
      ) : null}
      {hasStrategy ? (
        <div className="corpcal-print-text">{row.strategyStored}</div>
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
  const { activityLink, lastUpdated, commsContactLead } = row;
  const showUpdated =
    variant !== 'lookAhead' &&
    variant !== 'execLookAhead' &&
    variant !== 'thirtySixtyNinety' &&
    variant !== 'planning';
  const usesSplitActivityId =
    isLookAheadRollupVariant(variant) ||
    variant === 'thirtySixtyNinety' ||
    variant === 'planning';
  const splitId = usesSplitActivityId
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
      {variant === 'thirtySixtyNinety' && commsContactLead ? (
        <div className="corpcal-print-meta-faint">{commsContactLead}</div>
      ) : null}
      {showUpdated && lastUpdated ? (
        <div className="corpcal-print-meta-faint">
          Last updated {lastUpdated}
        </div>
      ) : null}
    </div>
  );
}
