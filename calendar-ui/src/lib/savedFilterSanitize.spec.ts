import { describe, expect, it } from 'vitest';

import { DEFAULT_ACTIVITY_FILTER_STATE } from '@corpcal/shared';

import {
  sanitizeSavedFilterPayload,
  type SavedFilterPayload,
  type ValidFilterLookups,
} from './savedFilterSanitize';

describe('sanitizeSavedFilterPayload', () => {
  const validPayload: SavedFilterPayload = {
    filterState: {
      dateRange: {
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        noStartDate: false,
        noEndDate: false,
      },
      categoryNames: ['Event', 'Issues'],
      activityStatusIds: [1, 2, 3],
      pitchRequiredStatusNames: ['Required'],
      pitchDateFilter: { kind: 'not_scheduled' },
      lookAheadStatusValues: ['new'],
      lookAheadSectionValues: ['events'],
      dateConfirmedFilter: 'confirmed',
      timeConfirmedFilter: 'not_confirmed',
      tagIds: [10, 20],
      leadMinistryIds: [5],
      leadOrgIds: [6],
      commsContactLeadUserIds: [7],
      eventPlannerLeadIds: [8],
      translationRequiredStatusIds: [9],
      translationLanguageIds: [11],
    },
    searchKeyword: 'test search',
  };

  it('should parse a valid payload without marking invalid values', () => {
    const result = sanitizeSavedFilterPayload(validPayload);

    expect(result.hadInvalidValues).toBe(false);
    expect(result.searchKeyword).toBe('test search');
    expect(result.filterState.categoryNames).toEqual(['Event', 'Issues']);
    expect(result.filterState.activityStatusIds).toEqual([1, 2, 3]);
    expect(result.filterState.dateRange.startDate).toBe('2025-01-01');
    expect(result.filterState.pitchDateFilter).toEqual({
      kind: 'not_scheduled',
    });
    expect(result.filterState.dateConfirmedFilter).toBe('confirmed');
    expect(result.filterState.timeConfirmedFilter).toBe('not_confirmed');
  });

  it('should return defaults for null/undefined filterState', () => {
    const result = sanitizeSavedFilterPayload({
      filterState: null as unknown as Record<string, unknown>,
      searchKeyword: 'foo',
    });

    expect(result.filterState).toEqual(DEFAULT_ACTIVITY_FILTER_STATE);
    expect(result.searchKeyword).toBe('foo');
  });

  it('should mark hadInvalidValues when IDs are removed by lookup validation', () => {
    const lookups: ValidFilterLookups = {
      statusIds: new Set([1, 2]),
      tagIds: new Set([10]),
    };

    const result = sanitizeSavedFilterPayload(validPayload, lookups);

    expect(result.hadInvalidValues).toBe(true);
    expect(result.filterState.activityStatusIds).toEqual([1, 2]);
    expect(result.filterState.tagIds).toEqual([10]);
  });

  it('should handle missing fields gracefully by using defaults', () => {
    const result = sanitizeSavedFilterPayload({
      filterState: { dateRange: { startDate: '2025-01-01' } },
      searchKeyword: '',
    });

    expect(result.hadInvalidValues).toBe(false);
    expect(result.filterState.categoryNames).toEqual([]);
    expect(result.filterState.activityStatusIds).toEqual([]);
    expect(result.filterState.dateRange.startDate).toBe('2025-01-01');
    expect(result.filterState.dateRange.endDate).toBe('');
  });

  it('should handle scheduled pitch date filter', () => {
    const payload: SavedFilterPayload = {
      filterState: {
        ...validPayload.filterState,
        pitchDateFilter: {
          kind: 'scheduled',
          dateRange: {
            startDate: '2025-06-01',
            endDate: '2025-06-30',
            noStartDate: false,
            noEndDate: true,
          },
        },
      },
      searchKeyword: '',
    };

    const result = sanitizeSavedFilterPayload(payload);

    expect(result.filterState.pitchDateFilter).toEqual({
      kind: 'scheduled',
      dateRange: {
        startDate: '2025-06-01',
        endDate: '2025-06-30',
        noStartDate: false,
        noEndDate: true,
      },
    });
  });

  it('should default invalid confirmed filter values to "any"', () => {
    const result = sanitizeSavedFilterPayload({
      filterState: {
        dateConfirmedFilter: 'invalid_value',
        timeConfirmedFilter: 123,
      },
      searchKeyword: '',
    });

    expect(result.filterState.dateConfirmedFilter).toBe('any');
    expect(result.filterState.timeConfirmedFilter).toBe('any');
  });

  it('should handle non-array values for array fields by returning empty arrays', () => {
    const result = sanitizeSavedFilterPayload({
      filterState: {
        categoryNames: 'not an array',
        activityStatusIds: 42,
        tagIds: null,
      },
      searchKeyword: '',
    });

    expect(result.filterState.categoryNames).toEqual([]);
    expect(result.filterState.activityStatusIds).toEqual([]);
    expect(result.filterState.tagIds).toEqual([]);
  });
});
