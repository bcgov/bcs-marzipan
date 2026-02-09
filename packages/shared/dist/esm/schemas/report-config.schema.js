import { z } from 'zod';
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
    lookAheadSection: z.string().optional(),
});
/**
 * Report section configuration
 */
export const reportSectionSchema = z.object({
    id: z.string(),
    name: z.string(),
    order: z.number().int(),
    filter: reportFilterConfigSchema.optional(),
});
/**
 * Report configuration structure
 * Stored in reports.config JSONB field
 */
export const reportConfigSchema = z.object({
    fields: z.array(z.string()),
    globalFilter: reportFilterConfigSchema.optional(),
    sections: z.array(reportSectionSchema),
});
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
export function mergeReportFilters(globalFilter, sectionFilter) {
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
        lookAheadSection: sectionFilter.lookAheadSection ?? globalFilter.lookAheadSection,
    };
}
