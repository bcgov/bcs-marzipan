import { describe, expect, it } from 'vitest';

import { DEFAULT_ACTIVITY_FILTER_STATE } from '@corpcal/shared';
import type { ActivityResponse } from '@corpcal/shared/api/types';
import type { UpdateActivityRequest } from '@corpcal/shared/schemas';
import type { ActivityTableRow } from '@/components/activity/ActivityTable/activityTableRow';

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
    categoryIds: [],
    pitchDate: null,
    pitchRequiredStatus: null,
    isConfidential: false,
    isIssue: false,
    summary: '',
    executiveSummary: '',
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
    eventPlanners: [],
    eventPlannerLeadIds: [],
    leadTeamId: null,
    leadMinistryId: null,
    leadOrgId: null,
    commsContactLeadUserId: null,
    translationsRequired: [],
    translationsRequiredStatus: null,
    translationsRequiredStatusId: null,
    commsMaterials: [],
    activityStatus: '',
    activityStatusId: 0,
    lastUpdatedDateTime: '',
    lastUpdatedBy: 0,
    createdDateTime: '',
    flags: [],
    ...overrides,
  };
}

describe('normalizeListParams', () => {
  it('returns empty object for no input', () => {
    expect(normalizeListParams()).toEqual({});
    expect(normalizeListParams({})).toEqual({});
  });

  it('includes only includeCompleted when provided', () => {
    expect(normalizeListParams({ includeCompleted: true })).toEqual({
      includeCompleted: true,
    });
    expect(normalizeListParams({ includeCompleted: false })).toEqual({
      includeCompleted: false,
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
        includeCompleted: false,
        includeDeleted: true,
      })
    ).toEqual({ includeCompleted: false, includeDeleted: true });
  });

  it('omits keys when value is undefined for stable query key', () => {
    expect(
      normalizeListParams({
        includeCompleted: undefined,
        includeDeleted: undefined,
      })
    ).toEqual({});
  });

  it('copies only includeCompleted and includeDeleted when params have extra keys', () => {
    const params = {
      includeCompleted: true,
      includeDeleted: false,
      page: 1,
      limit: 20,
    } as Parameters<typeof normalizeListParams>[0];
    expect(normalizeListParams(params)).toEqual({
      includeCompleted: true,
      includeDeleted: false,
    });
  });

  it('includes tab context array params when provided', () => {
    expect(
      normalizeListParams({
        includeCompleted: true,
        leadTeamIds: [5],
      })
    ).toEqual({ includeCompleted: true, leadTeamIds: [5] });
    expect(
      normalizeListParams({
        commsContactLeadUserIds: [10],
        flagAssigneeUserIds: [3],
      })
    ).toEqual({
      commsContactLeadUserIds: [10],
      flagAssigneeUserIds: [3],
    });
    expect(
      normalizeListParams({
        sharedWithTeamIds: [3, 1, 2],
      })
    ).toEqual({ sharedWithTeamIds: [1, 2, 3] });
  });

  it('omits unsupported panel filter fields', () => {
    expect(
      normalizeListParams({
        startDateFrom: '2025-01-01',
        startDateTo: '2025-01-31',
        activityStatusIds: [2],
      } as Parameters<typeof normalizeListParams>[0])
    ).toEqual({});
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
        categoryIds: [],
        activityStatusIds: [],
      })
    ).toEqual(rows);
  });

  it('filters by category ids', () => {
    const rows = [
      makeRow({
        id: 1,
        activityCategories: ['Event', 'Release'],
        categoryIds: [1, 2],
      }),
      makeRow({ id: 2, activityCategories: ['FYI'], categoryIds: [3] }),
      makeRow({ id: 3, activityCategories: [], categoryIds: [] }),
    ];
    const result = filterActivityRowsByFilters(rows, {
      ...DEFAULT_ACTIVITY_FILTER_STATE,
      dateRange: {
        startDate: '',
        endDate: '',
        noStartDate: false,
        noEndDate: false,
      },
      categoryIds: [1, 3],
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
      categoryIds: [],
      activityStatusIds: [1, 3],
    });
    expect(result.map((r) => r.id)).toEqual([1, 3]);
  });

  it('filters by pitch required status names (case-insensitive)', () => {
    const rows = [
      makeRow({ id: 1, pitchRequiredStatus: 'Required' }),
      makeRow({ id: 2, pitchRequiredStatus: 'Not required' }),
      makeRow({ id: 3, pitchRequiredStatus: 'TBD' }),
      makeRow({ id: 4, pitchRequiredStatus: null }),
    ];
    const result = filterActivityRowsByFilters(rows, {
      ...DEFAULT_ACTIVITY_FILTER_STATE,
      pitchRequiredStatusNames: ['required', 'tbd'],
    });
    expect(result.map((r) => r.id)).toEqual([1, 3]);
  });

  it('does not filter by pitch status when pitchRequiredStatusNames is empty', () => {
    const rows = [
      makeRow({ id: 1, pitchRequiredStatus: 'Required' }),
      makeRow({ id: 2, pitchRequiredStatus: null }),
    ];
    const result = filterActivityRowsByFilters(rows, {
      ...DEFAULT_ACTIVITY_FILTER_STATE,
      pitchRequiredStatusNames: [],
    });
    expect(result.map((r) => r.id)).toEqual([1, 2]);
  });

  it('filters by pitch date not_scheduled (row must have no pitch date)', () => {
    const rows = [
      makeRow({ id: 1, pitchDate: null }),
      makeRow({ id: 2, pitchDate: '2025-03-01' }),
      makeRow({ id: 3, pitchDate: null }),
    ];
    const result = filterActivityRowsByFilters(rows, {
      ...DEFAULT_ACTIVITY_FILTER_STATE,
      pitchDateFilter: { kind: 'not_scheduled' },
    });
    expect(result.map((r) => r.id)).toEqual([1, 3]);
  });

  it('filters by pitch date scheduled with date range', () => {
    const rows = [
      makeRow({ id: 1, pitchDate: '2025-02-15' }),
      makeRow({ id: 2, pitchDate: '2025-01-10' }),
      makeRow({ id: 3, pitchDate: '2025-03-20' }),
      makeRow({ id: 4, pitchDate: null }),
    ];
    const result = filterActivityRowsByFilters(rows, {
      ...DEFAULT_ACTIVITY_FILTER_STATE,
      pitchDateFilter: {
        kind: 'scheduled',
        dateRange: {
          startDate: '2025-02-01',
          endDate: '2025-02-28',
          noStartDate: false,
          noEndDate: false,
        },
      },
    });
    expect(result.map((r) => r.id)).toEqual([1]);
  });

  it('pitch date scheduled with empty range includes all rows with pitch date', () => {
    const rows = [
      makeRow({ id: 1, pitchDate: '2025-02-15' }),
      makeRow({ id: 2, pitchDate: '2024-01-01' }),
      makeRow({ id: 3, pitchDate: null }),
    ];
    const result = filterActivityRowsByFilters(rows, {
      ...DEFAULT_ACTIVITY_FILTER_STATE,
      pitchDateFilter: {
        kind: 'scheduled',
        dateRange: {
          startDate: '',
          endDate: '',
          noStartDate: false,
          noEndDate: false,
        },
      },
    });
    expect(result.map((r) => r.id)).toEqual([1, 2]);
  });

  it('filters by date range (activity span must overlap range)', () => {
    const rows = [
      makeRow({
        id: 1,
        startDate: '2025-01-15',
        endDate: '2025-01-20',
      }),
      makeRow({
        id: 2,
        startDate: '2024-12-01',
        endDate: '2025-01-10',
      }),
      makeRow({
        id: 3,
        startDate: '2025-02-01',
        endDate: '2025-02-28',
      }),
      makeRow({
        id: 4,
        startDate: '2024-12-15',
        endDate: '2025-02-15',
      }),
    ];
    const result = filterActivityRowsByFilters(rows, {
      ...DEFAULT_ACTIVITY_FILTER_STATE,
      dateRange: {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        noStartDate: false,
        noEndDate: false,
      },
      categoryIds: [],
      activityStatusIds: [],
    });
    expect(result.map((r) => r.id)).toEqual([1, 2, 4]);
  });

  it('filters by look-ahead status', () => {
    const rows = [
      makeRow({ id: 1, lookAheadStatus: 'new', lookAheadSection: 'events' }),
      makeRow({
        id: 2,
        lookAheadStatus: 'changed',
        lookAheadSection: 'issues',
      }),
      makeRow({ id: 3, lookAheadStatus: 'none', lookAheadSection: 'news' }),
    ];
    const result = filterActivityRowsByFilters(rows, {
      ...DEFAULT_ACTIVITY_FILTER_STATE,
      lookAheadStatusValues: ['new', 'changed'],
      lookAheadSectionValues: [],
    });
    expect(result.map((r) => r.id)).toEqual([1, 2]);
  });

  it('filters by look-ahead section', () => {
    const rows = [
      makeRow({ id: 1, lookAheadStatus: 'new', lookAheadSection: 'events' }),
      makeRow({
        id: 2,
        lookAheadStatus: 'changed',
        lookAheadSection: 'issues',
      }),
      makeRow({ id: 3, lookAheadStatus: 'none', lookAheadSection: 'news' }),
    ];
    const result = filterActivityRowsByFilters(rows, {
      ...DEFAULT_ACTIVITY_FILTER_STATE,
      lookAheadStatusValues: [],
      lookAheadSectionValues: ['events', 'news'],
    });
    expect(result.map((r) => r.id)).toEqual([1, 3]);
  });

  it('filters by both look-ahead status and section (AND)', () => {
    const rows = [
      makeRow({ id: 1, lookAheadStatus: 'new', lookAheadSection: 'events' }),
      makeRow({ id: 2, lookAheadStatus: 'new', lookAheadSection: 'issues' }),
      makeRow({
        id: 3,
        lookAheadStatus: 'changed',
        lookAheadSection: 'events',
      }),
    ];
    const result = filterActivityRowsByFilters(rows, {
      ...DEFAULT_ACTIVITY_FILTER_STATE,
      lookAheadStatusValues: ['new'],
      lookAheadSectionValues: ['events'],
    });
    expect(result.map((r) => r.id)).toEqual([1]);
  });

  it('filters by date confirmed only', () => {
    const rows = [
      makeRow({ id: 1, dateStatus: 'Confirmed', timeStatus: 'unknown' }),
      makeRow({ id: 2, dateStatus: 'unknown', timeStatus: 'unknown' }),
    ];
    const result = filterActivityRowsByFilters(rows, {
      ...DEFAULT_ACTIVITY_FILTER_STATE,
      dateConfirmedFilter: 'confirmed',
      timeConfirmedFilter: 'any',
    });
    expect(result.map((r) => r.id)).toEqual([1]);
  });

  it('filters by time not_confirmed only', () => {
    const rows = [
      makeRow({ id: 1, dateStatus: 'Confirmed', timeStatus: 'Confirmed' }),
      makeRow({ id: 2, dateStatus: 'Confirmed', timeStatus: 'Not confirmed' }),
      makeRow({ id: 3, dateStatus: 'unknown', timeStatus: 'unknown' }),
    ];
    const result = filterActivityRowsByFilters(rows, {
      ...DEFAULT_ACTIVITY_FILTER_STATE,
      dateConfirmedFilter: 'any',
      timeConfirmedFilter: 'not_confirmed',
    });
    expect(result.map((r) => r.id)).toEqual([2, 3]);
  });

  it('filters by both date and time confirmed (AND)', () => {
    const rows = [
      makeRow({ id: 1, dateStatus: 'Confirmed', timeStatus: 'Confirmed' }),
      makeRow({ id: 2, dateStatus: 'confirmed', timeStatus: 'Not confirmed' }),
      makeRow({ id: 3, dateStatus: 'unknown', timeStatus: 'unknown' }),
    ];
    const result = filterActivityRowsByFilters(rows, {
      ...DEFAULT_ACTIVITY_FILTER_STATE,
      dateConfirmedFilter: 'confirmed',
      timeConfirmedFilter: 'confirmed',
    });
    expect(result.map((r) => r.id)).toEqual([1]);
  });

  it('does not filter by confirmation when both are any', () => {
    const rows = [
      makeRow({ id: 1, dateStatus: 'Confirmed', timeStatus: 'Confirmed' }),
      makeRow({ id: 2, dateStatus: 'unknown', timeStatus: 'unknown' }),
    ];
    const result = filterActivityRowsByFilters(rows, {
      ...DEFAULT_ACTIVITY_FILTER_STATE,
      dateConfirmedFilter: 'any',
      timeConfirmedFilter: 'any',
    });
    expect(result.map((r) => r.id)).toEqual([1, 2]);
  });

  it('filters by tagIds (row must have at least one matching tag)', () => {
    const rows = [
      makeRow({
        id: 1,
        tags: [
          { id: 10, text: 'env' },
          { id: 20, text: 'health' },
        ],
      }),
      makeRow({ id: 2, tags: [{ id: 20, text: 'health' }] }),
      makeRow({ id: 3, tags: [{ id: 30, text: 'other' }] }),
      makeRow({ id: 4, tags: [] }),
    ];
    const result = filterActivityRowsByFilters(rows, {
      ...DEFAULT_ACTIVITY_FILTER_STATE,
      tagIds: [20, 40],
    });
    expect(result.map((r) => r.id)).toEqual([1, 2]);
  });

  it('does not filter by tags when tagIds is empty', () => {
    const rows = [
      makeRow({ id: 1, tags: [{ id: 10, text: 'a' }] }),
      makeRow({ id: 2, tags: [] }),
    ];
    const result = filterActivityRowsByFilters(rows, {
      ...DEFAULT_ACTIVITY_FILTER_STATE,
      tagIds: [],
    });
    expect(result.map((r) => r.id)).toEqual([1, 2]);
  });

  it('filters by leadMinistryIds', () => {
    const rows = [
      makeRow({ id: 1, leadMinistryId: 10 }),
      makeRow({ id: 2, leadMinistryId: 20 }),
      makeRow({ id: 3, leadMinistryId: null }),
      makeRow({ id: 4, leadMinistryId: 10 }),
    ];
    const result = filterActivityRowsByFilters(rows, {
      ...DEFAULT_ACTIVITY_FILTER_STATE,
      leadMinistryIds: [10, 30],
    });
    expect(result.map((r) => r.id)).toEqual([1, 4]);
  });

  it('filters by leadOrgIds', () => {
    const rows = [
      makeRow({ id: 1, leadOrgId: 5 }),
      makeRow({ id: 2, leadOrgId: 6 }),
      makeRow({ id: 3, leadOrgId: null }),
    ];
    const result = filterActivityRowsByFilters(rows, {
      ...DEFAULT_ACTIVITY_FILTER_STATE,
      leadOrgIds: [5],
    });
    expect(result.map((r) => r.id)).toEqual([1]);
  });

  it('filters by commsContactLeadUserIds', () => {
    const rows = [
      makeRow({ id: 1, commsContactLeadUserId: 100 }),
      makeRow({ id: 2, commsContactLeadUserId: 200 }),
      makeRow({ id: 3, commsContactLeadUserId: null }),
    ];
    const result = filterActivityRowsByFilters(rows, {
      ...DEFAULT_ACTIVITY_FILTER_STATE,
      commsContactLeadUserIds: [100, 300],
    });
    expect(result.map((r) => r.id)).toEqual([1]);
  });

  it('filters by eventPlannerLeadIds', () => {
    const rows = [
      makeRow({ id: 1, eventPlannerLeadIds: [1] }),
      makeRow({ id: 2, eventPlannerLeadIds: [2] }),
      makeRow({ id: 3, eventPlannerLeadIds: [] }),
    ];
    const result = filterActivityRowsByFilters(rows, {
      ...DEFAULT_ACTIVITY_FILTER_STATE,
      eventPlannerLeadIds: [2],
    });
    expect(result.map((r) => r.id)).toEqual([2]);
  });

  it('applies AND across lead types when multiple lead filters are set', () => {
    const rows = [
      makeRow({
        id: 1,
        leadMinistryId: 10,
        leadOrgId: 5,
        commsContactLeadUserId: 100,
        eventPlannerLeadIds: [1],
      }),
      makeRow({
        id: 2,
        leadMinistryId: 10,
        leadOrgId: 99,
        commsContactLeadUserId: 100,
        eventPlannerLeadIds: [1],
      }),
    ];
    const result = filterActivityRowsByFilters(rows, {
      ...DEFAULT_ACTIVITY_FILTER_STATE,
      leadMinistryIds: [10],
      leadOrgIds: [5],
      commsContactLeadUserIds: [100],
      eventPlannerLeadIds: [1],
    });
    expect(result.map((r) => r.id)).toEqual([1]);
  });

  it('filters by translationLanguageIds when context provides options', () => {
    const rows = [
      makeRow({ id: 1, translationsRequired: ['FR', 'ES'] }),
      makeRow({ id: 2, translationsRequired: ['ES'] }),
      makeRow({ id: 3, translationsRequired: [] }),
      makeRow({ id: 4, translationsRequired: ['fr'] }),
    ];
    const context = {
      translationLanguageOptions: [
        { value: '10', label: 'FR' },
        { value: '20', label: 'ES' },
        { value: '30', label: 'fr' },
      ],
    };
    const result = filterActivityRowsByFilters(
      rows,
      {
        ...DEFAULT_ACTIVITY_FILTER_STATE,
        translationLanguageIds: [10, 30],
      },
      context
    );
    expect(result.map((r) => r.id)).toEqual([1, 4]);
  });

  it('does not filter by translations when translationLanguageIds is empty', () => {
    const rows = [
      makeRow({ id: 1, translationsRequired: ['French'] }),
      makeRow({ id: 2, translationsRequired: [] }),
    ];
    const result = filterActivityRowsByFilters(rows, {
      ...DEFAULT_ACTIVITY_FILTER_STATE,
      translationLanguageIds: [],
    });
    expect(result.map((r) => r.id)).toEqual([1, 2]);
  });

  it('filters by translationRequiredStatusIds (ID-based, no context needed)', () => {
    const rows = [
      makeRow({ id: 1, translationsRequiredStatusId: 2 }),
      makeRow({ id: 2, translationsRequiredStatusId: 1 }),
      makeRow({ id: 3, translationsRequiredStatusId: null }),
      makeRow({ id: 4, translationsRequiredStatusId: 2 }),
    ];
    const result = filterActivityRowsByFilters(rows, {
      ...DEFAULT_ACTIVITY_FILTER_STATE,
      translationRequiredStatusIds: [2],
    });
    expect(result.map((r) => r.id)).toEqual([1, 4]);
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

  it('matches in Tip Tap JSON summary by plain text', () => {
    const doc =
      '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Quarterly report highlights"}]}]}';
    const rows = [
      makeRow({ id: 1, summary: doc }),
      makeRow({ id: 2, summary: 'Other' }),
    ];
    expect(filterActivityRowsByKeyword(rows, 'highlights')).toEqual([rows[0]]);
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

  it('matches in executiveSummary (parity with Reports search)', () => {
    const rows = [
      makeRow({ id: 1, executiveSummary: 'Cabinet briefing scheduled' }),
      makeRow({ id: 2, executiveSummary: 'Other' }),
    ];
    expect(filterActivityRowsByKeyword(rows, 'briefing')).toEqual([rows[0]]);
  });
});
