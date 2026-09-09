export const NOTIFICATION_EVENT_TYPES = {
  CALENDAR_ACTIVITY_CREATE: 'calendar.activity.create',
  CALENDAR_TEAM_MEMBER_ADDED: 'calendar.team.member_added',
} as const;

export const NOTIFICATION_ENTITY_TYPES = {
  ACTIVITY: 'activity',
  TEAM: 'team',
} as const;

export const NOTIFICATION_CHANGE_TYPES = {
  CREATE: 'create',
  STATUS_CHANGED: 'status_changed',
  TEAM_MEMBER_ADDED: 'team_member_added',
} as const;

export const NOTIFICATION_RECIPIENT_STATUSES = {
  UNREAD: 'unread',
  READ: 'read',
  DISMISSED: 'dismissed',
} as const;

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
