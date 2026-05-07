import type { ReportDataResponse } from '../../../api/report-data';
import type { ActivityResponse } from '../../../schemas/activity-response.schema';
import { resolveLookAheadSectionRows } from '../../look-ahead';
import {
  dateKeyLocal,
  formatDayHeading,
  parseKeyToDate,
} from './dateFormatters';
import { buildLookAheadCoverDateRangeLine } from './lookAheadCoverDateRange';
import { PrintPageFooter } from './PrintPageFooter';
import {
  PrintGroupedSectionTable,
  type PrintGroupedSectionDayBlock,
} from './PrintSectionTable';
import { CORPCAL_PRINT_ROOT_CLASS } from './printStyles';
import {
  compareActivitiesForPrint,
  toPrintRowViewModel,
  type PrintReportVariant,
  type PrintRowViewModel,
} from './rowViewModel';

interface SortedSection {
  id: string;
  /** Short name from API; prefer {@link printHeadingLabel} for PDF section title. */
  name: string;
  /** Legend/cover long title when report config is present. */
  printHeadingLabel: string;
  legendColor: string | null;
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
  const legendColorById = new Map<string, string | null>();
  const printHeadingById = new Map<string, string>();
  if (data.report?.config) {
    for (const row of resolveLookAheadSectionRows(data.report.config)) {
      legendColorById.set(row.sectionId, row.legendColor);
      printHeadingById.set(row.sectionId, row.reportLegendLabel);
    }
  }
  return [...data.sections]
    .sort((a, b) => a.order - b.order)
    .map((section) => ({
      id: section.id,
      name: section.name,
      printHeadingLabel:
        printHeadingById.get(section.id) ?? section.name,
      legendColor: legendColorById.get(section.id) ?? null,
      activitiesByKey: indexActivitiesByDay(section.activities),
    }));
}

function sortedDateKeysForSection(section: SortedSection): string[] {
  return [...section.activitiesByKey.keys()].sort();
}

function reportHasAnyActivities(sections: SortedSection[]): boolean {
  for (const section of sections) {
    if (section.activitiesByKey.size > 0) return true;
  }
  return false;
}

/**
 * Top-level print document. Drives the shell (header, banner, contents, footer)
 * and walks sections in report order, then days within each section, delegating
 * row rendering to {@link PrintGroupedSectionTable} / {@link PrintRow}.
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
  const hasAny = reportHasAnyActivities(sections);
  const coverRange = buildLookAheadCoverDateRangeLine(data);

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

      <div className="corpcal-print-body">
        {!hasAny ? (
          <div className="corpcal-print-empty">
            No activities in the selected range.
          </div>
        ) : (
          sections.map((section) => (
            <SectionGroup
              key={section.id}
              section={section}
              variant={variant}
              activityBaseUrl={activityBaseUrl}
            />
          ))
        )}
      </div>

      <PrintPageFooter generatedAt={generatedAt} />
    </div>
  );
}

function SectionGroup({
  section,
  variant,
  activityBaseUrl,
}: {
  section: SortedSection;
  variant: PrintReportVariant;
  activityBaseUrl: string;
}) {
  const dateKeys = sortedDateKeysForSection(section);
  if (dateKeys.length === 0) return null;

  const dayBlocks: PrintGroupedSectionDayBlock[] = dateKeys.map((dayKey) => {
    const dayDate = parseKeyToDate(dayKey);
    const activities = section.activitiesByKey.get(dayKey) ?? [];
    const rows: PrintRowViewModel[] = activities.map((a) =>
      toPrintRowViewModel(a, { activityBaseUrl })
    );
    return {
      dayKey,
      dayHeading: formatDayHeading(dayDate),
      rows,
    };
  });

  return (
    <section className="corpcal-print-section-block">
      <PrintGroupedSectionTable
        sectionPrintLabel={section.printHeadingLabel}
        sectionLegendColor={section.legendColor}
        days={dayBlocks}
        variant={variant}
      />
    </section>
  );
}
