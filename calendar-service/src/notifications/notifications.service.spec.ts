import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ActivitiesGateway } from '../activities/activities.gateway';
import { DatabaseService } from '../database/database.service';
import { NotificationEmailService } from './notification-email.service';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  const sendNotificationEventEmail = vi.fn().mockResolvedValue(undefined);
  const mockDatabaseService = {
    db: {
      select: vi.fn(),
      from: vi.fn(),
      where: vi.fn(),
    },
  } as DatabaseService;
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

  it('allows deactivation emails to reach the inactive subject user', async () => {
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

    expect(mockDatabaseService.db.where).toHaveBeenCalled();
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
});
