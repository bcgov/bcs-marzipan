import type { ReportDataResponse } from '../../../api/report-data';
import type { ActivityResponse } from '../../../schemas/activity-response.schema';
import {
  dateKeyLocal,
  formatCoverDate,
  formatDayHeading,
  formatGeneratedAt,
  parseKeyToDate,
} from './dateFormatters';
import { PrintSectionTable } from './PrintSectionTable';
import { CORPCAL_PRINT_ROOT_CLASS } from './printStyles';
import {
  compareActivitiesForPrint,
  toPrintRowViewModel,
  type PrintReportVariant,
  type PrintRowViewModel,
} from './rowViewModel';

interface SortedSection {
  id: string;
  name: string;
  activitiesByKey: Map<string, ActivityResponse[]>;
}

function indexActivitiesByDay(
  activities: ActivityResponse[]
): Map<string, ActivityResponse[]> {
  const sorted = [...activities].sort(compareActivitiesForPrint);
  const byKey = new Map<string, ActivityResponse[]>();
  for (const activity of sorted) {
    const key = dateKeyLocal(activity.startDate);
    if (!key) continue;
    const bucket = byKey.get(key);
    if (bucket) {
      bucket.push(activity);
    } else {
      byKey.set(key, [activity]);
    }
  }
  return byKey;
}

function collectSortedSections(data: ReportDataResponse): SortedSection[] {
  return [...data.sections]
    .sort((a, b) => a.order - b.order)
    .map((section) => ({
      id: section.id,
      name: section.name,
      activitiesByKey: indexActivitiesByDay(section.activities),
    }));
}

function collectDateKeys(sections: SortedSection[]): string[] {
  const keys = new Set<string>();
  for (const section of sections) {
    for (const key of section.activitiesByKey.keys()) {
      keys.add(key);
    }
  }
  return [...keys].sort();
}

/**
 * Top-level print document. Drives the shell (header, banner, contents, footer)
 * and walks sections grouped by day, delegating row rendering to
 * {@link PrintSectionTable} / {@link PrintRow}.
 */
export function PrintReportDocument({
  data,
  variant,
  activityBaseUrl,
  generatedAt,
}: {
  data: ReportDataResponse;
  variant: PrintReportVariant;
  activityBaseUrl: string;
  /** Injected for deterministic output in tests and SSR cache parity. */
  generatedAt: Date;
}) {
  const sections = collectSortedSections(data);
  const dateKeys = collectDateKeys(sections);
  const hasAny = dateKeys.length > 0;
  const coverRange = hasAny
    ? `${formatCoverDate(parseKeyToDate(dateKeys[0]))} to ${formatCoverDate(
        parseKeyToDate(dateKeys[dateKeys.length - 1])
      )}`
    : '';

  const reportName = data.report?.displayName ?? 'Report';

  return (
    <div
      className={CORPCAL_PRINT_ROOT_CLASS}
      data-report-template={
        variant === 'exec' ? 'EXEC_LOOK_AHEAD' : 'LOOK_AHEAD'
      }
    >
      <header className="corpcal-print-header">
        <span className="corpcal-print-header-confidential">
          DRAFT AND CONFIDENTIAL
        </span>
        <h1 className="corpcal-print-header-title">{reportName}</h1>
        {coverRange ? (
          <p className="corpcal-print-header-range">{coverRange}</p>
        ) : null}
      </header>

      <div className="corpcal-print-banner">
        DRAFT ONLY — NOT FOR CIRCULATION
        <span className="corpcal-print-banner-sub">
          Information is confidential and subject to change.
        </span>
      </div>

      <div className="corpcal-print-contents">
        <div className="corpcal-print-contents-title">Contents:</div>
        <ul>
          {sections.map((section) => (
            <li key={section.id}>{section.name}</li>
          ))}
        </ul>
      </div>

      <div className="corpcal-print-body">
        {!hasAny ? (
          <div className="corpcal-print-empty">
            No activities in the selected range.
          </div>
        ) : (
          dateKeys.map((key) => (
            <DayGroup
              key={key}
              dayKey={key}
              sections={sections}
              variant={variant}
              activityBaseUrl={activityBaseUrl}
            />
          ))
        )}
      </div>

      <footer className="corpcal-print-footer">
        <div className="corpcal-print-footer-confidential">
          DRAFT AND CONFIDENTIAL
        </div>
        <div>
          Report generated {formatGeneratedAt(generatedAt)}.
          &ldquo;Changed&rdquo; applies to major detail or date changes only
          (not time switches).
        </div>
      </footer>
    </div>
  );
}

function DayGroup({
  dayKey,
  sections,
  variant,
  activityBaseUrl,
}: {
  dayKey: string;
  sections: SortedSection[];
  variant: PrintReportVariant;
  activityBaseUrl: string;
}) {
  const dayDate = parseKeyToDate(dayKey);

  const populatedSections = sections
    .map((section) => {
      const activities = section.activitiesByKey.get(dayKey) ?? [];
      if (activities.length === 0) return null;
      const rows: PrintRowViewModel[] = activities.map((a) =>
        toPrintRowViewModel(a, { activityBaseUrl })
      );
      return { id: section.id, name: section.name, rows };
    })
    .filter(
      (
        section
      ): section is { id: string; name: string; rows: PrintRowViewModel[] } =>
        section !== null
    );

  return (
    <section className="corpcal-print-day">
      <h2 className="corpcal-print-day-heading">{formatDayHeading(dayDate)}</h2>
      {populatedSections.length === 0 ? (
        <div className="corpcal-print-empty">
          No Activities for {formatDayHeading(dayDate)}
        </div>
      ) : (
        populatedSections.map((section) => (
          <PrintSectionTable
            key={section.id}
            sectionName={section.name}
            rows={section.rows}
            variant={variant}
          />
        ))
      )}
    </section>
  );
}
