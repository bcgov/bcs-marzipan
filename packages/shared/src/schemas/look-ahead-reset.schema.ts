import { z } from 'zod';

import {
  MAX_LOOK_AHEAD_RESET_WINDOW_DAYS,
  MIN_LOOK_AHEAD_RESET_WINDOW_DAYS,
} from '../look-ahead-reset';

export type LookAheadResetSettings = {
  windowDaysAfterToday: number;
};

const windowDaysSchema = z.coerce
  .number()
  .int()
  .min(MIN_LOOK_AHEAD_RESET_WINDOW_DAYS)
  .max(MAX_LOOK_AHEAD_RESET_WINDOW_DAYS);

export const lookAheadResetSettingsSchema: z.ZodType<LookAheadResetSettings> =
  z.object({
    windowDaysAfterToday: windowDaysSchema,
  });

export const lookAheadResetManualRunBodySchema = z.object({
  days: windowDaysSchema.optional(),
});

export type LookAheadResetManualRunBody = z.infer<
  typeof lookAheadResetManualRunBodySchema
>;
