import { describe, expect, it, vi } from 'vitest';

import { ActivitiesGateway } from '../activities/activities.gateway';
import { DatabaseService } from '../database/database.service';
import { BannerService } from './banner.service';

describe('BannerService', () => {
  const baseRow = {
    id: 1,
    isActive: true,
    exemptRoleIds: [1],
    content: 'Editing lockout starts soon',
    backgroundColor: '#F4A261',
    textColor: '#1A1A1A',
    variant: 'warning',
    startTimeOfDay: '14:00',
    endTimeOfDay: '16:00',
    bannerLeadMinutes: 20,
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

  const service = new BannerService(mockDatabaseService, mockGateway);

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

  it('returns banner during lead-time window before lockout start', async () => {
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
    expect(result?.id).toBe(1);
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
