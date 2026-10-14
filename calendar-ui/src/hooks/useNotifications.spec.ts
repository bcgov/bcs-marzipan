import { describe, expect, it } from 'vitest';

import type { NotificationPage } from '@corpcal/shared/api/types';

import {
  applyOptimisticDismiss,
  applyOptimisticDismissAll,
  applyOptimisticMarkAllRead,
  applyOptimisticMarkRead,
} from './useNotifications';

function buildPage(): NotificationPage {
  return {
    items: [
      {
        recipientId: 101,
        eventId: 1,
        eventType: 'calendar.activity.create',
        entityType: 'activity',
        entityId: 11,
        changeType: 'create',
        summary: 'Unread item',
        details: null,
        actorUserId: 7,
        actorUsername: 'actor',
        createdAt: new Date().toISOString(),
        status: 'unread',
        readAt: null,
        dismissedAt: null,
      },
      {
        recipientId: 102,
        eventId: 2,
        eventType: 'calendar.activity.create',
        entityType: 'activity',
        entityId: 12,
        changeType: 'status_changed',
        summary: 'Read item',
        details: null,
        actorUserId: 8,
        actorUsername: 'actor2',
        createdAt: new Date().toISOString(),
        status: 'read',
        readAt: new Date().toISOString(),
        dismissedAt: null,
      },
    ],
    page: 1,
    pageSize: 20,
    totalItems: 2,
    hasNext: false,
  };
}

describe('useNotifications optimistic helpers', () => {
  it('marks unread item as read', () => {
    const page = buildPage();
    const next = applyOptimisticMarkRead(page, 101, '2026-01-01T00:00:00.000Z');

    expect(next.items[0].status).toBe('read');
    expect(next.items[0].readAt).toBe('2026-01-01T00:00:00.000Z');
    expect(next.items[1].status).toBe('read');
  });

  it('dismisses one item and decrements total', () => {
    const page = buildPage();
    const next = applyOptimisticDismiss(page, 101);

    expect(next.items).toHaveLength(1);
    expect(next.items[0].recipientId).toBe(102);
    expect(next.totalItems).toBe(1);
  });

  it('marks all unread items as read', () => {
    const page = buildPage();
    const next = applyOptimisticMarkAllRead(page, '2026-01-01T00:00:00.000Z');

    expect(next.items.every((item) => item.status === 'read')).toBe(true);
  });

  it('dismisses all items and clears counts', () => {
    const page = buildPage();
    const next = applyOptimisticDismissAll(page);

    expect(next.items).toHaveLength(0);
    expect(next.totalItems).toBe(0);
    expect(next.hasNext).toBe(false);
  });
});
