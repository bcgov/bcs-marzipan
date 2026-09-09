import { z } from 'zod';

import {
  NOTIFICATION_CHANGE_TYPES,
  NOTIFICATION_ENTITY_TYPES,
  NOTIFICATION_EVENT_TYPES,
  NOTIFICATION_RECIPIENT_STATUSES,
} from '../notifications';

const notificationEventTypeSchema = z.enum([
  NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_CREATE,
  NOTIFICATION_EVENT_TYPES.CALENDAR_TEAM_MEMBER_ADDED,
]);

const notificationEntityTypeSchema = z.enum([
  NOTIFICATION_ENTITY_TYPES.ACTIVITY,
  NOTIFICATION_ENTITY_TYPES.TEAM,
]);

const notificationChangeTypeSchema = z.enum([
  NOTIFICATION_CHANGE_TYPES.CREATE,
  NOTIFICATION_CHANGE_TYPES.STATUS_CHANGED,
  NOTIFICATION_CHANGE_TYPES.TEAM_MEMBER_ADDED,
]);

const booleanFromQueryParam = z.preprocess((value) => {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0') return false;
  }

  return value;
}, z.boolean());

export const notificationRecipientStatusSchema = z.enum([
  NOTIFICATION_RECIPIENT_STATUSES.UNREAD,
  NOTIFICATION_RECIPIENT_STATUSES.READ,
  NOTIFICATION_RECIPIENT_STATUSES.DISMISSED,
]);

export const notificationItemSchema = z.object({
  recipientId: z.number().int(),
  eventId: z.number().int(),
  eventType: notificationEventTypeSchema,
  entityType: notificationEntityTypeSchema,
  entityId: z.number().int(),
  changeType: notificationChangeTypeSchema,
  summary: z.string(),
  details: z.record(z.string(), z.unknown()).nullable(),
  actorUserId: z.number().int(),
  actorUsername: z.string(),
  createdAt: z.string(),
  status: notificationRecipientStatusSchema,
  readAt: z.string().nullable(),
  dismissedAt: z.string().nullable(),
});

export const notificationListQuerySchema = z.object({
  includeRead: booleanFromQueryParam.optional().default(false),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const notificationPageSchema = z.object({
  items: z.array(notificationItemSchema),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  totalItems: z.number().int().nonnegative(),
  hasNext: z.boolean(),
});

export const unreadNotificationCountSchema = z.object({
  count: z.number().int().nonnegative(),
});

export const notificationBulkActionResultSchema = z.object({
  updatedCount: z.number().int().nonnegative(),
});

export type NotificationItem = z.infer<typeof notificationItemSchema>;
export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;
export type NotificationPage = z.infer<typeof notificationPageSchema>;
export type UnreadNotificationCount = z.infer<
  typeof unreadNotificationCountSchema
>;
export type NotificationBulkActionResult = z.infer<
  typeof notificationBulkActionResultSchema
>;
