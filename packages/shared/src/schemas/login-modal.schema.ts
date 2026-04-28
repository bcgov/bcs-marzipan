import { z } from 'zod';

const nullableDateTimeSchema = z.string().datetime().nullable();

export const loginModalSettingsSchema = z.object({
  id: z.number().int(),
  isActive: z.boolean(),
  title: z.string(),
  content: z.string(),
  startDateTime: nullableDateTimeSchema,
  endDateTime: nullableDateTimeSchema,
  createdDateTime: z.string().datetime(),
  lastUpdatedDateTime: z.string().datetime(),
});

export const upsertLoginModalSettingsRequestSchema = z
  .object({
    isActive: z.boolean(),
    title: z.string().trim().min(1, 'Title is required').max(200),
    content: z.string().trim().min(1, 'Content is required'),
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

export type LoginModalSettings = z.infer<typeof loginModalSettingsSchema>;
export type UpsertLoginModalSettingsBody = z.infer<
  typeof upsertLoginModalSettingsRequestSchema
>;
