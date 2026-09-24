import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  createResponseWrapperSchema,
  notificationBulkActionResultSchema,
  notificationPageSchema,
  unreadNotificationCountSchema,
} from '@corpcal/shared/schemas';

export class NotificationPageResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(notificationPageSchema)
) {}

export class UnreadNotificationCountResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(unreadNotificationCountSchema)
) {}

export class NotificationBulkActionResultResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(notificationBulkActionResultSchema)
) {}

const notificationUpdatedResultSchema = z.object({
  updated: z.literal(true),
});

export class NotificationUpdatedResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(notificationUpdatedResultSchema)
) {}
