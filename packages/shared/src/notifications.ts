import {
  NOTIFICATION_CHANGE_TYPES,
  NOTIFICATION_ENTITY_TYPES,
  NOTIFICATION_EVENT_TYPES,
  NOTIFICATION_RECIPIENT_STATUSES,
} from './notification-constants';

export {
  NOTIFICATION_CHANGE_TYPES,
  NOTIFICATION_ENTITY_TYPES,
  NOTIFICATION_EVENT_TYPES,
  NOTIFICATION_RECIPIENT_STATUSES,
};

export type NotificationEventType =
  (typeof NOTIFICATION_EVENT_TYPES)[keyof typeof NOTIFICATION_EVENT_TYPES];

export type NotificationEntityType =
  (typeof NOTIFICATION_ENTITY_TYPES)[keyof typeof NOTIFICATION_ENTITY_TYPES];

export type NotificationChangeType =
  (typeof NOTIFICATION_CHANGE_TYPES)[keyof typeof NOTIFICATION_CHANGE_TYPES];

export type NotificationRecipientStatus =
  (typeof NOTIFICATION_RECIPIENT_STATUSES)[keyof typeof NOTIFICATION_RECIPIENT_STATUSES];

export interface CanonicalNotificationEventShape {
  eventType: NotificationEventType;
  entityType: NotificationEntityType;
  entityId: number;
  changeType: NotificationChangeType;
  summary: string;
  details: Record<string, unknown> | null;
  actor: {
    userId: number;
    username: string;
  };
  timestamp: string;
}
