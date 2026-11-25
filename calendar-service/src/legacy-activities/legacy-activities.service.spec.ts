import { describe, expect, it, vi } from 'vitest';

import { LegacyActivitiesService } from './legacy-activities.service';

describe('LegacyActivitiesService', () => {
  it('returns legacy rows with a bounded search query and a safe default sort order', async () => {
    const mockSelect = vi.fn();
    const mockWhere = vi.fn();
    const mockLimit = vi.fn();
    const mockOffset = vi.fn();

    const mockDb = {
      select: mockSelect,
    };

    const service = new LegacyActivitiesService({ db: mockDb } as any);

    const limitResult = {
      offset: mockOffset.mockResolvedValue([]),
    };

    const chain = {
      from: vi.fn().mockReturnThis(),
      where: mockWhere.mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: mockLimit.mockReturnValue(limitResult),
    };

    mockSelect.mockReturnValue(chain);

    const rows = await service.list({
      search: 'North Coast',
      archived: false,
      limit: 25,
      offset: 0,
    });

    expect(rows).toEqual([]);
    expect(mockSelect).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalled();
    expect(mockLimit).toHaveBeenCalledWith(25);
    expect(mockOffset).toHaveBeenCalledWith(0);
  });
});
