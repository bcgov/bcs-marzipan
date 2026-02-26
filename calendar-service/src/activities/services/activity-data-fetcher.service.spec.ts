import { Test, TestingModule } from '@nestjs/testing';

import { DatabaseService } from '../../database/database.service';
import { ActivityDataFetcherService } from './activity-data-fetcher.service';

describe('ActivityDataFetcherService', () => {
  let service: ActivityDataFetcherService;
  let mockDb: {
    select: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockDb = {
      select: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityDataFetcherService,
        {
          provide: DatabaseService,
          useValue: { db: mockDb },
        },
      ],
    }).compile();

    service = module.get<ActivityDataFetcherService>(
      ActivityDataFetcherService
    );
  });

  describe('fetchLeadMinistryAbbreviationsForActivities', () => {
    it('returns empty Map when activityIds is empty', async () => {
      const result = await service.fetchLeadMinistryAbbreviationsForActivities(
        []
      );
      expect(result).toEqual(new Map());
      expect(mockDb.select).not.toHaveBeenCalled();
    });

    it('returns Map with null for activities with no leadMinistryId', async () => {
      const activityRows = [
        { id: 1, leadMinistryId: null },
        { id: 2, leadMinistryId: null },
      ];
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(activityRows),
      });

      const result = await service.fetchLeadMinistryAbbreviationsForActivities([
        1, 2,
      ]);

      expect(result.size).toBe(2);
      expect(result.get(1)).toBeNull();
      expect(result.get(2)).toBeNull();
    });

    it('returns Map with abbreviation when activities have leadMinistryId and ministry exists', async () => {
      const activityRows = [
        { id: 1, leadMinistryId: 10 },
        { id: 2, leadMinistryId: 10 },
      ];
      const ministryRows = [{ id: 10, abbreviation: 'ABC' }];
      mockDb.select.mockImplementation((arg: Record<string, unknown>) => {
        if (arg && 'leadMinistryId' in arg) {
          return {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue(activityRows),
          };
        }
        if (arg && 'abbreviation' in arg) {
          return {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue(ministryRows),
          };
        }
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([]),
        };
      });

      const result = await service.fetchLeadMinistryAbbreviationsForActivities([
        1, 2,
      ]);

      expect(result.size).toBe(2);
      expect(result.get(1)).toBe('ABC');
      expect(result.get(2)).toBe('ABC');
    });

    it('returns null for activity whose leadMinistryId has no matching active ministry', async () => {
      const activityRows = [{ id: 1, leadMinistryId: 99 }];
      const ministryRows: Array<{ id: number; abbreviation: string }> = [];
      mockDb.select.mockImplementation((arg: Record<string, unknown>) => {
        if (arg && 'leadMinistryId' in arg) {
          return {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue(activityRows),
          };
        }
        if (arg && 'abbreviation' in arg) {
          return {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue(ministryRows),
          };
        }
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([]),
        };
      });

      const result = await service.fetchLeadMinistryAbbreviationsForActivities([
        1,
      ]);

      expect(result.size).toBe(1);
      expect(result.get(1)).toBeNull();
    });
  });
});
