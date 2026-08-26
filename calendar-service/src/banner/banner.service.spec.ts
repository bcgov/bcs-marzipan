import { describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_RECURRING_LOCKOUT_ACTIVE_CONTENT,
  DEFAULT_RECURRING_LOCKOUT_LEAD_CONTENT,
} from '@corpcal/shared';

import { ActivitiesGateway } from '../activities/activities.gateway';
import { DatabaseService } from '../database/database.service';
import { ApplicationSettingsService } from '../locks/application-settings.service';
import { BannerService } from './banner.service';

describe('BannerService', () => {
  const baseRow = {
    id: 1,
    isActive: true,
    leadContent: DEFAULT_RECURRING_LOCKOUT_LEAD_CONTENT,
    activeContent: DEFAULT_RECURRING_LOCKOUT_ACTIVE_CONTENT,
    backgroundColor: '#F4A261',
    textColor: '#1A1A1A',
    variant: 'warning',
    startTimeOfDay: '14:00',
    endTimeOfDay: '16:00',
    bannerLeadMinutes: 20,
    editCountdownLeadMinutes: 3,
    createdDateTime: new Date('2026-08-05T18:00:00.000Z'),
    lastUpdatedDateTime: new Date('2026-08-05T18:00:00.000Z'),
  };

  const mockDatabaseService = {
    db: {
      select: vi.fn(),
    },
  } as unknown as DatabaseService;

  const mockGateway = {
    broadcastSystemBannerSettingsUpdated: vi.fn(),
    broadcastRecurringLockoutBannerSettingsUpdated: vi.fn(),
  } as unknown as ActivitiesGateway;

  const mockApplicationSettings = {
    getLookAheadReportCoverContact: vi.fn().mockResolvedValue({
      contactPhone: '',
      contactEmail: 'gcpe@example.com',
    }),
  } as unknown as ApplicationSettingsService;

  const service = new BannerService(
    mockDatabaseService,
    mockGateway,
    mockApplicationSettings
  );

  it('returns null before the lead-time window starts', async () => {
    vi.spyOn(
      service as unknown as {
        getLatestRecurringLockoutBannerRow: () => Promise<
          typeof baseRow | null
        >;
      },
      'getLatestRecurringLockoutBannerRow'
    ).mockResolvedValue(baseRow);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T20:39:00.000Z'));

    const result = await service.getActiveRecurringLockoutBanner();

    expect(result).toBeNull();
    vi.useRealTimers();
  });

  it('returns resolved lead-up copy during the warning window', async () => {
    vi.spyOn(
      service as unknown as {
        getLatestRecurringLockoutBannerRow: () => Promise<
          typeof baseRow | null
        >;
      },
      'getLatestRecurringLockoutBannerRow'
    ).mockResolvedValue(baseRow);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T20:40:00.000Z'));

    const result = await service.getActiveRecurringLockoutBanner();

    expect(result).not.toBeNull();
    expect(result?.phase).toBe('lead-up');
    expect(result?.content).toBe(
      'Updates to activities will be locked 2:00 pm - 4:00 pm PT. Please make updates before lockout begins.'
    );
    vi.useRealTimers();
  });

  it('returns resolved active copy during the lockout window', async () => {
    vi.spyOn(
      service as unknown as {
        getLatestRecurringLockoutBannerRow: () => Promise<
          typeof baseRow | null
        >;
      },
      'getLatestRecurringLockoutBannerRow'
    ).mockResolvedValue(baseRow);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T21:00:00.000Z'));

    const result = await service.getActiveRecurringLockoutBanner();

    expect(result).not.toBeNull();
    expect(result?.phase).toBe('active');
    expect(result?.content).toBe(
      'Updates to activities are locked out until 4:00 pm PT. Contact <a href="mailto:gcpe@example.com">gcpe@example.com</a> to make emerging or urgent updates.'
    );
    vi.useRealTimers();
  });

  it('returns null at end boundary because end time is exclusive', async () => {
    vi.spyOn(
      service as unknown as {
        getLatestRecurringLockoutBannerRow: () => Promise<
          typeof baseRow | null
        >;
      },
      'getLatestRecurringLockoutBannerRow'
    ).mockResolvedValue(baseRow);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T23:00:00.000Z'));

    const result = await service.getActiveRecurringLockoutBanner();

    expect(result).toBeNull();
    vi.useRealTimers();
  });
});
