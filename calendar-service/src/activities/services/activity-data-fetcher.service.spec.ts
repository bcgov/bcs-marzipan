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

    it('returns Map with null for activities with no lead organization', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      });

      const result = await service.fetchLeadMinistryAbbreviationsForActivities([
        1, 2,
      ]);

      expect(result.size).toBe(2);
      expect(result.get(1)).toBeNull();
      expect(result.get(2)).toBeNull();
    });

    it('returns Map with abbreviation when activities have a lead organization', async () => {
      const junctionRows = [
        { activityId: 1, abbreviation: 'ABC' },
        { activityId: 2, abbreviation: 'ABC' },
      ];
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(junctionRows),
      });

      const result = await service.fetchLeadMinistryAbbreviationsForActivities([
        1, 2,
      ]);

      expect(result.size).toBe(2);
      expect(result.get(1)).toBe('ABC');
      expect(result.get(2)).toBe('ABC');
    });

    it('returns null for activities missing from junction results', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      });

      const result = await service.fetchLeadMinistryAbbreviationsForActivities([
        1,
      ]);

      expect(result.size).toBe(1);
      expect(result.get(1)).toBeNull();
    });
  });
});
