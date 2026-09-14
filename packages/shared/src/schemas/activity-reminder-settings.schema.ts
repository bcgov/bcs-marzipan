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
