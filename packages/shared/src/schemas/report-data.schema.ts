import { z } from 'zod';

import type { ReportDateRange } from '../reports/normalizeReportActivityDateRange';
import { activityListItemSchema } from './activity-list-item.schema';
import { reportResponseSchema } from './lookup.schema';

const reportDateRangeSchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}) as unknown as z.ZodType<ReportDateRange>;

export const reportSectionDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  order: z.number().int(),
  activities: z.array(activityListItemSchema),
});

export type ReportSectionData = z.infer<typeof reportSectionDataSchema>;

export const reportDataMetaSchema = z.object({
  resolvedDateRange: reportDateRangeSchema,
  wasClamped: z.boolean(),
  inferredBound: z.enum(['start', 'end', 'both']).nullable(),
  activityCount: z.number().int().nonnegative(),
  largeResultWarning: z.boolean(),
});

export type ReportDataMeta = z.infer<typeof reportDataMetaSchema>;

/** Payload for GET /reports/data/:type */
export const reportDataResponseSchema = z.object({
  report: reportResponseSchema,
  sections: z.array(reportSectionDataSchema),
  meta: reportDataMetaSchema.optional(),
});

export type ReportDataResponse = z.infer<typeof reportDataResponseSchema>;

/** Payload for GET /look-ahead (subset of report data shape). */
export const lookAheadDataResponseSchema = z.object({
  report: reportResponseSchema.nullable(),
  sections: z.array(reportSectionDataSchema),
});

export type LookAheadDataResponse = z.infer<typeof lookAheadDataResponseSchema>;
