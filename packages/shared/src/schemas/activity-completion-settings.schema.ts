import { z } from 'zod';

import {
  COMPLETION_BUFFER_OPTIONS,
  COMPLETION_SCHEDULES,
  type CompletionBufferMinutes,
  type CompletionSchedule,
} from '../activity-completion';

/** Tuple shape required by `z.enum` (avoids widening schedule to plain `string` in clients). */
const COMPLETION_SCHEDULES_FOR_ZOD = COMPLETION_SCHEDULES as unknown as [
  CompletionSchedule,
  ...CompletionSchedule[],
];

export type ActivityCompletionSettings = {
  schedule: CompletionSchedule;
  bufferMinutes: CompletionBufferMinutes;
};

export const activityCompletionSettingsSchema: z.ZodType<ActivityCompletionSettings> =
  z.object({
    schedule: z.enum(COMPLETION_SCHEDULES_FOR_ZOD),
    bufferMinutes: z.coerce
      .number()
      .int()
      .refine(
        (v): v is CompletionBufferMinutes =>
          (COMPLETION_BUFFER_OPTIONS as readonly number[]).includes(v),
        { message: 'Buffer must be 0, 15, 30, or 45 minutes' }
      ),
  });

export const activityCompletionPreviewSchema = z.object({
  count: z.number().int().nonnegative(),
  items: z.array(
    z.object({
      displayId: z.string().nullable(),
      title: z.string(),
    })
  ),
  listTruncated: z.boolean(),
});

export const activityCompletionBatchRunResultSchema = z.object({
  updated: z.number().int().nonnegative(),
  skipped: z.boolean(),
  skipReason: z.enum(['in_flight', 'advisory_lock', 'error']).optional(),
});
