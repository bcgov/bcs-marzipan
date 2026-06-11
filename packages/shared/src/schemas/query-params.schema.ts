import { z } from 'zod';

import {
  commaSeparatedIntArray,
  commaSeparatedStringArray,
  confirmedFilterEnum,
} from './query-param-helpers';

/**
 * Query Parameter Schemas
 *
 * These schemas handle HTTP query parameters which are always strings.
 * They use z.transform().pipe() to convert string inputs to their proper types.
 *
 * NOTE: Isolated in a separate file to prevent Zod v4 type inference issues
 * from affecting other schema type inferences (like z.infer on response schemas).
 */

// ============================================
// Lookup Query Params
// ============================================

/**
 * Query params for lookup endpoints
 */
export const lookupQueryParamsSchema = z.object({
  userId: z.string().transform(Number).pipe(z.number().int()).optional(),
  role: z.string().optional(),
  organizationId: z
    .string()
    .transform(Number)
    .pipe(z.number().int())
    .optional(),
  userIds: z
    .union([
      z.array(z.string().transform(Number).pipe(z.number().int())),
      z.string().transform((val) =>
        val
          .split(',')
          .map((id) => parseInt(id.trim(), 10))
          .filter((id) => !isNaN(id))
      ),
    ])
    .optional(),
});

export type LookupQueryParams = z.infer<typeof lookupQueryParamsSchema>;

// ============================================
// Activity Filter Query Params
// ============================================

/**
 * Unified array-based activity filter query params.
 * Tabs pass single-element arrays; multi-select filters pass multiple IDs (OR semantics).
 */
export const filterActivitiesQuerySchema = z.object({
  title: z.string().optional(),
  startDateFrom: z.string().date().optional(),
  startDateTo: z.string().date().optional(),
  endDateFrom: z.string().date().optional(),
  endDateTo: z.string().date().optional(),
  /**
   * When true with startDateFrom/startDateTo, activity start and end must be
   * non-empty and the scheduled span must overlap the window (matches activity
   * list client filter).
   */
  scheduledDateRangeOverlaps: z
    .string()
    .optional()
    .transform((val): boolean | undefined =>
      val === undefined ? undefined : val === 'true'
    ),
  activityStatusIds: commaSeparatedIntArray(),
  leadMinistryIds: commaSeparatedIntArray(),
  leadOrgIds: commaSeparatedIntArray(),
  leadTeamIds: commaSeparatedIntArray(),
  commsContactLeadUserIds: commaSeparatedIntArray(),
  flagAssigneeUserIds: commaSeparatedIntArray(),
  sharedWithTeamIds: commaSeparatedIntArray(),
  eventPlannerLeadIds: commaSeparatedIntArray(),
  tagIds: commaSeparatedIntArray(),
  categoryNames: commaSeparatedStringArray(),
  translationRequiredStatusIds: commaSeparatedIntArray(),
  translationLanguageIds: commaSeparatedIntArray(),
  pitchRequiredStatusNames: commaSeparatedStringArray(),
  lookAheadStatusValues: commaSeparatedStringArray(),
  lookAheadSectionValues: commaSeparatedStringArray(),
  dateConfirmedFilter: confirmedFilterEnum.optional(),
  timeConfirmedFilter: confirmedFilterEnum.optional(),
  pitchDateNotScheduled: z
    .string()
    .optional()
    .transform((val): boolean | undefined =>
      val === undefined ? undefined : val === 'true'
    ),
  /**
   * When true, activity must have a pitch date set (no bounds). Used when the UI
   * selects "scheduled" without an active pitch date range.
   */
  pitchDateScheduled: z
    .string()
    .optional()
    .transform((val): boolean | undefined =>
      val === undefined ? undefined : val === 'true'
    ),
  pitchDateFrom: z.string().date().optional(),
  pitchDateTo: z.string().date().optional(),
  search: z.string().optional(),
  city: z.string().optional(),
  isIssue: z
    .string()
    .transform((val) => val === 'true')
    .pipe(z.boolean())
    .optional(),
  includeCompleted: z
    .string()
    .optional()
    .transform((val): boolean | undefined =>
      val === undefined ? undefined : val === 'true'
    ),
  includeDeleted: z
    .string()
    .optional()
    .transform((val): boolean | undefined =>
      val === undefined ? undefined : val === 'true'
    ),
  page: z
    .string()
    .default('1')
    .transform(Number)
    .pipe(z.number().int().positive()),
  limit: z
    .string()
    .default('20')
    .transform(Number)
    .pipe(z.number().int().positive().min(1).max(100)),
});

/** Parsed query shape; Zod transforms infer many keys as required `T | undefined`. */
type ParsedFilterActivitiesQueryParams = z.infer<
  typeof filterActivitiesQuerySchema
>;

/** Activity list / findAll filters. Only pagination defaults are required keys. */
export type FilterActivitiesQueryParams = Pick<
  ParsedFilterActivitiesQueryParams,
  'page' | 'limit'
> &
  Partial<Omit<ParsedFilterActivitiesQueryParams, 'page' | 'limit'>>;

/** Int-array query fields serialized as comma-separated strings in HTTP. */
export const FILTER_ACTIVITIES_INT_ARRAY_KEYS = [
  'activityStatusIds',
  'leadMinistryIds',
  'leadOrgIds',
  'leadTeamIds',
  'commsContactLeadUserIds',
  'flagAssigneeUserIds',
  'sharedWithTeamIds',
  'eventPlannerLeadIds',
  'tagIds',
  'translationRequiredStatusIds',
  'translationLanguageIds',
] as const satisfies readonly (keyof FilterActivitiesQueryParams)[];

/** String-array query fields serialized as comma-separated strings in HTTP. */
export const FILTER_ACTIVITIES_STRING_ARRAY_KEYS = [
  'categoryNames',
  'pitchRequiredStatusNames',
  'lookAheadStatusValues',
  'lookAheadSectionValues',
] as const satisfies readonly (keyof FilterActivitiesQueryParams)[];

/**
 * Serialize activity filter params for HTTP query strings (arrays → comma-separated).
 */
export function serializeFilterActivitiesQueryParams(
  filters: Partial<FilterActivitiesQueryParams> | undefined
): Record<string, string | number | boolean | undefined> {
  if (filters == null) return {};
  const out: Record<string, string | number | boolean | undefined> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      out[key] = value.join(',');
    } else {
      out[key] = value;
    }
  }
  return out;
}

/**
 * Reports report-data and export query: activity filters without pagination.
 */
export const reportDataQuerySchema = filterActivitiesQuerySchema.omit({
  page: true,
  limit: true,
});

export type ReportDataQueryParams = z.infer<typeof reportDataQuerySchema>;

export function reportDataQueryToActivityFindAllFilters(
  query: ReportDataQueryParams
): FilterActivitiesQueryParams {
  const { search: _search, ...rest } = query;
  return {
    ...rest,
    page: 1,
    limit: 100,
  };
}
