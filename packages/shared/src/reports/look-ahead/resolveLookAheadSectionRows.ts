import type { ReportResponse } from '../../schemas/lookup.schema';
import {
  mergeReportFilters,
  type ReportConfig,
} from '../../schemas/report-config.schema';

/**
 * Normalised section row resolved from `ReportConfig`.
 *
 * Single contract for every surface that needs to enumerate look-ahead sections
 * (activity form, table filter, report cover, PDF section heading, allowlist
 * validation). Pure data; carries no React or HTML.
 */
export interface LookAheadSectionRow {
  /** Stable section id from `reports.config.sections[].id`. */
  sectionId: string;
  /** Sort order from config. Rows are returned already sorted ascending. */
  order: number;
  /**
   * Activity-side bucket key (`activity.lookAheadSection`) resolved from the
   * merged `globalFilter` + `section.filter`. `null` when the section is not
   * bound to a specific look-ahead key (e.g. range-only sections).
   */
  lookAheadKey: string | null;
  /** Short label for activity form / filter UI. Falls back to `name`. */
  uiLabel: string;
  /** Longer label for report covers / section headings. Falls back to `name`. */
  reportLegendLabel: string;
  /** Optional `#RRGGBB` swatch color. Already validated by `reportConfigSchema`. */
  legendColor: string | null;
  /**
   * Optional explicit override for the print rollup's per-day chrome (date row
   * + repeated column header band). `null` means "let the renderer pick a
   * default" (today: only `events`-keyed sections opt in).
   */
  printPerDayColumnHeaderRepeat: boolean | null;
}

export interface ResolveLookAheadSectionRowsOptions {
  /**
   * When true, sections that resolve to a `null` `lookAheadKey` are dropped.
   * Useful when callers (e.g. activity validation) only care about sections
   * that actually bucket activities by `lookAheadSection`.
   */
  requireLookAheadKey?: boolean;
}

/**
 * Resolve a `ReportConfig` to ordered, presentation-agnostic look-ahead rows.
 *
 * Pure function: stable for the same input; no I/O. Callers in calendar-service
 * (look-ahead service, PDF cover builder) and calendar-ui (activity form,
 * filter, table) share this single source of truth so labels, ordering, and
 * allowed activity keys never drift.
 */
export function resolveLookAheadSectionRows(
  config: ReportConfig,
  options: ResolveLookAheadSectionRowsOptions = {}
): LookAheadSectionRow[] {
  const { requireLookAheadKey = false } = options;
  const rows: LookAheadSectionRow[] = [];
  const sortedSections = [...config.sections].sort((a, b) => a.order - b.order);

  for (const section of sortedSections) {
    const merged = mergeReportFilters(config.globalFilter, section.filter);
    const lookAheadKey = merged?.lookAheadSection ?? null;
    if (requireLookAheadKey && lookAheadKey === null) continue;
    rows.push({
      sectionId: section.id,
      order: section.order,
      lookAheadKey,
      uiLabel: section.uiDisplayName ?? section.name,
      reportLegendLabel: section.reportDisplayName ?? section.name,
      legendColor: section.legendColor ?? null,
      printPerDayColumnHeaderRepeat:
        section.printPerDayColumnHeaderRepeat ?? null,
    });
  }

  return rows;
}

/**
 * Collect the union of allowed `activity.lookAheadSection` values from one or
 * more report configs.
 *
 * - Preserves first-encountered ordering (so the primary look-ahead report
 *   defines canonical UI order).
 * - Skips sections without a `lookAheadKey`.
 * - Caller filters `reports` to the policy set (e.g. `look-ahead`, `exec`).
 */
export function allowedLookAheadSectionKeysFromReports(
  reports: ReadonlyArray<ReportResponse>
): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const report of reports) {
    if (!report.config) continue;
    const rows = resolveLookAheadSectionRows(report.config, {
      requireLookAheadKey: true,
    });
    for (const row of rows) {
      if (row.lookAheadKey === null) continue;
      if (seen.has(row.lookAheadKey)) continue;
      seen.add(row.lookAheadKey);
      ordered.push(row.lookAheadKey);
    }
  }
  return ordered;
}

/**
 * Convenience predicate matching the keys returned by
 * {@link allowedLookAheadSectionKeysFromReports}.
 */
export function isAllowedLookAheadSectionKey(
  allowedKeys: ReadonlyArray<string>,
  value: string | null | undefined
): boolean {
  if (value === null || value === undefined) return false;
  return allowedKeys.includes(value);
}
