import type { ReportDataResponse } from '../../../api/report-data';
import type { ActivityResponse } from '../../../schemas/activity-response.schema';
import { resolveLookAheadSectionRows } from '../../look-ahead';
import {
  effectiveReportFieldsIncludeEventLead,
  getEffectiveReportFields,
} from '../../reportTypeConfig';
import { dateKeyLocal, formatDayHeading } from './dateFormatters';
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
import type { TranslationLanguageLabelResolver } from './translationLanguageDisplayLabels';

interface SortedSection {
  id: string;
  /** Short name from API; prefer {@link printHeadingLabel} for PDF section title. */
  name: string;
  /** Legend/cover long title when report config is present. */
  printHeadingLabel: string;
  legendColor: string | null;
  /**
   * When true, the rollup table renders a calendar-date row and a cloned column
   * header band above each day. When false, days flow in one tbody and a shared
   * column header row lives in `thead` so it repeats on each printed page with
   * the section title. Resolved from `printPerDayColumnHeaderRepeat` in
   * `ReportConfig` (default false when omitted).
   */
  showPerDayPrintChrome: boolean;
  /** When true, print omits the Release column for this section. */
  omitReleaseColumn: boolean;
  activitiesByKey: Map<string, ActivityResponse[]>;
}

/**
 * Default for sections that don't set `printPerDayColumnHeaderRepeat`. Per-day
 * chrome is opt-in via the section config; sections without an explicit value
 * render as continuous activity rows.
 */
const DEFAULT_SHOW_PER_DAY_PRINT_CHROME = false;

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
  const showPerDayChromeById = new Map<string, boolean>();
  const omitReleaseColumnById = new Map<string, boolean>();
  if (data.report?.config) {
    for (const row of resolveLookAheadSectionRows(data.report.config)) {
      legendColorById.set(row.sectionId, row.legendColor);
      printHeadingById.set(row.sectionId, row.reportLegendLabel);
      showPerDayChromeById.set(
        row.sectionId,
        row.printPerDayColumnHeaderRepeat ?? DEFAULT_SHOW_PER_DAY_PRINT_CHROME
      );
      omitReleaseColumnById.set(
        row.sectionId,
        row.printOmitReleaseColumn === true
      );
    }
  }
  return [...data.sections]
    .sort((a, b) => a.order - b.order)
    .map((section) => ({
      id: section.id,
      name: section.name,
      printHeadingLabel: printHeadingById.get(section.id) ?? section.name,
      legendColor: legendColorById.get(section.id) ?? null,
      showPerDayPrintChrome:
        showPerDayChromeById.get(section.id) ??
        DEFAULT_SHOW_PER_DAY_PRINT_CHROME,
      omitReleaseColumn: omitReleaseColumnById.get(section.id) ?? false,
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
 * Top-level print document. Drives the shell (header, banner, contents)
 * and walks sections in report order, then days within each section, delegating
 * row rendering to {@link PrintGroupedSectionTable} / {@link PrintRow}.
 */
export function PrintReportDocument({
  data,
  variant,
  activityBaseUrl,
  highlightActivityIds,
  resolveTranslationLanguageLabel,
}: {
  data: ReportDataResponse;
  variant: PrintReportVariant;
  activityBaseUrl: string;
  /** In-app preview: flash rows briefly after remote activity updates. */
  highlightActivityIds?: ReadonlySet<number>;
  resolveTranslationLanguageLabel?: TranslationLanguageLabelResolver;
}) {
  const sections = collectSortedSections(data);
  const hasAny = reportHasAnyActivities(sections);
  const effectiveFields = getEffectiveReportFields(data.report);
  const showEventLead = effectiveReportFieldsIncludeEventLead(effectiveFields);

  return (
    <div
      className={CORPCAL_PRINT_ROOT_CLASS}
      data-report-template={
        variant === 'execLookAhead'
          ? 'EXEC_LOOK_AHEAD'
          : variant === 'thirtySixtyNinety'
            ? 'THIRTY_SIXTY_NINETY'
            : variant === 'planning'
              ? 'PLANNING'
              : 'LOOK_AHEAD'
      }
    >
      <div className="corpcal-print-body">
        {variant === 'thirtySixtyNinety' && hasAny ? (
          <PrintPdfFirstPageTitle title="30/60/90 Report" />
        ) : null}
        {variant === 'planning' && hasAny ? (
          <PrintPdfFirstPageTitle title="Planning Report" />
        ) : null}
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
              showEventLead={showEventLead}
              highlightActivityIds={highlightActivityIds}
              resolveTranslationLanguageLabel={resolveTranslationLanguageLabel}
            />
          ))
        )}
      </div>
    </div>
  );
}

function PrintPdfFirstPageTitle({ title }: { title: string }) {
  return (
    <div className="corpcal-print-pdf-first-page-title" aria-hidden="true">
      {title}
    </div>
  );
}

function SectionGroup({
  section,
  variant,
  activityBaseUrl,
  showEventLead,
  highlightActivityIds,
  resolveTranslationLanguageLabel,
}: {
  section: SortedSection;
  variant: PrintReportVariant;
  activityBaseUrl: string;
  showEventLead: boolean;
  highlightActivityIds?: ReadonlySet<number>;
  resolveTranslationLanguageLabel?: TranslationLanguageLabelResolver;
}) {
  const dateKeys = sortedDateKeysForSection(section);
  const dayBlocks: PrintGroupedSectionDayBlock[] = dateKeys.map((dayKey) => {
    const activities = section.activitiesByKey.get(dayKey) ?? [];
    const rows: PrintRowViewModel[] = activities.map((a) =>
      toPrintRowViewModel(a, {
        activityBaseUrl,
        dateCellStyle: 'shortNoYear',
        variant,
        resolveTranslationLanguageLabel,
      })
    );
    return {
      dayKey,
      dayHeading: formatDayHeading(dayKey),
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
        showPerDayPrintChrome={section.showPerDayPrintChrome}
        showEventLead={showEventLead}
        omitReleaseColumn={section.omitReleaseColumn}
        highlightActivityIds={highlightActivityIds}
      />
    </section>
  );
}
