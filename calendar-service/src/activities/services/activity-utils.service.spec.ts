import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import {
  buildActivityDisplayId,
  normalizeTeamAbbreviationForActivityDisplayId,
} from '@corpcal/shared';

import { ActivityUtilsService } from './activity-utils.service';

describe('ActivityUtilsService', () => {
  const service = new ActivityUtilsService({} as never);

  describe('getDisplayIdPrefixFromTeamAbbreviation', () => {
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
    it('uses lead team abbreviation for the prefix', () => {
      expect(
        service.computeDisplayIdFromLeadContext({
          activityId: 123,
          teamAbbreviation: 'MR',
        })
      ).toBe('MR-000123');
    });

    it('normalizes team abbreviation (spaces, case)', () => {
      expect(
        service.computeDisplayIdFromLeadContext({
          activityId: 7,
          teamAbbreviation: 'my team',
        })
      ).toBe('MYTEAM-000007');
    });

    it('uses team abbreviation fallback when team abbreviation is empty', () => {
      expect(
        service.computeDisplayIdFromLeadContext({
          activityId: 1,
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
    });

    it('throws when more than one category id is provided', async () => {
      await expect(service.validateCategoryIds([1, 2])).rejects.toThrow(
        BadRequestException
      );
    });
  });
});
