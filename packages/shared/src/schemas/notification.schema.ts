import { z } from 'zod';

import {
  NOTIFICATION_CHANGE_TYPES,
  NOTIFICATION_ENTITY_TYPES,
  NOTIFICATION_EVENT_TYPES,
  NOTIFICATION_RECIPIENT_STATUSES,
} from '../notifications';

const notificationEventTypeSchema = z.enum([
  NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_CREATE,
  NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_UPDATED,
  NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_STATUS_CHANGED,
  NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_SHARED_WITH_TEAM,
  NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_REMINDER_POST_DATED,
  NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_REMINDER_DATESTATUS_NOT_CONFIRMED,
  NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_REMINDER_NULL_TIME,
  NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_REMINDER_TIMESTATUS_NOT_CONFIRMED,
  NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_REMINDER_UPCOMING,
  NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_REMINDER_STALE,
  NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_HARD_DELETED,
  NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_NOTE_ADDED,
  NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_FLAG_ASSIGNMENT_CHANGED,
  NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITIES_TRANSFERRED,
  NOTIFICATION_EVENT_TYPES.CALENDAR_USER_CREATED,
  NOTIFICATION_EVENT_TYPES.CALENDAR_USER_UPDATED,
  NOTIFICATION_EVENT_TYPES.CALENDAR_TEAM_MEMBER_ADDED,
  NOTIFICATION_EVENT_TYPES.CALENDAR_TEAM_UPDATED,
]);

const notificationEntityTypeSchema = z.enum([
  NOTIFICATION_ENTITY_TYPES.ACTIVITY,
  NOTIFICATION_ENTITY_TYPES.TEAM,
  NOTIFICATION_ENTITY_TYPES.USER,
]);

const notificationChangeTypeSchema = z.enum([
  NOTIFICATION_CHANGE_TYPES.CREATE,
  NOTIFICATION_CHANGE_TYPES.UPDATED,
  NOTIFICATION_CHANGE_TYPES.REMINDER,
  NOTIFICATION_CHANGE_TYPES.SHARED_WITH_UPDATED,
  NOTIFICATION_CHANGE_TYPES.STATUS_CHANGED,
  NOTIFICATION_CHANGE_TYPES.HARD_DELETED,
  NOTIFICATION_CHANGE_TYPES.NOTE_ADDED,
  NOTIFICATION_CHANGE_TYPES.FLAG_ASSIGNMENT_CHANGED,
  NOTIFICATION_CHANGE_TYPES.TRANSFERRED,
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
