import { describe, expect, it } from 'vitest';

import {
  getNotificationPreferenceCategory,
  NOTIFICATION_EVENT_TYPES,
  NOTIFICATION_PREFERENCE_CATEGORIES,
  NOTIFICATION_PREFERENCE_CATEGORY_OPTIONS,
} from '../notification-constants';
import { notificationPreferencesUpdateSchema } from './notification-preferences.schema';

describe('notification preference categories', () => {
  it('maps every event type to a category', () => {
    for (const eventType of Object.values(NOTIFICATION_EVENT_TYPES)) {
      expect(getNotificationPreferenceCategory(eventType)).not.toBeNull();
    }
  });

  it('returns null for unknown event types', () => {
    expect(getNotificationPreferenceCategory('calendar.unknown')).toBeNull();
  });

  it('has a UI option for every category', () => {
    expect(
      NOTIFICATION_PREFERENCE_CATEGORY_OPTIONS.map((o) => o.category).sort()
    ).toEqual(Object.values(NOTIFICATION_PREFERENCE_CATEGORIES).sort());
  });
});

describe('notificationPreferencesUpdateSchema', () => {
  it('accepts emailEnabled only', () => {
    expect(
      notificationPreferencesUpdateSchema.parse({ emailEnabled: false })
    ).toEqual({ emailEnabled: false });
  });

  it('accepts categories only', () => {
    const body = {
      categories: [
        { category: 'activity_reminders', inApp: false, email: true },
      ],
    };
    expect(notificationPreferencesUpdateSchema.parse(body)).toEqual(body);
  });

  it('rejects empty body', () => {
    expect(() => notificationPreferencesUpdateSchema.parse({})).toThrow(
      /Provide emailEnabled and\/or categories/
    );
  });

  it('rejects unknown categories', () => {
    expect(() =>
      notificationPreferencesUpdateSchema.parse({
        categories: [{ category: 'nope', inApp: true, email: true }],
      })
    ).toThrow();
  });

  it('rejects duplicate categories', () => {
    expect(() =>
      notificationPreferencesUpdateSchema.parse({
        categories: [
          { category: 'users_and_teams', inApp: true, email: true },
          { category: 'users_and_teams', inApp: false, email: true },
        ],
      })
    ).toThrow(/only appear once/);
  });
});
