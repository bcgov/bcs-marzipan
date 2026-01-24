import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ActivityUtilsService } from './activity-utils.service';
import { DatabaseService } from '../../database/database.service';

describe('ActivityUtilsService', () => {
  let service: ActivityUtilsService;
  let mockWhere: jest.Mock;

  beforeEach(async () => {
    mockWhere = jest.fn().mockResolvedValue([{ id: 1 }]);
    const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
    const mockSelect = jest.fn().mockReturnValue({ from: mockFrom });
    const mockDb = { select: mockSelect };
    const mockDatabaseService = { db: mockDb };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityUtilsService,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();

    service = module.get(ActivityUtilsService);
  });

  describe('generateDisplayId', () => {
    it('formats ("AG", 123) as "AG-000123"', () => {
      expect(service.generateDisplayId('AG', 123)).toBe('AG-000123');
    });

    it('formats ("hlth", 456789) as "HLTH-456789"', () => {
      expect(service.generateDisplayId('hlth', 456789)).toBe('HLTH-456789');
    });

    it('trims abbreviation', () => {
      expect(service.generateDisplayId('  AG  ', 123)).toBe('AG-000123');
    });
  });

  describe('validateCategoryIds', () => {
    it('does not throw for empty array', async () => {
      await expect(service.validateCategoryIds([])).resolves.toBeUndefined();
      expect(mockWhere).not.toHaveBeenCalled();
    });

    it('does not throw when all IDs exist', async () => {
      mockWhere.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);
      await expect(
        service.validateCategoryIds([1, 2, 3])
      ).resolves.toBeUndefined();
    });

    it('throws BadRequestException with missing IDs listed when some are missing', async () => {
      mockWhere.mockResolvedValue([{ id: 1 }]);
      await expect(service.validateCategoryIds([1, 2, 3])).rejects.toThrow(
        BadRequestException
      );
      try {
        await service.validateCategoryIds([1, 2, 3]);
      } catch (e: unknown) {
        const res = (e as { getResponse: () => unknown }).getResponse();
        const msg =
          typeof res === 'object' && res !== null && 'message' in res
            ? String((res as { message: unknown }).message)
            : String(res);
        expect(msg).toContain('2');
        expect(msg).toContain('3');
        expect(msg).toMatch(/do not exist or are not active/);
      }
    });
  });
});
