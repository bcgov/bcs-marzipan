import { z } from 'zod';

const hexColorSchema = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/, 'Must be a valid hex color');

const nullableDateTimeSchema = z.string().datetime().nullable();

export const bannerSettingsSchema = z.object({
  id: z.number().int(),
  isActive: z.boolean(),
  content: z.string(),
  backgroundColor: hexColorSchema,
  textColor: hexColorSchema,
  isDismissible: z.boolean(),
  startDateTime: nullableDateTimeSchema,
  endDateTime: nullableDateTimeSchema,
  createdDateTime: z.string().datetime(),
  lastUpdatedDateTime: z.string().datetime(),
});

export const upsertBannerSettingsRequestSchema = z
  .object({
    isActive: z.boolean(),
    content: z.string().trim().min(1, 'Banner content is required'),
    backgroundColor: hexColorSchema,
    textColor: hexColorSchema,
    isDismissible: z.boolean(),
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
