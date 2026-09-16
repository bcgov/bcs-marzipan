import { Test, TestingModule } from '@nestjs/testing';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApplicationSettingsService } from '../locks/application-settings.service';
import { ActivityReminderJobService } from './activity-reminder-job.service';
import { ActivityReminderSettingsController } from './activity-reminder-settings.controller';

describe('ActivityReminderSettingsController', () => {
  let controller: ActivityReminderSettingsController;

  const applicationSettings = {
    getActivityReminderSettings: vi.fn().mockResolvedValue({
      leadDays: 7,
      staleDays: 14,
    }),
    setActivityReminderSettings: vi.fn().mockResolvedValue(undefined),
  };

  const reminderJob = {
    previewBatch: vi.fn().mockResolvedValue({
      reminderPostDated: 1,
      reminderDateStatusNotConfirmed: 2,
      reminderNullTime: 3,
      reminderTimeStatusNotConfirmed: 4,
      reminderUpcoming: 5,
      reminderStale: 6,
    }),
    runBatch: vi.fn().mockResolvedValue({
      sent: 3,
      skipped: false,
      counts: {
        reminderPostDated: 0,
        reminderDateStatusNotConfirmed: 1,
        reminderNullTime: 0,
        reminderTimeStatusNotConfirmed: 1,
        reminderUpcoming: 0,
        reminderStale: 1,
      },
    }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivityReminderSettingsController],
      providers: [
        {
          provide: ApplicationSettingsService,
          useValue: applicationSettings,
        },
        {
          provide: ActivityReminderJobService,
          useValue: reminderJob,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(ActivityReminderSettingsController);
  });

  it('returns current reminder settings', async () => {
    const result = await controller.getSettings();

    expect(result).toEqual({
      success: true,
      data: {
        leadDays: 7,
        staleDays: 14,
      },
    });
  });

  it('updates reminder settings', async () => {
    const result = await controller.patchSettings({
      leadDays: 5,
      staleDays: 10,
    });

    expect(
      applicationSettings.setActivityReminderSettings
    ).toHaveBeenCalledWith({
      leadDays: 5,
      staleDays: 10,
    });
    expect(result).toEqual({
      success: true,
      data: {
        leadDays: 5,
        staleDays: 10,
      },
    });
  });

  it('returns preview counts', async () => {
    const result = await controller.previewRun();

    expect(result.success).toBe(true);
    expect(reminderJob.previewBatch).toHaveBeenCalled();
  });

  it('runs reminder job manually', async () => {
    const result = await controller.runNow();

    expect(result.success).toBe(true);
    expect(reminderJob.runBatch).toHaveBeenCalled();
  });
});
