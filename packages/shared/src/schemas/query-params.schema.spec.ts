import { describe, expect, it } from 'vitest';

import {
  filterActivitiesQuerySchema,
  lookupQueryParamsSchema,
  reportDataQuerySchema,
  reportDataQueryToActivityFindAllFilters,
  serializeFilterActivitiesQueryParams,
} from './query-params.schema';

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
      flagAssigneeUserIds: '20',
      sharedWithTeamIds: '1,2',
      tagIds: '99',
      categoryNames: 'Event,FYI',
      lookAheadSectionValues: 'events,issues',
    });
    expect(result.activityStatusIds).toEqual([1, 2, 3]);
    expect(result.leadMinistryIds).toEqual([5]);
    expect(result.leadTeamIds).toEqual([7, 8]);
    expect(result.commsContactLeadUserIds).toEqual([10]);
    expect(result.flagAssigneeUserIds).toEqual([20]);
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

  it('parses confirmed filters and pitch date flags', () => {
    const result = filterActivitiesQuerySchema.parse({
      dateConfirmedFilter: 'confirmed',
      timeConfirmedFilter: 'not_confirmed',
      pitchDateNotScheduled: 'true',
      pitchDateFrom: '2025-01-01',
      pitchDateTo: '2025-01-31',
      scheduledBothDatesInRange: 'true',
    });
    expect(result.dateConfirmedFilter).toBe('confirmed');
    expect(result.timeConfirmedFilter).toBe('not_confirmed');
    expect(result.pitchDateNotScheduled).toBe(true);
    expect(result.pitchDateFrom).toBe('2025-01-01');
    expect(result.scheduledBothDatesInRange).toBe(true);
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
