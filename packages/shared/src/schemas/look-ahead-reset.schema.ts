import { z } from 'zod';

import {
  MAX_LOOK_AHEAD_RESET_WINDOW_DAYS,
  MIN_LOOK_AHEAD_RESET_WINDOW_DAYS,
  type LookAheadResetCronMode,
  type LookAheadResetLastClearSummary,
} from '../look-ahead-reset';

export type LookAheadResetSettings = {
  windowDaysAfterToday: number;
  cronMode: LookAheadResetCronMode;
  rollbackAvailable: boolean;
  lastClear?: LookAheadResetLastClearSummary;
};

const windowDaysSchema = z.coerce
  .number()
  .int()
  .min(MIN_LOOK_AHEAD_RESET_WINDOW_DAYS)
  .max(MAX_LOOK_AHEAD_RESET_WINDOW_DAYS);

const cronModeSchema = z.enum(['running', 'paused_today', 'stopped']);
// `paused_today` is set only via manual reset (skip tonight); admin UI uses running/stopped.

export const lookAheadResetSettingsPatchSchema = z
  .object({
    windowDaysAfterToday: windowDaysSchema.optional(),
    cronMode: cronModeSchema.optional(),
  })
  .refine(
    (body) =>
      body.windowDaysAfterToday !== undefined || body.cronMode !== undefined,
    {
      message: 'At least one of windowDaysAfterToday or cronMode is required',
    }
  );

export const lookAheadResetManualRunBodySchema = z
  .object({
    // `all_future` is supported for API/manual use but not exposed in admin UI.
    scope: z.enum(['window', 'all_future']).optional().default('window'),
    days: windowDaysSchema.optional(),
    includePast: z.boolean().optional().default(false),
    pauseScheduledTonight: z.boolean().optional().default(false),
  })
  .superRefine((body, ctx) => {
    if (body.scope === 'window' && body.includePast) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'includePast is only valid when scope is all_future',
        path: ['includePast'],
      });
    }
  });

/** HTTP request schema: an absent body is equivalent to an empty body. */
export const lookAheadResetManualRunRequestSchema = z.preprocess(
  (value) => value ?? {},
  lookAheadResetManualRunBodySchema
);

export type LookAheadResetManualRunBody = z.infer<
  typeof lookAheadResetManualRunBodySchema
>;

export const lookAheadResetRunPreviewQuerySchema = z.object({
  scope: z.enum(['window', 'all_future']).optional().default('window'),
  days: windowDaysSchema.optional(),
  includePast: z
    .string()
    .optional()
    .transform((val): boolean | undefined =>
      val === undefined ? undefined : val === 'true'
    )
    .default(false),
});

export type LookAheadResetRunPreviewQuery = z.infer<
  typeof lookAheadResetRunPreviewQuerySchema
>;

export const lookAheadResetLastClearSummarySchema = z.object({
  at: z.string(),
  updated: z.number().int().nonnegative(),
  trigger: z.enum(['schedule', 'manual']),
});

export const lookAheadResetSettingsSchema = z.object({
  windowDaysAfterToday: z.number().int(),
  cronMode: cronModeSchema,
  rollbackAvailable: z.boolean(),
  lastClear: lookAheadResetLastClearSummarySchema.optional(),
});

export const lookAheadResetRollbackResultSchema = z.object({
  restored: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  rollbackAvailable: z.boolean(),
  skippedRollback: z.boolean().optional(),
  skipReason: z.enum(['in_flight', 'advisory_lock']).optional(),
});

export const lookAheadResetRunPreviewResultSchema = z.object({
  count: z.number().int().nonnegative(),
  items: z.array(
    z.object({
      displayId: z.string().nullable(),
      title: z.string(),
    })
  ),
  listTruncated: z.boolean(),
});

export const lookAheadResetBatchRunResultSchema = z.object({
  updated: z.number().int().nonnegative(),
  skipped: z.boolean(),
  skipReason: z
    .enum([
      'in_flight',
      'advisory_lock',
      'error',
      'cron_stopped',
      'paused_today',
    ])
    .optional(),
  scheduledRunPausedTonight: z.boolean().optional(),
});
