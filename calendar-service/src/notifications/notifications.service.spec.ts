import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ActivitiesGateway } from '../activities/activities.gateway';
import { DatabaseService } from '../database/database.service';
import { NotificationEmailService } from './notification-email.service';
import { NotificationPreferencesService } from './notification-preferences.service';
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
  const notifyNotificationsChanged = vi.fn();
  const mockGateway = {
    notifyNotificationsChanged,
  } as unknown as ActivitiesGateway;
  const mockEmailService = {
    sendNotificationEventEmail,
  } as unknown as NotificationEmailService;
  const resolveOptOuts = vi.fn();
  const mockPreferencesService = {
    resolveOptOuts,
  } as unknown as NotificationPreferencesService;

  let service: NotificationsService;

  beforeEach(() => {
    vi.clearAllMocks();
    resolveOptOuts.mockResolvedValue({ inApp: new Set(), email: new Set() });
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
      mockEmailService,
      mockPreferencesService
    );
  });

  describe('createEventWithRecipients preference filtering', () => {
    function createInsertExecutor() {
      const insertedRecipients: unknown[] = [];
      const executor = {
        insert: vi.fn().mockImplementation(() => ({
          values: vi.fn().mockImplementation((values: unknown) => {
            if (Array.isArray(values))
              insertedRecipients.push(...(values as unknown[]));
            return {
              returning: vi.fn().mockResolvedValue([{ id: 500 }]),
              onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
            };
          }),
        })),
      };
      return { executor, insertedRecipients };
    }

    const baseParams = {
      eventType: 'calendar.activity.reminder_upcoming',
      entityType: 'activity',
      entityId: 10,
      changeType: 'reminder',
      summary: 'Upcoming',
      details: null,
      actorUserId: 1,
    };

    beforeEach(() => {
      vi.spyOn(service as any, 'resolveActorUsername').mockResolvedValue(
        'Admin'
      );
    });

    it('excludes in-app opt-outs from inbox rows and email opt-outs from email', async () => {
      resolveOptOuts.mockResolvedValue({
        inApp: new Set([2]),
        email: new Set([3]),
      });
      const { executor, insertedRecipients } = createInsertExecutor();
      const deferred: any[] = [];

      const result = await (service as any).createEventWithRecipients({
        ...baseParams,
        recipientUserIds: [1, 2, 3, 4],
        executor,
        deferredSideEffects: deferred,
      });

      expect(resolveOptOuts).toHaveBeenCalledWith(
        'calendar.activity.reminder_upcoming',
        [2, 3, 4],
        executor
      );
      expect(result).toEqual([2, 3, 4]);
      expect(
        insertedRecipients.map((r) => (r as { userId: number }).userId)
      ).toEqual([3, 4]);
      expect(deferred[0]).toMatchObject({
        recipientUserIds: [3, 4],
        emailRecipientUserIds: [2, 4],
      });
    });

    it('persists the event but no inbox rows for email-only recipients', async () => {
      resolveOptOuts.mockResolvedValue({
        inApp: new Set([2]),
        email: new Set(),
      });
      const { executor, insertedRecipients } = createInsertExecutor();
      const deferred: any[] = [];

      const result = await (service as any).createEventWithRecipients({
        ...baseParams,
        recipientUserIds: [2],
        executor,
        deferredSideEffects: deferred,
      });

      // Event row only (needed for reminder dedupe); no notification_recipients insert.
      expect(result).toEqual([2]);
      expect(executor.insert).toHaveBeenCalledTimes(1);
      expect(insertedRecipients).toEqual([]);
      expect(deferred[0]).toMatchObject({
        recipientUserIds: [],
        emailRecipientUserIds: [2],
      });
    });

    it('does nothing when every recipient opted out of both channels', async () => {
      resolveOptOuts.mockResolvedValue({
        inApp: new Set([2]),
        email: new Set([2]),
      });
      const { executor } = createInsertExecutor();
      const deferred: any[] = [];

      const result = await (service as any).createEventWithRecipients({
        ...baseParams,
        recipientUserIds: [2],
        executor,
        deferredSideEffects: deferred,
      });

      expect(result).toEqual([]);
      expect(executor.insert).not.toHaveBeenCalled();
      expect(deferred).toHaveLength(0);
    });
  });

  it('emails only emailRecipientUserIds and skips the socket push when no in-app recipients', async () => {
    vi.spyOn(service as any, 'resolveActorUsername').mockResolvedValue('Admin');

    await (service as any).deliverNotificationSideEffects({
      recipientUserIds: [],
      emailRecipientUserIds: [7],
      eventType: 'calendar.activity.reminder_upcoming',
      entityType: 'activity',
      entityId: 10,
      summary: 'Upcoming',
      details: null,
      actorUserId: 1,
    });

    expect(notifyNotificationsChanged).not.toHaveBeenCalled();
    expect(sendNotificationEventEmail).toHaveBeenCalledTimes(1);
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
