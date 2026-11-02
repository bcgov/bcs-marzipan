/** Notification wire/event constants (no schema imports — safe for Zod modules). */

export const NOTIFICATION_EVENT_TYPES = {
  CALENDAR_ACTIVITY_CREATE: 'calendar.activity.create',
  CALENDAR_ACTIVITY_UPDATED: 'calendar.activity.updated',
  CALENDAR_ACTIVITY_STATUS_CHANGED: 'calendar.activity.status_changed',
  CALENDAR_ACTIVITY_SHARED_WITH_TEAM: 'calendar.activity.shared_with_team',
  CALENDAR_ACTIVITY_REMINDER_POST_DATED:
    'calendar.activity.reminder_post_dated',
  CALENDAR_ACTIVITY_REMINDER_DATESTATUS_NOT_CONFIRMED:
    'calendar.activity.reminder_datestatus_not_confirmed',
  CALENDAR_ACTIVITY_REMINDER_NULL_TIME: 'calendar.activity.reminder_null_time',
  CALENDAR_ACTIVITY_REMINDER_TIMESTATUS_NOT_CONFIRMED:
    'calendar.activity.reminder_timestatus_not_confirmed',
  CALENDAR_ACTIVITY_REMINDER_UPCOMING: 'calendar.activity.reminder_upcoming',
  CALENDAR_ACTIVITY_REMINDER_STALE: 'calendar.activity.reminder_stale',
  CALENDAR_ACTIVITY_HARD_DELETED: 'calendar.activity.hard_deleted',
  CALENDAR_ACTIVITY_NOTE_ADDED: 'calendar.activity.note_added',
  CALENDAR_ACTIVITY_FLAG_ASSIGNMENT_CHANGED:
    'calendar.activity.flag_assignment_changed',
  CALENDAR_ACTIVITIES_TRANSFERRED: 'calendar.activities.transferred',
  CALENDAR_USER_CREATED: 'calendar.user.created',
  CALENDAR_USER_UPDATED: 'calendar.user.updated',
  CALENDAR_TEAM_MEMBER_ADDED: 'calendar.team.member_added',
  CALENDAR_TEAM_UPDATED: 'calendar.team.updated',
} as const;

export const NOTIFICATION_ENTITY_TYPES = {
  ACTIVITY: 'activity',
  TEAM: 'team',
  USER: 'user',
} as const;

export const NOTIFICATION_CHANGE_TYPES = {
  CREATE: 'create',
  UPDATED: 'updated',
  REMINDER: 'reminder',
  SHARED_WITH_UPDATED: 'shared_with_updated',
  STATUS_CHANGED: 'status_changed',
  HARD_DELETED: 'hard_deleted',
  NOTE_ADDED: 'note_added',
  FLAG_ASSIGNMENT_CHANGED: 'flag_assignment_changed',
  TRANSFERRED: 'transferred',
  TEAM_MEMBER_ADDED: 'team_member_added',
} as const;

export const NOTIFICATION_RECIPIENT_STATUSES = {
  UNREAD: 'unread',
  READ: 'read',
  DISMISSED: 'dismissed',
} as const;

/** User-facing groupings of event types used for per-user notification preferences. */
export const NOTIFICATION_PREFERENCE_CATEGORIES = {
  ACTIVITY_LIFECYCLE: 'activity_lifecycle',
  ACTIVITY_UPDATES: 'activity_updates',
  ACTIVITY_SHARING: 'activity_sharing',
  ACTIVITY_REMINDERS: 'activity_reminders',
  ACTIVITY_REMOVAL: 'activity_removal',
  USERS_AND_TEAMS: 'users_and_teams',
} as const;

type NotificationPreferenceCategoryValue =
  (typeof NOTIFICATION_PREFERENCE_CATEGORIES)[keyof typeof NOTIFICATION_PREFERENCE_CATEGORIES];
type NotificationEventTypeValue =
  (typeof NOTIFICATION_EVENT_TYPES)[keyof typeof NOTIFICATION_EVENT_TYPES];

/** Display order, labels, and descriptions for the preferences UI. */
export const NOTIFICATION_PREFERENCE_CATEGORY_OPTIONS: ReadonlyArray<{
  category: NotificationPreferenceCategoryValue;
  label: string;
  description: string;
}> = [
  {
    category: NOTIFICATION_PREFERENCE_CATEGORIES.ACTIVITY_LIFECYCLE,
    label: 'New activities & status changes',
    description:
      'When activities you follow are created or their status changes.',
  },
  {
    category: NOTIFICATION_PREFERENCE_CATEGORIES.ACTIVITY_UPDATES,
    label: 'Activity edits & notes',
    description:
      'When activities you follow are edited or have notes added to them.',
  },
  {
    category: NOTIFICATION_PREFERENCE_CATEGORIES.ACTIVITY_SHARING,
    label: 'Sharing & review flags',
    description:
      'When activities are shared with your team or you are assigned or unassigned as a reviewer.',
  },
  {
    category: NOTIFICATION_PREFERENCE_CATEGORIES.ACTIVITY_REMINDERS,
    label: 'Reminders',
    description:
      'Upcoming, stale, post-dated, and unconfirmed date or time reminders.',
  },
  {
    category: NOTIFICATION_PREFERENCE_CATEGORIES.ACTIVITY_REMOVAL,
    label: 'Deletions & transfers',
    description: 'When activities are permanently deleted or transferred.',
  },
  {
    category: NOTIFICATION_PREFERENCE_CATEGORIES.USERS_AND_TEAMS,
    label: 'Users & teams',
    description:
      'Account changes, new users, team membership, and team updates.',
  },
];

export const NOTIFICATION_EVENT_TYPE_PREFERENCE_CATEGORY: Record<
  NotificationEventTypeValue,
  NotificationPreferenceCategoryValue
> = {
  [NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_CREATE]:
    NOTIFICATION_PREFERENCE_CATEGORIES.ACTIVITY_LIFECYCLE,
  [NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_STATUS_CHANGED]:
    NOTIFICATION_PREFERENCE_CATEGORIES.ACTIVITY_LIFECYCLE,
  [NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_UPDATED]:
    NOTIFICATION_PREFERENCE_CATEGORIES.ACTIVITY_UPDATES,
  [NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_NOTE_ADDED]:
    NOTIFICATION_PREFERENCE_CATEGORIES.ACTIVITY_UPDATES,
  [NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_SHARED_WITH_TEAM]:
    NOTIFICATION_PREFERENCE_CATEGORIES.ACTIVITY_SHARING,
  [NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_FLAG_ASSIGNMENT_CHANGED]:
    NOTIFICATION_PREFERENCE_CATEGORIES.ACTIVITY_SHARING,
  [NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_REMINDER_POST_DATED]:
    NOTIFICATION_PREFERENCE_CATEGORIES.ACTIVITY_REMINDERS,
  [NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_REMINDER_DATESTATUS_NOT_CONFIRMED]:
    NOTIFICATION_PREFERENCE_CATEGORIES.ACTIVITY_REMINDERS,
  [NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_REMINDER_NULL_TIME]:
    NOTIFICATION_PREFERENCE_CATEGORIES.ACTIVITY_REMINDERS,
  [NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_REMINDER_TIMESTATUS_NOT_CONFIRMED]:
    NOTIFICATION_PREFERENCE_CATEGORIES.ACTIVITY_REMINDERS,
  [NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_REMINDER_UPCOMING]:
    NOTIFICATION_PREFERENCE_CATEGORIES.ACTIVITY_REMINDERS,
  [NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_REMINDER_STALE]:
    NOTIFICATION_PREFERENCE_CATEGORIES.ACTIVITY_REMINDERS,
  [NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITY_HARD_DELETED]:
    NOTIFICATION_PREFERENCE_CATEGORIES.ACTIVITY_REMOVAL,
  [NOTIFICATION_EVENT_TYPES.CALENDAR_ACTIVITIES_TRANSFERRED]:
    NOTIFICATION_PREFERENCE_CATEGORIES.ACTIVITY_REMOVAL,
  [NOTIFICATION_EVENT_TYPES.CALENDAR_USER_CREATED]:
    NOTIFICATION_PREFERENCE_CATEGORIES.USERS_AND_TEAMS,
  [NOTIFICATION_EVENT_TYPES.CALENDAR_USER_UPDATED]:
    NOTIFICATION_PREFERENCE_CATEGORIES.USERS_AND_TEAMS,
  [NOTIFICATION_EVENT_TYPES.CALENDAR_TEAM_MEMBER_ADDED]:
    NOTIFICATION_PREFERENCE_CATEGORIES.USERS_AND_TEAMS,
  [NOTIFICATION_EVENT_TYPES.CALENDAR_TEAM_UPDATED]:
    NOTIFICATION_PREFERENCE_CATEGORIES.USERS_AND_TEAMS,
};

/** Returns the preference category for an event type, or null when unmapped. */
export function getNotificationPreferenceCategory(
  eventType: string
): NotificationPreferenceCategoryValue | null {
  return (
    (
      NOTIFICATION_EVENT_TYPE_PREFERENCE_CATEGORY as Record<
        string,
        NotificationPreferenceCategoryValue
      >
    )[eventType] ?? null
  );
}
