import { z } from 'zod';

/** PATCH /notifications/recipients/:recipientId */
export const notificationRecipientPatchSchema = z
  .object({
    read: z.literal(true).optional(),
    dismissed: z.literal(true).optional(),
  })
  .refine((body) => body.read === true || body.dismissed === true, {
    message: 'At least one of read or dismissed must be true',
  })
  .refine((body) => !(body.read && body.dismissed), {
    message: 'Specify only one of read or dismissed per request',
  });

export type NotificationRecipientPatch = z.infer<
  typeof notificationRecipientPatchSchema
>;
