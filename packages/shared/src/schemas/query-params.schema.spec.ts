import { describe, expect, it } from 'vitest';

import { parseIdListFromQueryParam } from './query-param-helpers';
import {
  filterActivitiesQuerySchema,
  lookupQueryParamsSchema,
  reportDataQuerySchema,
  reportDataQueryToActivityFindAllFilters,
  serializeFilterActivitiesQueryParams,
} from './query-params.schema';

describe('parseIdListFromQueryParam', () => {
  it('parses comma-separated digit-only ids', () => {
    expect(parseIdListFromQueryParam('1,2,3')).toEqual([1, 2, 3]);
    expect(parseIdListFromQueryParam(' 5 ')).toEqual([5]);
  });

  it('returns empty for null, blank, or all-invalid input', () => {
    expect(parseIdListFromQueryParam(null)).toEqual([]);
    expect(parseIdListFromQueryParam('')).toEqual([]);
    expect(parseIdListFromQueryParam('   ')).toEqual([]);
    expect(parseIdListFromQueryParam('1e2,0x10,1.5')).toEqual([]);
    expect(parseIdListFromQueryParam('1,bad,3')).toEqual([1, 3]);
  });
});

describe('lookupQueryParamsSchema', () => {
  it('accepts valid empty input', () => {
    const result = lookupQueryParamsSchema.parse({});
    expect(result).toEqual({});
  });

  it('parses userId as integer', () => {
    expect(lookupQueryParamsSchema.parse({ userId: '42' })).toEqual({
      userId: 42,
    });
  });
});

describe('filterActivitiesQuerySchema', () => {
  it('applies defaults for page and limit when omitted', () => {
    const result = filterActivitiesQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('parses array filter params from comma-separated strings', () => {
    const result = filterActivitiesQuerySchema.parse({
      activityStatusIds: '1,2,3',
      leadMinistryIds: '5',
      leadTeamIds: '7,8',
      commsContactLeadUserIds: '10',
      flaggedUserIds: '20',
      sharedWithTeamIds: '1,2',
      tagIds: '99',
      categoryNames: 'Event,FYI',
      lookAheadSectionValues: 'events,issues',
    });
    expect(result.activityStatusIds).toEqual([1, 2, 3]);
    expect(result.leadMinistryIds).toEqual([5]);
    expect(result.leadTeamIds).toEqual([7, 8]);
    expect(result.commsContactLeadUserIds).toEqual([10]);
    expect(result.flaggedUserIds).toEqual([20]);
    expect(result.sharedWithTeamIds).toEqual([1, 2]);
    expect(result.tagIds).toEqual([99]);
    expect(result.categoryNames).toEqual(['Event', 'FYI']);
    expect(result.lookAheadSectionValues).toEqual(['events', 'issues']);
  });

  it('omits empty arrays', () => {
    const result = filterActivitiesQuerySchema.parse({
      activityStatusIds: '',
      sharedWithTeamIds: '1',
    });
    expect(result.activityStatusIds).toBeUndefined();
    expect(result.sharedWithTeamIds).toEqual([1]);
  });

  it('rejects non-integer comma-separated id tokens', () => {
    const invalid = [
      { tagIds: '1.5' },
      { tagIds: '1e2' },
      { tagIds: '0x10' },
      { activityStatusIds: '1,2.5,3' },
    ];
    for (const query of invalid) {
      const result = filterActivitiesQuerySchema.parse(query);
      const key = Object.keys(query)[0] as keyof typeof result;
      expect(result[key]).toBeUndefined();
    }
  });

  it('parses confirmed filters and pitch date flags', () => {
    const result = filterActivitiesQuerySchema.parse({
      dateConfirmedFilter: 'confirmed',
      timeConfirmedFilter: 'not_confirmed',
      pitchDateNotScheduled: 'true',
      pitchDateFrom: '2025-01-01',
      pitchDateTo: '2025-01-31',
      scheduledDateRangeOverlaps: 'true',
    });
    expect(result.dateConfirmedFilter).toBe('confirmed');
    expect(result.timeConfirmedFilter).toBe('not_confirmed');
    expect(result.pitchDateNotScheduled).toBe(true);
    expect(result.pitchDateFrom).toBe('2025-01-01');
    expect(result.scheduledDateRangeOverlaps).toBe(true);
  });

  it('parses includeCompleted and includeDeleted', () => {
    expect(
      filterActivitiesQuerySchema.parse({ includeCompleted: 'true' })
        .includeCompleted
    ).toBe(true);
    expect(
      filterActivitiesQuerySchema.parse({ includeDeleted: 'true' })
        .includeDeleted
    ).toBe(true);
  });
});

describe('serializeFilterActivitiesQueryParams', () => {
  it('joins array fields as comma-separated strings', () => {
    expect(
      serializeFilterActivitiesQueryParams({
        activityStatusIds: [1, 2],
        sharedWithTeamIds: [3],
        includeCompleted: true,
      })
    ).toEqual({
      activityStatusIds: '1,2',
      sharedWithTeamIds: '3',
      includeCompleted: true,
    });
  });
});

describe('reportDataQuerySchema', () => {
  it('parses empty query without pagination fields', () => {
    const result = reportDataQuerySchema.parse({});
    expect(result).toEqual({});
    expect('page' in result).toBe(false);
    expect('limit' in result).toBe(false);
  });

  it('maps to findAll filters without search', () => {
    const parsed = reportDataQuerySchema.parse({
      search: ' briefing',
      startDateFrom: '2025-06-01',
      startDateTo: '2025-06-30',
      tagIds: '1,2',
    });
    const filters = reportDataQueryToActivityFindAllFilters(parsed);
    expect(filters.startDateFrom).toBe('2025-06-01');
    expect(filters.startDateTo).toBe('2025-06-30');
    expect(filters.tagIds).toEqual([1, 2]);
    expect(filters.page).toBe(1);
    expect(filters.limit).toBe(100);
    expect('search' in filters).toBe(false);
  });
});
