import { z } from 'zod';

import { LEGEND_SWATCH_HEX_REGEX } from './legend-swatch-hex';

/**
 * Report Configuration Schemas
 *
 * Defines Zod schemas for report configuration stored in the reports.config JSONB field.
 * This configuration controls which activity fields are displayed and how activities
 * are organized into sections with optional filters.
 *
 * The configuration supports:
 * - A global filter that applies to all activities in the report
 * - Section-level filters that augment or update the global filter for specific sections
 *   (e.g., global filter might filter by date range, section filters might further filter by day)
 *
 * This file stays generic: no imports from feature modules (look-ahead, print, etc.).
 */

/**
 * Filter configuration for report sections
 * Similar to EventTable saved filters
 */
export const reportFilterConfigSchema = z.object({
  status: z.array(z.string()).optional(),
  category: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  dateRange: z
    .object({
      start: z.string(),
      end: z.string(),
    })
    .optional(),
  /**
   * Bound the section to a single look-ahead bucket key (e.g. `events`).
   * Look-ahead-aware features may interpret this; generic report engine
   * forwards it to the activity finder via `FilterActivitiesQueryParams.lookAheadSection`.
   */
  lookAheadSection: z.string().optional(),
});

/**
 * Report section configuration
 *
 * `name` is the canonical section identifier shown in admin UI and CSV/Excel export
 * (kept for backwards-compatibility with existing consumers). When defined,
 * `uiDisplayName` and `reportDisplayName` override `name` for activity-form/filter
 * UI and report cover/legend strings respectively, allowing a short label and a
 * longer printed label to live on the same row.
 */
export const reportSectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** Short label shown in activity form / filter UI (defaults to `name` when omitted). */
  uiDisplayName: z.string().optional(),
  /** Longer label used for the report cover legend, section heading, etc. (defaults to `name` when omitted). */
  reportDisplayName: z.string().optional(),
  /** Optional hex color (`#RRGGBB` or `#RGB`) used for the section legend swatch. */
  legendColor: z
    .string()
    .regex(LEGEND_SWATCH_HEX_REGEX, {
      message: 'legendColor must be a hex color (e.g. #1A2B3C or #1AB).',
    })
    .optional(),
  order: z.number().int(),
  filter: reportFilterConfigSchema.optional(),
  /**
   * Optional per-section override of the parent `fields` whitelist.
   * When omitted, sections inherit the report-level `fields` array.
   * Reserved for future per-section column tailoring; consumers may ignore until
   * a column engine reads it.
   */
  fields: z.array(z.string()).optional(),
  /**
   * When true, the look-ahead print rollup renders a calendar-date heading and a
   * cloned column header band above each day's activities (the "Events" rhythm).
   * When false or omitted, days flow as continuous activity rows under the
   * section title with no per-day chrome.
   *
   * Opt-in per section. Today the canonical Events bucket sets this to `true`
   * in seed config; other sections (issues, news, awareness, longTerm, etc.)
   * leave it unset.
   */
  printPerDayColumnHeaderRepeat: z.boolean().optional(),
});

/**
 * Print template identifier for the report. Drives which React document and
 * column layout the print/PDF pipeline picks. Loose string for forward-compat
 * with admin-defined templates; current renderer recognises a fixed set
 * (e.g. `lookAheadV1`).
 */
export const reportPrintTemplateSchema = z.string();

/**
 * Report configuration structure
 * Stored in reports.config JSONB field
 */
export const reportConfigSchema = z.object({
  fields: z.array(z.string()),
  globalFilter: reportFilterConfigSchema.optional(),
  /**
   * Optional explicit print template id. When omitted, callers fall back to a
   * mapping keyed by `reports.name` (legacy behavior).
   */
  printTemplate: reportPrintTemplateSchema.optional(),
  sections: z.array(reportSectionSchema),
});

/**
 * TypeScript types inferred from schemas
 */
export type FilterConfig = z.infer<typeof reportFilterConfigSchema>;
export type ReportSection = z.infer<typeof reportSectionSchema>;
export type ReportConfig = z.infer<typeof reportConfigSchema>;

/**
 * Merges a global filter with a section filter.
 * The section filter augments or updates properties from the global filter.
 * Properties in the section filter take precedence over the global filter.
 *
 * @param globalFilter - The global filter to apply to all activities
 * @param sectionFilter - The section-specific filter that augments the global filter
 * @returns A merged filter combining both filters, with section filter taking precedence
 *
 * @example
 * ```typescript
 * const globalFilter = { dateRange: { start: '2024-01-01', end: '2024-01-07' } };
 * const sectionFilter = { lookAheadSection: 'events' };
 * const merged = mergeReportFilters(globalFilter, sectionFilter);
 * // Result: { dateRange: { start: '2024-01-01', end: '2024-01-07' }, lookAheadSection: 'events' }
 * ```
 */
export function mergeReportFilters(
  globalFilter?: FilterConfig,
  sectionFilter?: FilterConfig
): FilterConfig | undefined {
  if (!globalFilter && !sectionFilter) {
    return undefined;
  }
  if (!globalFilter) {
    return sectionFilter;
  }
  if (!sectionFilter) {
    return globalFilter;
  }

  // For each property, section filter takes precedence over global filter
  // Properties not specified in section filter are inherited from global filter
  return {
    status: sectionFilter.status ?? globalFilter.status,
    category: sectionFilter.category ?? globalFilter.category,
    tags: sectionFilter.tags ?? globalFilter.tags,
    dateRange: sectionFilter.dateRange ?? globalFilter.dateRange,
    lookAheadSection:
      sectionFilter.lookAheadSection ?? globalFilter.lookAheadSection,
  };
}
