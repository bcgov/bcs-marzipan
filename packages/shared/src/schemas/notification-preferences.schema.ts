import { z } from 'zod';

import { NOTIFICATION_PREFERENCE_CATEGORIES } from '../notification-constants';

export const notificationPreferenceCategorySchema = z.enum([
  NOTIFICATION_PREFERENCE_CATEGORIES.ACTIVITY_LIFECYCLE,
  NOTIFICATION_PREFERENCE_CATEGORIES.ACTIVITY_UPDATES,
  NOTIFICATION_PREFERENCE_CATEGORIES.ACTIVITY_SHARING,
  NOTIFICATION_PREFERENCE_CATEGORIES.ACTIVITY_REMINDERS,
  NOTIFICATION_PREFERENCE_CATEGORIES.ACTIVITY_REMOVAL,
  NOTIFICATION_PREFERENCE_CATEGORIES.USERS_AND_TEAMS,
]);

export const notificationCategoryPreferenceSchema = z.object({
  category: notificationPreferenceCategorySchema,
  inApp: z.boolean().describe('Receive in-app (bell) notifications'),
  email: z.boolean().describe('Receive email notifications'),
});

/** GET /notifications/preferences response; always includes every category. */
export const notificationPreferencesSchema = z.object({
  emailEnabled: z
    .boolean()
    .describe('Master switch for all email notifications'),
  categories: z.array(notificationCategoryPreferenceSchema),
});

/** PUT /notifications/preferences body; omitted categories are left unchanged. */
export const notificationPreferencesUpdateSchema = z
  .object({
    emailEnabled: z.boolean().optional(),
    categories: z
      .array(notificationCategoryPreferenceSchema)
      .min(1)
      .max(Object.keys(NOTIFICATION_PREFERENCE_CATEGORIES).length)
      .optional(),
  })
  .refine(
    (body) => body.emailEnabled !== undefined || body.categories !== undefined,
    { message: 'Provide emailEnabled and/or categories' }
  )
  .refine(
    (body) =>
      !body.categories ||
      new Set(body.categories.map((c) => c.category)).size ===
        body.categories.length,
    { message: 'Each category may only appear once', path: ['categories'] }
  );

export type NotificationCategoryPreference = z.infer<
  typeof notificationCategoryPreferenceSchema
>;
export type NotificationPreferences = z.infer<
  typeof notificationPreferencesSchema
>;
export type NotificationPreferencesUpdate = z.infer<
  typeof notificationPreferencesUpdateSchema
>;
