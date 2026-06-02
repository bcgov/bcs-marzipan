import type { ReportDataResponse } from '../../../api/report-data';
import type { ActivityResponse } from '../../../schemas/activity-response.schema';
import { resolveLookAheadSectionRows } from '../../look-ahead';
import type { ReportDateRange } from '../../normalizeReportActivityDateRange';
import {
  effectiveReportFieldsIncludeEventLead,
  getEffectiveReportFields,
} from '../../reportTypeConfig';
import { buildPrintGroupedDayBlocks } from '../buildPrintGroupedDayBlocks';
import { PrintGroupedSectionTable } from './PrintSectionTable';
import { CORPCAL_PRINT_ROOT_CLASS } from './printStyles';
import {
  compareActivitiesForPrint,
  type PrintReportVariant,
} from './rowViewModel';
import type { TranslationLanguageLabelResolver } from './translationLanguageDisplayLabels';
import { dateKeyLocal } from './dateFormatters';

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

const VARIANT_TO_TEMPLATE_SLUG: Record<PrintReportVariant, string> = {
  execLookAhead: 'EXEC_LOOK_AHEAD',
  thirtySixtyNinety: 'THIRTY_SIXTY_NINETY',
  planning: 'PLANNING',
  lookAhead: 'LOOK_AHEAD',
};

const VARIANT_TO_FIRST_PAGE_TITLE: Partial<
  Record<PrintReportVariant, string>
> = {
  thirtySixtyNinety: '30/60/90 Report',
  planning: 'Planning Report',
};

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
  const hasSections = sections.length > 0;
  const hasAny = reportHasAnyActivities(sections);
  const effectiveFields = getEffectiveReportFields(data.report);
  const showEventLead = effectiveReportFieldsIncludeEventLead(effectiveFields);
  const firstPageTitle = hasAny
    ? VARIANT_TO_FIRST_PAGE_TITLE[variant]
    : undefined;

  return (
    <div
      className={CORPCAL_PRINT_ROOT_CLASS}
      data-report-template={VARIANT_TO_TEMPLATE_SLUG[variant]}
    >
      <div className="corpcal-print-body">
        {firstPageTitle ? (
          <PrintPdfFirstPageTitle title={firstPageTitle} />
        ) : null}
        {!hasSections ? (
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
              resolvedDateRange={data.meta?.resolvedDateRange}
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
  resolvedDateRange,
  resolveTranslationLanguageLabel,
}: {
  section: SortedSection;
  variant: PrintReportVariant;
  activityBaseUrl: string;
  showEventLead: boolean;
  highlightActivityIds?: ReadonlySet<number>;
  resolvedDateRange?: ReportDateRange;
  resolveTranslationLanguageLabel?: TranslationLanguageLabelResolver;
}) {
  const dayBlocks = buildPrintGroupedDayBlocks({
    activitiesByKey: section.activitiesByKey,
    resolvedDateRange,
    showPerDayPrintChrome: section.showPerDayPrintChrome,
    variant,
    activityBaseUrl,
    resolveTranslationLanguageLabel,
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
