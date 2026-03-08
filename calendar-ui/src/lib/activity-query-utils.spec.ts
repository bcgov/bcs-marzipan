import { describe, expect, it } from 'vitest';

import type { ActivityResponse } from '@corpcal/shared/api/types';
import type { UpdateActivityRequest } from '@corpcal/shared/schemas';
import { DEFAULT_ACTIVITY_FILTER_STATE } from '@/components/ActivityTable/activityFilterState';
import type { ActivityTableRow } from '@/components/ActivityTable/activityTableRow';

import {
  buildOptimisticActivity,
  filterActivityRowsByFilters,
  filterActivityRowsByKeyword,
  normalizeListParams,
} from './activity-query-utils';

function makeRow(overrides: Partial<ActivityTableRow> = {}): ActivityTableRow {
  return {
    id: 1,
    displayId: null,
    title: '',
    activityCategories: [],
    pitchDate: null,
    pitchRequiredStatus: null,
    isConfidential: false,
    isIssue: false,
    summary: '',
    tags: [],
    lookAheadStatus: null,
    lookAheadSection: null,
    allDay: false,
    startDate: null,
    endDate: null,
    dateStatus: '',
    startTime: null,
    endTime: null,
    timeStatus: '',
    venue: null,
    premierRequested: null,
    activityRepresentatives: [],
    leadOrg: null,
    leadMinistry: null,
    leadMinistryAbbreviation: null,
    commsLeadName: null,
    commsContactsCount: 0,
    eventLead: null,
    translationsRequired: [],
    translationsRequiredStatus: null,
    commsMaterials: [],
    activityStatus: '',
    activityStatusId: 0,
    lastUpdatedDateTime: '',
    lastUpdatedBy: 0,
    createdDateTime: '',
    ...overrides,
  };
}

describe('normalizeListParams', () => {
  it('returns empty object for no input', () => {
    expect(normalizeListParams()).toEqual({});
    expect(normalizeListParams({})).toEqual({});
  });

  it('includes only excludeCompleted when provided', () => {
    expect(normalizeListParams({ excludeCompleted: true })).toEqual({
      excludeCompleted: true,
    });
    expect(normalizeListParams({ excludeCompleted: false })).toEqual({
      excludeCompleted: false,
    });
  });

  it('includes only includeDeleted when provided', () => {
    expect(normalizeListParams({ includeDeleted: true })).toEqual({
      includeDeleted: true,
    });
    expect(normalizeListParams({ includeDeleted: false })).toEqual({
      includeDeleted: false,
    });
  });

  it('includes both keys when both provided', () => {
    expect(
      normalizeListParams({
        excludeCompleted: false,
        includeDeleted: true,
      })
    ).toEqual({ excludeCompleted: false, includeDeleted: true });
  });

  it('omits keys when value is undefined for stable query key', () => {
    expect(
      normalizeListParams({
        excludeCompleted: undefined,
        includeDeleted: undefined,
      })
    ).toEqual({});
  });

  it('copies only excludeCompleted and includeDeleted when params have extra keys', () => {
    const params = {
      excludeCompleted: true,
      includeDeleted: false,
      page: 1,
      limit: 20,
    } as Parameters<typeof normalizeListParams>[0];
    expect(normalizeListParams(params)).toEqual({
      excludeCompleted: true,
      includeDeleted: false,
    });
  });

  it('includes leadTeamId, commsContactLeadUserId, sharedWithTeamId, sharedWithTeamIds when provided', () => {
    expect(
      normalizeListParams({
        excludeCompleted: true,
        leadTeamId: 5,
      })
    ).toEqual({ excludeCompleted: true, leadTeamId: 5 });
    expect(
      normalizeListParams({
        commsContactLeadUserId: 10,
        sharedWithTeamId: 3,
      })
    ).toEqual({
      commsContactLeadUserId: 10,
      sharedWithTeamId: 3,
    });
    expect(
      normalizeListParams({
        sharedWithTeamIds: [3, 1, 2],
      })
    ).toEqual({ sharedWithTeamIds: [1, 2, 3] });
  });

  it('includes date and activityStatusId when provided', () => {
    expect(
      normalizeListParams({
        startDateFrom: '2025-01-01',
        startDateTo: '2025-01-31',
        activityStatusId: 2,
      })
    ).toEqual({
      startDateFrom: '2025-01-01',
      startDateTo: '2025-01-31',
      activityStatusId: 2,
    });
  });
});

describe('filterActivityRowsByFilters', () => {
  it('returns all rows when filter state is empty', () => {
    const rows = [
      makeRow({ id: 1, activityCategories: ['Event'], activityStatusId: 1 }),
      makeRow({ id: 2, activityCategories: ['Release'], activityStatusId: 2 }),
    ];
    expect(
      filterActivityRowsByFilters(rows, {
        ...DEFAULT_ACTIVITY_FILTER_STATE,
        dateRange: {
          startDate: '',
          endDate: '',
          noStartDate: false,
          noEndDate: false,
        },
        categoryNames: [],
        activityStatusIds: [],
      })
    ).toEqual(rows);
  });

  it('filters by category names', () => {
    const rows = [
      makeRow({ id: 1, activityCategories: ['Event', 'Release'] }),
      makeRow({ id: 2, activityCategories: ['FYI'] }),
      makeRow({ id: 3, activityCategories: [] }),
    ];
    const result = filterActivityRowsByFilters(rows, {
      ...DEFAULT_ACTIVITY_FILTER_STATE,
      dateRange: {
        startDate: '',
        endDate: '',
        noStartDate: false,
        noEndDate: false,
      },
      categoryNames: ['Event', 'FYI'],
      activityStatusIds: [],
    });
    expect(result.map((r) => r.id)).toEqual([1, 2]);
  });

  it('filters by activity status IDs', () => {
    const rows = [
      makeRow({ id: 1, activityStatusId: 1 }),
      makeRow({ id: 2, activityStatusId: 2 }),
      makeRow({ id: 3, activityStatusId: 3 }),
    ];
    const result = filterActivityRowsByFilters(rows, {
      ...DEFAULT_ACTIVITY_FILTER_STATE,
      dateRange: {
        startDate: '',
        endDate: '',
        noStartDate: false,
        noEndDate: false,
      },
      categoryNames: [],
      activityStatusIds: [1, 3],
    });
    expect(result.map((r) => r.id)).toEqual([1, 3]);
  });
});

describe('buildOptimisticActivity', () => {
  const minimalExisting = {
    id: 1,
    title: 'Original title',
    summary: 'Original summary',
    isConfidential: false,
    isIssue: false,
    isAllDay: true,
    startDate: '2025-01-01',
    endDate: '2025-01-02',
    startTime: null,
    endTime: null,
    lookAheadStatus: null,
    lookAheadSection: null,
    pitchDate: null,
    createdDateTime: '2025-01-01T00:00:00Z',
    lastUpdatedDateTime: '2025-01-01T00:00:00Z',
  } as ActivityResponse;

  it('merges one mergeable key from update into existing', () => {
    const update: UpdateActivityRequest = { title: 'Updated title' };
    const result = buildOptimisticActivity(minimalExisting, update);
    expect(result.title).toBe('Updated title');
    expect(result.summary).toBe('Original summary');
    expect(result.id).toBe(1);
  });

  it('merges multiple mergeable keys from update', () => {
    const update: UpdateActivityRequest = {
      title: 'New title',
      summary: 'New summary',
      isConfidential: true,
    };
    const result = buildOptimisticActivity(minimalExisting, update);
    expect(result.title).toBe('New title');
    expect(result.summary).toBe('New summary');
    expect(result.isConfidential).toBe(true);
    expect(result.isIssue).toBe(false);
    expect(result.id).toBe(1);
  });

  it('leaves existing value for keys not in update', () => {
    const update: UpdateActivityRequest = { title: 'Only title' };
    const result = buildOptimisticActivity(minimalExisting, update);
    expect(result.summary).toBe('Original summary');
    expect(result.startDate).toBe('2025-01-01');
    expect(result.createdDateTime).toBe('2025-01-01T00:00:00Z');
  });

  it('does not overwrite existing with non-mergeable keys from update', () => {
    const existingWithExtra = {
      ...minimalExisting,
      id: 42,
      leadOrgId: 10,
    } as ActivityResponse;
    const update = {
      id: 999,
      leadOrgId: 99,
      title: 'New title',
    } as UpdateActivityRequest;
    const result = buildOptimisticActivity(existingWithExtra, update);
    expect(result.title).toBe('New title');
    expect(result.id).toBe(42);
    expect(result.leadOrgId).toBe(10);
  });

  it('returns a copy of existing when update is empty', () => {
    const update: UpdateActivityRequest = {};
    const result = buildOptimisticActivity(minimalExisting, update);
    expect(result).toEqual(minimalExisting);
    expect(result).not.toBe(minimalExisting);
  });
});

describe('filterActivityRowsByKeyword', () => {
  it('returns all rows when keyword is empty', () => {
    const rows = [
      makeRow({ id: 1, title: 'Alpha' }),
      makeRow({ id: 2, title: 'Beta' }),
    ];
    expect(filterActivityRowsByKeyword(rows, '')).toEqual(rows);
    expect(filterActivityRowsByKeyword(rows, '   ')).toEqual(rows);
  });

  it('matches in title (case-insensitive)', () => {
    const rows = [
      makeRow({ id: 1, title: 'Alpha Event' }),
      makeRow({ id: 2, title: 'Beta Event' }),
    ];
    expect(filterActivityRowsByKeyword(rows, 'alpha')).toEqual([rows[0]]);
    expect(filterActivityRowsByKeyword(rows, 'ALPHA')).toEqual([rows[0]]);
  });

  it('matches in summary', () => {
    const rows = [
      makeRow({ id: 1, summary: 'First activity summary' }),
      makeRow({ id: 2, summary: 'Second activity' }),
    ];
    expect(filterActivityRowsByKeyword(rows, 'summary')).toEqual([rows[0]]);
  });

  it('matches in displayId', () => {
    const rows = [
      makeRow({ id: 1, displayId: 'AG-000123' }),
      makeRow({ id: 2, displayId: 'HLTH-456' }),
    ];
    expect(filterActivityRowsByKeyword(rows, 'AG-000123')).toEqual([rows[0]]);
    expect(filterActivityRowsByKeyword(rows, '000123')).toEqual([rows[0]]);
  });

  it('returns empty array when no row matches', () => {
    const rows = [
      makeRow({ id: 1, title: 'Alpha', summary: 'One' }),
      makeRow({ id: 2, title: 'Beta', summary: 'Two' }),
    ];
    expect(filterActivityRowsByKeyword(rows, 'gamma')).toEqual([]);
  });

  it('matches in tags and activityCategories', () => {
    const rows = [
      makeRow({
        id: 1,
        title: 'X',
        tags: [{ id: 1, text: 'environment' }],
        activityCategories: ['Event'],
      }),
    ];
    expect(filterActivityRowsByKeyword(rows, 'environment')).toEqual(rows);
    expect(filterActivityRowsByKeyword(rows, 'Event')).toEqual(rows);
  });
});
