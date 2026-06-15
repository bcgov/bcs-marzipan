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
    scope: z.enum(['window', 'all_future']).optional().default('window'),
    days: windowDaysSchema.optional(),
    includePast: z.boolean().optional().default(false),
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

export type LookAheadResetManualRunBody = z.infer<
  typeof lookAheadResetManualRunBodySchema
>;

export const lookAheadResetRunPreviewQuerySchema = z.object({
  scope: z.enum(['window', 'all_future']).optional().default('window'),
  days: windowDaysSchema.optional(),
  includePast: z.coerce.boolean().optional().default(false),
});

export type LookAheadResetRunPreviewQuery = z.infer<
  typeof lookAheadResetRunPreviewQuerySchema
>;
