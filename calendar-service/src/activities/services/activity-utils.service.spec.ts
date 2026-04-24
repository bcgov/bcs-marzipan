import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import {
  buildActivityDisplayId,
  normalizeTeamAbbreviationForActivityDisplayId,
} from '@corpcal/shared';

import { DatabaseService } from '../../database/database.service';
import { ActivityUtilsService } from './activity-utils.service';

describe('ActivityUtilsService', () => {
  let service: ActivityUtilsService;
  let mockWhere: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    mockWhere = vi.fn().mockResolvedValue([{ id: 1 }]);
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
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

    it('uses full id past six digits (no truncation collision)', () => {
      expect(service.generateDisplayId('HLTH', 1_000_123)).toBe('HLTH-1000123');
    });

    it('trims abbreviation', () => {
      expect(service.generateDisplayId('  AG  ', 123)).toBe('AG-000123');
    });
  });

  describe('getDisplayIdPrefixFromTeamAbbreviation', () => {
    it('returns full abbreviation uppercased with spaces removed', () => {
      expect(service.getDisplayIdPrefixFromTeamAbbreviation('My Team')).toBe(
        'MYTEAM'
      );
    });
    it('preserves short codes without padding', () => {
      expect(service.getDisplayIdPrefixFromTeamAbbreviation('Hi')).toBe('HI');
    });
    it('normalizes values like seed MR', () => {
      expect(service.getDisplayIdPrefixFromTeamAbbreviation('  mr  ')).toBe(
        'MR'
      );
    });
    it('uses fallback when abbreviation is empty after normalizing', () => {
      expect(service.getDisplayIdPrefixFromTeamAbbreviation('   ')).toBe(
        normalizeTeamAbbreviationForActivityDisplayId('   ')
      );
    });
    it('uses fallback for null or undefined', () => {
      expect(service.getDisplayIdPrefixFromTeamAbbreviation(null)).toBe(
        normalizeTeamAbbreviationForActivityDisplayId(null)
      );
      expect(service.getDisplayIdPrefixFromTeamAbbreviation(undefined)).toBe(
        normalizeTeamAbbreviationForActivityDisplayId(undefined)
      );
    });
  });

  describe('computeDisplayIdFromLeadContext', () => {
    it('uses ministry abbreviation when leadMinistryId is set and abbreviation is truthy', () => {
      expect(
        service.computeDisplayIdFromLeadContext({
          activityId: 123,
          leadMinistryId: 5,
          ministryAbbreviation: 'AG',
          teamAbbreviation: 'MR',
        })
      ).toBe('AG-000123');
    });

    it('falls back to team abbreviation when leadMinistryId is null', () => {
      expect(
        service.computeDisplayIdFromLeadContext({
          activityId: 456,
          leadMinistryId: null,
          ministryAbbreviation: null,
          teamAbbreviation: 'MR',
        })
      ).toBe('MR-000456');
    });

    it('falls back to team abbreviation when ministry abbreviation is empty', () => {
      expect(
        service.computeDisplayIdFromLeadContext({
          activityId: 7,
          leadMinistryId: 2,
          ministryAbbreviation: '',
          teamAbbreviation: 'my team',
        })
      ).toBe('MYTEAM-000007');
    });

    it('falls back to team when ministry abbreviation is only whitespace', () => {
      expect(
        service.computeDisplayIdFromLeadContext({
          activityId: 7,
          leadMinistryId: 2,
          ministryAbbreviation: '   ',
          teamAbbreviation: 'MR',
        })
      ).toBe('MR-000007');
    });

    it('normalizes ministry abbreviation like team (spaces, case)', () => {
      expect(
        service.computeDisplayIdFromLeadContext({
          activityId: 123,
          leadMinistryId: 5,
          ministryAbbreviation: '  a g  ',
          teamAbbreviation: 'MR',
        })
      ).toBe('AG-000123');
    });

    it('uses team abbreviation fallback when both ministry and team abbreviations are empty', () => {
      expect(
        service.computeDisplayIdFromLeadContext({
          activityId: 1,
          leadMinistryId: null,
          ministryAbbreviation: null,
          teamAbbreviation: '   ',
        })
      ).toBe(
        buildActivityDisplayId(
          normalizeTeamAbbreviationForActivityDisplayId('   '),
          1
        )
      );
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
            ? String(res.message)
            : String(res);
        expect(msg).toContain('2');
        expect(msg).toContain('3');
        expect(msg).toMatch(/do not exist or are not active/);
      }
    });
  });
});
