import { z } from 'zod';

import {
  MAX_ACTIVITY_REMINDER_DAYS,
  MIN_ACTIVITY_REMINDER_DAYS,
} from '../activity-reminders';

export const activityReminderSettingsSchema = z.object({
  leadDays: z
    .number()
    .int()
    .min(MIN_ACTIVITY_REMINDER_DAYS)
    .max(MAX_ACTIVITY_REMINDER_DAYS),
  staleDays: z
    .number()
    .int()
    .min(MIN_ACTIVITY_REMINDER_DAYS)
    .max(MAX_ACTIVITY_REMINDER_DAYS),
});

export type ActivityReminderSettings = z.infer<
  typeof activityReminderSettingsSchema
>;

export const activityReminderPreviewSchema = z.object({
  reminderPostDated: z.number().int().nonnegative(),
  reminderDateStatusNotConfirmed: z.number().int().nonnegative(),
  reminderNullTime: z.number().int().nonnegative(),
  reminderTimeStatusNotConfirmed: z.number().int().nonnegative(),
  reminderUpcoming: z.number().int().nonnegative(),
  reminderStale: z.number().int().nonnegative(),
});

export const activityReminderBatchRunResultSchema = z.object({
  sent: z.number().int().nonnegative(),
  skipped: z.boolean(),
  skipReason: z.enum(['in_flight', 'error']).optional(),
  counts: activityReminderPreviewSchema,
});
