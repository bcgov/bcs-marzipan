import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ActivitiesGateway } from '../activities/activities.gateway';
import { DatabaseService } from '../database/database.service';
import { NotificationEmailService } from './notification-email.service';
import { NotificationsService } from './notifications.service';

type NotificationsQueryBuilderMock = {
  select: ReturnType<typeof vi.fn>;
  from: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
};

function hasActiveRecipientPredicate(condition: unknown): boolean {
  const visited = new Set<object>();

  const visit = (value: unknown): boolean => {
    if (!value || typeof value !== 'object') return false;
    if (visited.has(value)) return false;
    visited.add(value);

    const current = value as { name?: unknown; queryChunks?: unknown[] };
    if (current.name === 'is_active') {
      return true;
    }

    if (Array.isArray(current.queryChunks)) {
      for (const chunk of current.queryChunks) {
        if (visit(chunk)) {
          return true;
        }
      }
    }

    return false;
  };

  return visit(condition);
}

describe('NotificationsService', () => {
  const sendNotificationEventEmail = vi.fn().mockResolvedValue(undefined);
  const mockDatabaseService = {
    db: {
      select: vi.fn(),
      from: vi.fn(),
      where: vi.fn(),
    },
  } as unknown as DatabaseService & { db: NotificationsQueryBuilderMock };
  const mockGateway = {
    notifyNotificationsChanged: vi.fn(),
  } as unknown as ActivitiesGateway;
  const mockEmailService = {
    sendNotificationEventEmail,
  } as unknown as NotificationEmailService;

  let service: NotificationsService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDatabaseService.db.select.mockReturnThis();
    mockDatabaseService.db.from.mockReturnThis();
    mockDatabaseService.db.where.mockResolvedValue([
      {
        userId: 7,
        email: 'user7@gov.bc.ca',
        displayName: 'User Seven',
      },
    ]);

    service = new NotificationsService(
      mockDatabaseService,
      mockGateway,
      mockEmailService
    );
  });

  it('includes inactive recipients only when explicitly requested', async () => {
    vi.spyOn(service as any, 'resolveActorUsername').mockResolvedValue('Admin');

    await (service as any).deliverNotificationSideEffects({
      recipientUserIds: [7],
      eventType: 'calendar.user.updated',
      entityType: 'user',
      entityId: 7,
      summary: 'User account deactivated',
      details: {
        userId: 7,
        changedFields: ['isActive'],
        isActive: false,
      },
      actorUserId: 1,
      includeInactiveRecipients: true,
    });

    expect(
      hasActiveRecipientPredicate(mockDatabaseService.db.where.mock.calls[0][0])
    ).toBe(false);
    expect(sendNotificationEventEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        summary: 'User account deactivated',
        recipients: [
          {
            userId: 7,
            email: 'user7@gov.bc.ca',
            displayName: 'User Seven',
          },
        ],
      })
    );
  });

  it('excludes inactive recipients by default', async () => {
    vi.spyOn(service as any, 'resolveActorUsername').mockResolvedValue('Admin');

    await (service as any).deliverNotificationSideEffects({
      recipientUserIds: [7],
      eventType: 'calendar.user.updated',
      entityType: 'user',
      entityId: 7,
      summary: 'User account updated',
      details: {
        userId: 7,
        changedFields: ['roleId'],
      },
      actorUserId: 1,
    });

    expect(
      hasActiveRecipientPredicate(mockDatabaseService.db.where.mock.calls[0][0])
    ).toBe(true);
    expect(sendNotificationEventEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        summary: 'User account updated',
        recipients: [
          {
            userId: 7,
            email: 'user7@gov.bc.ca',
            displayName: 'User Seven',
          },
        ],
      })
    );
  });
});
