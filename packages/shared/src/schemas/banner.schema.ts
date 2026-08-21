import { z } from 'zod';

const hexColorSchema = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/, 'Must be a valid hex color');

const nullableDateTimeSchema = z.string().datetime().nullable();
const timeOfDaySchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:mm format');
export const BANNER_CONTENT_MAX_LENGTH = 500;
export const DEFAULT_RECURRING_EDIT_LOCKOUT_START_TIME = '15:00';
export const DEFAULT_RECURRING_EDIT_LOCKOUT_END_TIME = '23:59';
export const DEFAULT_RECURRING_EDIT_LOCKOUT_BANNER_LEAD_MINUTES = 30;

export const bannerSettingsSchema = z.object({
  id: z.number().int(),
  isActive: z.boolean(),
  content: z.string(),
  backgroundColor: hexColorSchema,
  textColor: hexColorSchema,
  variant: z.enum(['info', 'warning', 'success']),
  isDismissible: z.boolean(),
  dismissScope: z.enum(['persistent', 'session']),
  startDateTime: nullableDateTimeSchema,
  endDateTime: nullableDateTimeSchema,
  createdDateTime: z.string().datetime(),
  lastUpdatedDateTime: z.string().datetime(),
});

export const upsertBannerSettingsRequestSchema = z
  .object({
    isActive: z.boolean(),
    content: z
      .string()
      .trim()
      .min(1, 'Banner content is required')
      .max(
        BANNER_CONTENT_MAX_LENGTH,
        `Banner content must be ${BANNER_CONTENT_MAX_LENGTH} characters or fewer`
      ),
    backgroundColor: hexColorSchema,
    textColor: hexColorSchema,
    variant: z.enum(['info', 'warning', 'success']).default('info'),
    isDismissible: z.boolean(),
    dismissScope: z.enum(['persistent', 'session']).default('persistent'),
    startDateTime: nullableDateTimeSchema.default(null),
    endDateTime: nullableDateTimeSchema.default(null),
  })
  .superRefine((value, ctx) => {
    if (!value.startDateTime || !value.endDateTime) {
      return;
    }

    if (new Date(value.endDateTime) <= new Date(value.startDateTime)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDateTime'],
        message: 'End date/time must be after start date/time',
      });
    }
  });

export const recurringLockoutBannerSettingsSchema = z.object({
  id: z.number().int(),
  isActive: z.boolean(),
  content: z.string(),
  backgroundColor: hexColorSchema,
  textColor: hexColorSchema,
  variant: z.enum(['info', 'warning', 'success']),
  startTimeOfDay: timeOfDaySchema,
  endTimeOfDay: timeOfDaySchema,
  bannerLeadMinutes: z
    .number()
    .int()
    .min(0)
    .max(24 * 60),
  createdDateTime: z.string().datetime(),
  lastUpdatedDateTime: z.string().datetime(),
});

function timeToMinutes(time: string): number {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

export const upsertRecurringLockoutBannerSettingsRequestSchema = z
  .object({
    isActive: z.boolean(),
    content: z
      .string()
      .trim()
      .min(1, 'Banner content is required')
      .max(
        BANNER_CONTENT_MAX_LENGTH,
        `Banner content must be ${BANNER_CONTENT_MAX_LENGTH} characters or fewer`
      ),
    backgroundColor: hexColorSchema,
    textColor: hexColorSchema,
    variant: z.enum(['info', 'warning', 'success']).default('warning'),
    startTimeOfDay: timeOfDaySchema.default(
      DEFAULT_RECURRING_EDIT_LOCKOUT_START_TIME
    ),
    endTimeOfDay: timeOfDaySchema.default(
      DEFAULT_RECURRING_EDIT_LOCKOUT_END_TIME
    ),
    bannerLeadMinutes: z
      .number()
      .int()
      .min(0, 'Banner lead time must be 0 or greater')
      .max(24 * 60, 'Banner lead time cannot exceed 1440 minutes')
      .default(DEFAULT_RECURRING_EDIT_LOCKOUT_BANNER_LEAD_MINUTES),
  })
  .superRefine((value, ctx) => {
    if (
      timeToMinutes(value.endTimeOfDay) <= timeToMinutes(value.startTimeOfDay)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endTimeOfDay'],
        message: 'End time must be after start time',
      });
    }
  });

export type BannerSettings = z.infer<typeof bannerSettingsSchema>;
export type UpsertBannerSettingsBody = z.infer<
  typeof upsertBannerSettingsRequestSchema
>;
export type RecurringLockoutBannerSettings = z.infer<
  typeof recurringLockoutBannerSettingsSchema
>;
export type UpsertRecurringLockoutBannerSettingsBody = z.infer<
  typeof upsertRecurringLockoutBannerSettingsRequestSchema
>;
