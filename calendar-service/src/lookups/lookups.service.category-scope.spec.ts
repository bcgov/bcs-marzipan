import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ActivityDisplayIdSyncService } from '../activities/services/activity-display-id-sync.service';
import { DatabaseService } from '../database/database.service';
import { LookupsService } from './lookups.service';

describe('LookupsService category team scope', () => {
  let service: LookupsService;

  const mockTx = {
    insert: vi.fn(),
    update: vi.fn(),
    select: vi.fn(),
  };

  const mockDatabaseService: any = {
    db: {
      transaction: vi.fn((callback: (tx: typeof mockTx) => unknown) =>
        Promise.resolve(callback(mockTx))
      ),
      select: vi.fn(),
      execute: vi.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LookupsService,
        { provide: DatabaseService, useValue: mockDatabaseService },
        { provide: ActivityDisplayIdSyncService, useValue: {} },
      ],
    }).compile();

    service = module.get<LookupsService>(LookupsService);
    vi.clearAllMocks();
  });

  it('createCategory syncs team associations for team visibility', async () => {
    const categoryReturning = vi
      .fn()
      .mockResolvedValue([{ id: 42, name: 'cat', visibility: 'team' }]);
    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    mockTx.insert.mockImplementation(() => ({
      values: vi.fn().mockImplementation((payload) => {
        if ('name' in payload) {
          return { returning: categoryReturning };
        }
        return { onConflictDoUpdate };
      }),
    }));
    mockTx.update.mockReturnValue({
      set: vi
        .fn()
        .mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
    });

    await service.createCategory(
      {
        name: 'cat',
        sortOrder: 1,
        visibility: 'team',
        teamIds: [1, 2],
      },
      99
    );

    expect(mockTx.insert).toHaveBeenCalledTimes(3);
  });

  it('updateCategory rejects empty teamIds without explicit global visibility', async () => {
    mockTx.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi
            .fn()
            .mockResolvedValue([{ id: 5, visibility: 'team', name: 'cat' }]),
        }),
      }),
    });

    await expect(
      service.updateCategory(5, { teamIds: [] }, 99)
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.updateCategory(5, { teamIds: [] }, 99)
    ).rejects.toThrow(/Set visibility to "global"/);
  });

  it('updateCategory demotes to global when visibility is explicitly global', async () => {
    const updateReturning = vi
      .fn()
      .mockResolvedValue([{ id: 5, visibility: 'global', name: 'cat' }]);
    const updateWhere = vi.fn().mockReturnValue({ returning: updateReturning });
    const updateSet = vi.fn().mockReturnValue({ where: updateWhere });
    mockTx.update.mockReturnValue({ set: updateSet });
    mockTx.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi
            .fn()
            .mockResolvedValue([{ id: 5, visibility: 'team', name: 'cat' }]),
        }),
      }),
    });

    const result = await service.updateCategory(
      5,
      { visibility: 'global', teamIds: [] },
      99
    );

    expect(result?.visibility).toBe('global');
    expect(updateSet).toHaveBeenCalledWith(
      expect.objectContaining({ visibility: 'global' })
    );
  });
});
