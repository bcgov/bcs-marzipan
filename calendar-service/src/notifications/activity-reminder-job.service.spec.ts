import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { DatabaseService } from '../database/database.service';
import { ApplicationSettingsService } from '../locks/application-settings.service';
import { ActivityReminderJobService } from './activity-reminder-job.service';
import { NotificationsService } from './notifications.service';

describe('ActivityReminderJobService', () => {
  let service: ActivityReminderJobService;
  let databaseService: {
    db: { transaction: ReturnType<typeof vi.fn> };
  };

  const applicationSettings = {
    getActivityReminderSettings: vi.fn().mockResolvedValue({
      leadDays: 7,
      staleDays: 14,
    }),
  };

  const notificationsService = {
    notifyActivityReminderPostDated: vi
      .fn()
      .mockImplementation(({ deferredSideEffects }) => {
        deferredSideEffects?.push({
          recipientUserIds: [1],
          eventType: 'calendar.activity.reminder.post_dated',
          entityType: 'activity',
          entityId: 11,
          summary: 'Reminder',
          details: null,
          actorUserId: 999,
        });
        return Promise.resolve([1]);
      }),
    notifyActivityReminderDateStatusNotConfirmed: vi
      .fn()
      .mockResolvedValue([2]),
    notifyActivityReminderNullTime: vi.fn().mockResolvedValue([3]),
    notifyActivityReminderTimeStatusNotConfirmed: vi
      .fn()
      .mockResolvedValue([4]),
    notifyActivityReminderUpcoming: vi.fn().mockResolvedValue([5]),
    notifyActivityReminderStale: vi.fn().mockResolvedValue([6]),
    deliverPendingNotificationSideEffects: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const mockTx = {
      execute: vi.fn().mockResolvedValue([{ acquired: true }]),
    };
    databaseService = {
      db: {
        transaction: vi
          .fn()
          .mockImplementation((fn: (tx: unknown) => unknown) =>
            Promise.resolve(fn(mockTx))
          ),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityReminderJobService,
        {
          provide: ApplicationSettingsService,
          useValue: applicationSettings,
        },
        {
          provide: NotificationsService,
          useValue: notificationsService,
        },
        {
          provide: DatabaseService,
          useValue: databaseService,
        },
      ],
    }).compile();

    service = module.get(ActivityReminderJobService);
  });

  it('returns in_flight when a batch is already running', async () => {
    (service as unknown as { inFlight: boolean }).inFlight = true;

    const result = await service.runBatch();

    expect(result).toEqual({
      sent: 0,
      skipped: true,
      skipReason: 'in_flight',
      counts: {
        reminderPostDated: 0,
        reminderDateStatusNotConfirmed: 0,
        reminderNullTime: 0,
        reminderTimeStatusNotConfirmed: 0,
        reminderUpcoming: 0,
        reminderStale: 0,
      },
    });
  });

  it('sends reminder notifications for each candidate bucket', async () => {
    vi.spyOn(service as any, 'findPostDatedCandidateIds').mockResolvedValue([
      11,
    ]);
    vi.spyOn(
      service as any,
      'findDateStatusNotConfirmedCandidateIds'
    ).mockResolvedValue([12]);
    vi.spyOn(service as any, 'findNullTimeCandidateIds').mockResolvedValue([
      13,
    ]);
    vi.spyOn(
      service as any,
      'findTimeStatusNotConfirmedCandidateIds'
    ).mockResolvedValue([14]);
    vi.spyOn(service as any, 'findUpcomingCandidateIds').mockResolvedValue([
      15,
    ]);
    vi.spyOn(service as any, 'findStaleCandidateIds').mockResolvedValue([16]);
    vi.spyOn(service as any, 'filterAlreadyReminded')
      .mockResolvedValueOnce([11])
      .mockResolvedValueOnce([12])
      .mockResolvedValueOnce([13])
      .mockResolvedValueOnce([14])
      .mockResolvedValueOnce([15])
      .mockResolvedValueOnce([16]);

    const result = await service.runBatch();

    expect(result.skipped).toBe(false);
    expect(result.sent).toBe(6);
    expect(
      applicationSettings.getActivityReminderSettings
    ).toHaveBeenCalledWith(
      expect.objectContaining({ execute: expect.any(Function) })
    );
    expect(result.counts).toEqual({
      reminderPostDated: 1,
      reminderDateStatusNotConfirmed: 1,
      reminderNullTime: 1,
      reminderTimeStatusNotConfirmed: 1,
      reminderUpcoming: 1,
      reminderStale: 1,
    });

    expect(
      notificationsService.deliverPendingNotificationSideEffects
    ).toHaveBeenCalledTimes(1);
    expect(
      notificationsService.notifyActivityReminderPostDated
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        activityId: 11,
        deferredSideEffects: expect.any(Array),
      })
    );
    expect(
      notificationsService.notifyActivityReminderDateStatusNotConfirmed
    ).toHaveBeenCalledWith(
      expect.objectContaining({ activityId: 12, leadDays: 7 })
    );
    expect(
      notificationsService.notifyActivityReminderNullTime
    ).toHaveBeenCalledWith(
      expect.objectContaining({ activityId: 13, leadDays: 7 })
    );
    expect(
      notificationsService.notifyActivityReminderTimeStatusNotConfirmed
    ).toHaveBeenCalledWith(
      expect.objectContaining({ activityId: 14, leadDays: 7 })
    );
    expect(
      notificationsService.notifyActivityReminderUpcoming
    ).toHaveBeenCalledWith(
      expect.objectContaining({ activityId: 15, leadDays: 7 })
    );
    expect(
      notificationsService.notifyActivityReminderStale
    ).toHaveBeenCalledWith(
      expect.objectContaining({ activityId: 16, staleDays: 14 })
    );
  });

  it('returns advisory_lock when another pod holds the reminder lock', async () => {
    databaseService.db.transaction.mockImplementationOnce(
      (fn: (tx: unknown) => unknown) =>
        Promise.resolve(
          fn({ execute: vi.fn().mockResolvedValue([{ acquired: false }]) })
        )
    );

    const result = await service.runBatch();

    expect(result).toEqual({
      sent: 0,
      skipped: true,
      skipReason: 'advisory_lock',
      counts: {
        reminderPostDated: 0,
        reminderDateStatusNotConfirmed: 0,
        reminderNullTime: 0,
        reminderTimeStatusNotConfirmed: 0,
        reminderUpcoming: 0,
        reminderStale: 0,
      },
    });
    expect(
      applicationSettings.getActivityReminderSettings
    ).not.toHaveBeenCalled();
    expect(
      notificationsService.deliverPendingNotificationSideEffects
    ).not.toHaveBeenCalled();
  });

  it('returns error when settings load fails', async () => {
    const errorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    applicationSettings.getActivityReminderSettings.mockRejectedValueOnce(
      new Error('boom')
    );

    try {
      const result = await service.runBatch();
      expect(result).toEqual({
        sent: 0,
        skipped: true,
        skipReason: 'error',
        counts: {
          reminderPostDated: 0,
          reminderDateStatusNotConfirmed: 0,
          reminderNullTime: 0,
          reminderTimeStatusNotConfirmed: 0,
          reminderUpcoming: 0,
          reminderStale: 0,
        },
      });
      expect(
        notificationsService.deliverPendingNotificationSideEffects
      ).not.toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
    }
  });
});
