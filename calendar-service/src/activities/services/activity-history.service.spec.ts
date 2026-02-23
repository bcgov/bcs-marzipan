import { Test, TestingModule } from '@nestjs/testing';

import { DatabaseService } from '../../database/database.service';
import { ActivityHistoryService } from './activity-history.service';

describe('ActivityHistoryService', () => {
  let service: ActivityHistoryService;
  let mockDb: {
    select: ReturnType<typeof vi.fn>;
    from: ReturnType<typeof vi.fn>;
    where: ReturnType<typeof vi.fn>;
    orderBy: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
  };

  const createMockQueryChain = (finalValue: unknown) => {
    const chain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(finalValue),
    };
    return chain;
  };

  beforeEach(async () => {
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityHistoryService,
        {
          provide: DatabaseService,
          useValue: { db: mockDb },
        },
      ],
    }).compile();

    service = module.get<ActivityHistoryService>(ActivityHistoryService);
  });

  describe('getPreviousStatusIdBeforeDelete', () => {
    it('should return oldValue from most recent delete_requested entry when changes contain activityStatusId', async () => {
      const changes = [
        {
          field: 'activityStatusId',
          oldValue: 2,
          newValue: 5,
        },
      ];
      mockDb.limit.mockResolvedValue([{ changes }]);

      const result = await service.getPreviousStatusIdBeforeDelete(1);

      expect(result).toBe(2);
    });

    it('should return oldValue from most recent soft_deleted entry', async () => {
      const changes = [
        {
          field: 'activityStatusId',
          oldValue: 3,
          newValue: 4,
        },
      ];
      mockDb.limit.mockResolvedValue([{ changes }]);

      const result = await service.getPreviousStatusIdBeforeDelete(10);

      expect(result).toBe(3);
    });

    it('should return null when no matching history entry exists', async () => {
      mockDb.limit.mockResolvedValue([]);

      const result = await service.getPreviousStatusIdBeforeDelete(1);

      expect(result).toBeNull();
    });

    it('should return null when entry exists but changes is null', async () => {
      mockDb.limit.mockResolvedValue([{ changes: null }]);

      const result = await service.getPreviousStatusIdBeforeDelete(1);

      expect(result).toBeNull();
    });

    it('should return null when entry exists but changes is not an array', async () => {
      mockDb.limit.mockResolvedValue([{ changes: {} }]);

      const result = await service.getPreviousStatusIdBeforeDelete(1);

      expect(result).toBeNull();
    });

    it('should return null when changes has no activityStatusId field', async () => {
      mockDb.limit.mockResolvedValue([
        {
          changes: [{ field: 'title', oldValue: 'Old', newValue: 'New' }],
        },
      ]);

      const result = await service.getPreviousStatusIdBeforeDelete(1);

      expect(result).toBeNull();
    });

    it('should return null when activityStatusId oldValue is not a number', async () => {
      mockDb.limit.mockResolvedValue([
        {
          changes: [
            {
              field: 'activityStatusId',
              oldValue: 'invalid',
              newValue: 5,
            },
          ],
        },
      ]);

      const result = await service.getPreviousStatusIdBeforeDelete(1);

      expect(result).toBeNull();
    });

    it('should return null when activityStatusId oldValue is null', async () => {
      mockDb.limit.mockResolvedValue([
        {
          changes: [
            {
              field: 'activityStatusId',
              oldValue: null,
              newValue: 5,
            },
          ],
        },
      ]);

      const result = await service.getPreviousStatusIdBeforeDelete(1);

      expect(result).toBeNull();
    });
  });
});
