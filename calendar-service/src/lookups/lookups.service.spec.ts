import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ActivityDisplayIdSyncService } from '../activities/services/activity-display-id-sync.service';
import { DatabaseService } from '../database/database.service';
import { LookupsService } from './lookups.service';

describe('LookupsService', () => {
  let service: LookupsService;

  const createChain = (resolvedValue: unknown, terminal = 'limit') => {
    const value = Array.isArray(resolvedValue)
      ? resolvedValue
      : [resolvedValue];
    const chain: any = {
      from: vi.fn(),
      where: vi.fn(),
      orderBy: vi.fn(),
      limit: vi.fn(),
      groupBy: vi.fn(),
      innerJoin: vi.fn(),
      leftJoin: vi.fn(),
    };
    chain.from.mockReturnValue(chain);
    chain.where.mockReturnValue(chain);
    chain.orderBy.mockReturnValue(chain);
    chain.limit.mockReturnValue(chain);
    chain.groupBy.mockReturnValue(chain);
    chain.innerJoin.mockReturnValue(chain);
    chain.leftJoin.mockReturnValue(chain);
    (chain[terminal] as ReturnType<typeof vi.fn>).mockResolvedValue(value);
    return chain;
  };

  const mockDatabaseService: any = {
    db: {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue(undefined),
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

  it('inserts an audit row when toggling permission visibility', async () => {
    const permissionId = 123;
    const updatedBy = 99;

    // existing select -> returns previous value (show = false)
    mockDatabaseService.db.select = vi
      .fn()
      .mockReturnValueOnce(
        createChain([{ id: permissionId, show: false }], 'limit')
      )
      // select after update to return updated row
      .mockReturnValueOnce(
        createChain(
          [{ id: permissionId, key: 'perm.test', showInUserManagement: true }],
          'limit'
        )
      );

    // Ensure update/set/where chain exist
    mockDatabaseService.db.update = vi.fn().mockReturnThis();
    mockDatabaseService.db.set = vi.fn().mockReturnThis();
    mockDatabaseService.db.where = vi.fn().mockResolvedValue(undefined);

    // Call the method under test
    const result = await service.updatePermissionVisibility(
      permissionId,
      true,
      updatedBy
    );

    // Verify return shape
    expect(result).toMatchObject({
      id: permissionId,
      key: 'perm.test',
      showInUserManagement: true,
    });

    // Assert an insert into the audit table was attempted with expected payload
    expect(mockDatabaseService.db.insert).toHaveBeenCalled();
    expect(mockDatabaseService.db.values).toHaveBeenCalledWith(
      expect.objectContaining({
        permissionId: permissionId,
        changedBy: updatedBy,
        oldValue: false,
        newValue: true,
      })
    );
  });

  it('sorts government representatives by canonical person name before returning', async () => {
    mockDatabaseService.db.select = vi.fn().mockReturnValueOnce(
      createChain(
        [
          {
            id: 2,
            name: 'Niki Sharma',
            displayName: 'Attorney General Niki Sharma',
            title: 'Attorney General and Deputy Premier',
            ministryId: 3,
            representativeType: 'minister',
            sortOrder: 1,
            isActive: true,
          },
          {
            id: 1,
            name: 'Lana Popham',
            displayName: 'Minister Lana Popham',
            title: 'Minister of Agriculture and Food',
            ministryId: 2,
            representativeType: 'minister',
            sortOrder: 2,
            isActive: true,
          },
        ],
        'orderBy'
      )
    );

    const result = await service.getGovernmentRepresentatives();

    expect(result.map((rep) => rep.name)).toEqual([
      'Lana Popham',
      'Niki Sharma',
    ]);
  });

  it('sorts event planners by canonical person name before returning', async () => {
    mockDatabaseService.db.select = vi.fn().mockReturnValueOnce(
      createChain(
        [
          {
            id: 2,
            name: 'Sharma, Niki',
            displayName: 'Niki Sharma Events',
          },
          {
            id: 1,
            name: 'Lana Popham',
            displayName: 'Lana Popham Events',
          },
        ],
        'orderBy'
      )
    );

    const result = await service.getEventPlanners();

    expect(result.map((planner) => planner.label)).toEqual([
      'Lana Popham Events',
      'Niki Sharma Events',
    ]);
  });
});
