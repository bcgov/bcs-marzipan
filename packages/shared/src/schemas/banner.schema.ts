import { z } from 'zod';

const hexColorSchema = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/, 'Must be a valid hex color');

const nullableDateTimeSchema = z.string().datetime().nullable();
export const BANNER_CONTENT_MAX_LENGTH = 1000;

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

export type BannerSettings = z.infer<typeof bannerSettingsSchema>;
export type UpsertBannerSettingsBody = z.infer<
  typeof upsertBannerSettingsRequestSchema
>;
