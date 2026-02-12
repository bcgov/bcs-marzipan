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
export declare const reportFilterConfigSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodArray<z.ZodString>>;
    category: z.ZodOptional<z.ZodArray<z.ZodString>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    dateRange: z.ZodOptional<z.ZodObject<{
        start: z.ZodString;
        end: z.ZodString;
    }, z.core.$strip>>;
    lookAheadSection: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
/**
 * Report section configuration
 */
export declare const reportSectionSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    order: z.ZodNumber;
    filter: z.ZodOptional<z.ZodObject<{
        status: z.ZodOptional<z.ZodArray<z.ZodString>>;
        category: z.ZodOptional<z.ZodArray<z.ZodString>>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        dateRange: z.ZodOptional<z.ZodObject<{
            start: z.ZodString;
            end: z.ZodString;
        }, z.core.$strip>>;
        lookAheadSection: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
/**
 * Report configuration structure
 * Stored in reports.config JSONB field
 */
export declare const reportConfigSchema: z.ZodObject<{
    fields: z.ZodArray<z.ZodString>;
    globalFilter: z.ZodOptional<z.ZodObject<{
        status: z.ZodOptional<z.ZodArray<z.ZodString>>;
        category: z.ZodOptional<z.ZodArray<z.ZodString>>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        dateRange: z.ZodOptional<z.ZodObject<{
            start: z.ZodString;
            end: z.ZodString;
        }, z.core.$strip>>;
        lookAheadSection: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    sections: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        order: z.ZodNumber;
        filter: z.ZodOptional<z.ZodObject<{
            status: z.ZodOptional<z.ZodArray<z.ZodString>>;
            category: z.ZodOptional<z.ZodArray<z.ZodString>>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
            dateRange: z.ZodOptional<z.ZodObject<{
                start: z.ZodString;
                end: z.ZodString;
            }, z.core.$strip>>;
            lookAheadSection: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
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
export declare function mergeReportFilters(globalFilter?: FilterConfig, sectionFilter?: FilterConfig): FilterConfig | undefined;
//# sourceMappingURL=report-config.schema.d.ts.map