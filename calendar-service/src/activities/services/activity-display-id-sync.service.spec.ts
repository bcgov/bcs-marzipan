import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ActivityDisplayIdSyncService } from './activity-display-id-sync.service';
import { ActivityUtilsService } from './activity-utils.service';

describe('ActivityDisplayIdSyncService', () => {
  let service: ActivityDisplayIdSyncService;
  const utilsService = new ActivityUtilsService({} as never);
  const activityHistoryService = {
    recordDisplayIdChangeBatch: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ActivityDisplayIdSyncService(
      {} as never,
      utilsService,
      activityHistoryService as never
    );
  });

  describe('refreshAfterOrganizationAbbreviationChange', () => {
    it('is a no-op (displayId prefix is lead team only)', async () => {
      const result = await service.refreshAfterOrganizationAbbreviationChange(
        {} as never,
        1,
        1
      );
      expect(result.updatedCount).toBe(0);
    });
  });

  describe('refreshAfterTeamAbbreviationChange', () => {
    it('updates activities whose computed displayId differs and records history', async () => {
      const stub = {
        tx: {
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([
                  {
                    id: 100,
                    displayId: 'OLD-000100',
                    teamAbbreviation: 'NEW',
                  },
                ]),
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(undefined),
            }),
          }),
        },
      };

      const result = await service.refreshAfterTeamAbbreviationChange(
        stub.tx as never,
        3,
        1
      );

      expect(result.updatedCount).toBe(1);
      expect(
        activityHistoryService.recordDisplayIdChangeBatch
      ).toHaveBeenCalled();
      const args =
        activityHistoryService.recordDisplayIdChangeBatch.mock.calls[0][1];
      expect(args.notes).toMatch(/team abbreviation/);
    });
  });
});
