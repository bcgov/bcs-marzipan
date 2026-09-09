import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotificationEmailService } from './notification-email.service';

const sendMailMock = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const createTransportMock = vi.hoisted(() =>
  vi.fn(() => ({ sendMail: sendMailMock }))
);

vi.mock('nodemailer', () => ({
  default: {
    createTransport: createTransportMock,
  },
}));

describe('NotificationEmailService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does nothing when email notifications are disabled', async () => {
    const service = new NotificationEmailService(new ConfigService({}));

    await service.sendNotificationEventEmail({
      eventType: 'calendar.activity.create',
      entityType: 'activity',
      entityId: 7,
      summary: 'Activity created: ACT-7 - Test',
      details: null,
      actorUsername: 'actor',
      recipients: [
        { userId: 1, email: 'user1@gov.bc.ca', displayName: 'User One' },
      ],
    });

    expect(createTransportMock).not.toHaveBeenCalled();
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it('sends one email per recipient when enabled', async () => {
    const service = new NotificationEmailService(
      new ConfigService({
        NOTIFICATIONS_EMAIL_ENABLED: 'true',
        NOTIFICATIONS_EMAIL_FROM: 'calendar@gov.bc.ca',
        NOTIFICATIONS_SMTP_HOST: 'smtp.example.local',
        NOTIFICATIONS_SMTP_PORT: '2525',
      })
    );

    await service.sendNotificationEventEmail({
      eventType: 'calendar.activity.create',
      entityType: 'activity',
      entityId: 42,
      summary: 'Activity created: ACT-42 - Test',
      details: null,
      actorUsername: 'actor',
      recipients: [
        { userId: 1, email: 'user1@gov.bc.ca', displayName: 'User One' },
        { userId: 2, email: 'user2@gov.bc.ca', displayName: null },
      ],
    });

    expect(createTransportMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledTimes(2);
  });

  it('builds user deep-link for team member notification emails', async () => {
    const service = new NotificationEmailService(
      new ConfigService({
        NOTIFICATIONS_EMAIL_ENABLED: 'true',
        NOTIFICATIONS_EMAIL_FROM: 'calendar@gov.bc.ca',
        NOTIFICATIONS_SMTP_HOST: 'smtp.example.local',
        PUBLIC_APP_BASE_URL: 'https://calendar.example.gov.bc.ca',
      })
    );

    await service.sendNotificationEventEmail({
      eventType: 'calendar.team.member_added',
      entityType: 'team',
      entityId: 9,
      summary: 'User added to team',
      details: { userId: 88, teamId: 9 },
      actorUsername: 'actor',
      recipients: [
        { userId: 1, email: 'user1@gov.bc.ca', displayName: 'User One' },
      ],
    });

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock.mock.calls[0]?.[0]?.text).toContain('/users/88');
  });
});
