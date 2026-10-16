import {
  getNotificationPreferenceCategory,
  NOTIFICATION_CHANGE_TYPES,
  NOTIFICATION_ENTITY_TYPES,
  NOTIFICATION_EVENT_TYPE_PREFERENCE_CATEGORY,
  NOTIFICATION_EVENT_TYPES,
  NOTIFICATION_PREFERENCE_CATEGORIES,
  NOTIFICATION_PREFERENCE_CATEGORY_OPTIONS,
  NOTIFICATION_RECIPIENT_STATUSES,
} from './notification-constants';

export {
  getNotificationPreferenceCategory,
  NOTIFICATION_CHANGE_TYPES,
  NOTIFICATION_ENTITY_TYPES,
  NOTIFICATION_EVENT_TYPE_PREFERENCE_CATEGORY,
  NOTIFICATION_EVENT_TYPES,
  NOTIFICATION_PREFERENCE_CATEGORIES,
  NOTIFICATION_PREFERENCE_CATEGORY_OPTIONS,
  NOTIFICATION_RECIPIENT_STATUSES,
};

export type NotificationPreferenceCategory =
  (typeof NOTIFICATION_PREFERENCE_CATEGORIES)[keyof typeof NOTIFICATION_PREFERENCE_CATEGORIES];

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
