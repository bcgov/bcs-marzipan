import { describe, expect, it } from 'vitest';

import type { NotificationItem } from '@corpcal/shared/api/types';

import { getNotificationTargetPath } from './notification-links';

function buildItem(overrides: Partial<NotificationItem>): NotificationItem {
  return {
    recipientId: 1,
    eventId: 1,
    eventType: 'calendar.activity.create',
    entityType: 'activity',
    entityId: 50,
    changeType: 'create',
    summary: 'summary',
    details: null,
    actorUserId: 1,
    actorUsername: 'actor',
    createdAt: new Date().toISOString(),
    status: 'unread',
    readAt: null,
    dismissedAt: null,
    ...overrides,
  };
}

describe('getNotificationTargetPath', () => {
  it('resolves activity notifications to activity route', () => {
    const path = getNotificationTargetPath(
      buildItem({ entityType: 'activity', entityId: 77 })
    );

    expect(path).toBe('/activity/77');
  });

  it('prefers details userId for team notifications', () => {
    const path = getNotificationTargetPath(
      buildItem({
        entityType: 'team',
        entityId: 9,
        details: { userId: 42, teamId: 9 },
      })
    );

    expect(path).toBe('/users/42');
  });

  it('falls back to details teamId when userId is absent', () => {
    const path = getNotificationTargetPath(
      buildItem({
        entityType: 'team',
        entityId: 9,
        details: { teamId: 9 },
      })
    );

    expect(path).toBe('/teams/9');
  });

  it('falls back to team entity route for team notifications', () => {
    const path = getNotificationTargetPath(
      buildItem({ entityType: 'team', entityId: 12, details: null })
    );

    expect(path).toBe('/teams/12');
  });
});
