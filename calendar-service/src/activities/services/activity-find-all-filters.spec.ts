import { describe, expect, it, vi } from 'vitest';

import type { FilterActivitiesQueryParams } from '@corpcal/shared/schemas';

import {
  buildActivityFindAllConditions,
  hasActivityFindAllFilterFields,
} from './activity-find-all-filters';

const DELETED_STATUS_ID = 99;
const COMPLETED_STATUS_ID = 5;

function createMockDb() {
  const select = vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(),
      innerJoin: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
  }));
  return { select, db: { select } as never };
}

function baseFilters(
  overrides: Partial<FilterActivitiesQueryParams> = {}
): FilterActivitiesQueryParams {
  return { page: 1, limit: 20, ...overrides };
}

describe('hasActivityFindAllFilterFields', () => {
  it('returns false when only pagination is present', () => {
    expect(hasActivityFindAllFilterFields({ page: 1, limit: 20 })).toBe(false);
  });

  it('returns false for empty array filter values', () => {
    expect(
      hasActivityFindAllFilterFields({
        activityStatusIds: [],
        tagIds: [],
        categoryNames: [],
      })
    ).toBe(false);
  });

  it.each([
    ['title', { title: 'Briefing' }],
    ['startDateFrom', { startDateFrom: '2026-01-01' }],
    ['scheduledBothDatesInRange', { scheduledBothDatesInRange: true }],
    ['activityStatusIds', { activityStatusIds: [1, 2] }],
    ['tagIds', { tagIds: [10] }],
    ['categoryNames', { categoryNames: ['Event'] }],
    ['lookAheadSectionValues', { lookAheadSectionValues: ['events'] }],
    ['dateConfirmedFilter', { dateConfirmedFilter: 'confirmed' }],
    ['pitchDateNotScheduled', { pitchDateNotScheduled: true }],
    ['pitchDateScheduled', { pitchDateScheduled: true }],
    ['includeCompleted', { includeCompleted: false }],
    ['includeDeleted', { includeDeleted: true }],
  ] as const)('returns true when %s is set', (_label, query) => {
    expect(
      hasActivityFindAllFilterFields(
        query as Partial<FilterActivitiesQueryParams>
      )
    ).toBe(true);
  });
});

describe('buildActivityFindAllConditions', () => {
  it('applies default deleted and completed exclusions when status ids are omitted', () => {
    const { db } = createMockDb();
    const conditions = buildActivityFindAllConditions({
      filters: baseFilters(),
      deletedStatusId: DELETED_STATUS_ID,
      completedStatusId: COMPLETED_STATUS_ID,
      allowIncludeDeleted: false,
      db,
    });
    expect(conditions).toHaveLength(2);
  });

  it('omits completed exclusion when includeCompleted is true', () => {
    const { db } = createMockDb();
    const conditions = buildActivityFindAllConditions({
      filters: baseFilters({ includeCompleted: true }),
      deletedStatusId: DELETED_STATUS_ID,
      completedStatusId: COMPLETED_STATUS_ID,
      allowIncludeDeleted: false,
      db,
    });
    expect(conditions).toHaveLength(1);
  });

  it('uses explicit status ids instead of default archive exclusions', () => {
    const { db } = createMockDb();
    const conditions = buildActivityFindAllConditions({
      filters: baseFilters({ activityStatusIds: [1, 3] }),
      deletedStatusId: DELETED_STATUS_ID,
      completedStatusId: COMPLETED_STATUS_ID,
      allowIncludeDeleted: false,
      db,
    });
    expect(conditions).toHaveLength(1);
  });

  it('does not exclude deleted when allowIncludeDeleted and includeDeleted are true', () => {
    const { db } = createMockDb();
    const conditions = buildActivityFindAllConditions({
      filters: baseFilters({ includeDeleted: true }),
      deletedStatusId: DELETED_STATUS_ID,
      completedStatusId: COMPLETED_STATUS_ID,
      allowIncludeDeleted: true,
      db,
    });
    expect(conditions).toHaveLength(1);
  });

  it('adds one condition per direct activities-table array filter', () => {
    const { db } = createMockDb();
    const conditions = buildActivityFindAllConditions({
      filters: baseFilters({
        leadMinistryIds: [10],
        leadOrgIds: [20],
        lookAheadStatusValues: ['new'],
      }),
      deletedStatusId: DELETED_STATUS_ID,
      completedStatusId: COMPLETED_STATUS_ID,
      allowIncludeDeleted: false,
      db,
    });
    // 2 archive exclusions + 3 inArray filters
    expect(conditions).toHaveLength(5);
  });

  it('builds exists subqueries for junction-table filters', () => {
    const { select, db } = createMockDb();
    buildActivityFindAllConditions({
      filters: baseFilters({
        tagIds: [1, 2],
        commsContactLeadUserIds: [100],
      }),
      deletedStatusId: DELETED_STATUS_ID,
      completedStatusId: COMPLETED_STATUS_ID,
      allowIncludeDeleted: false,
      db,
    });
    expect(select).toHaveBeenCalledTimes(2);
  });

  it('builds category exists with a join', () => {
    const { select, db } = createMockDb();
    const from = vi.fn(() => ({
      innerJoin: vi.fn(() => ({
        where: vi.fn(),
      })),
    }));
    select.mockReturnValueOnce({ from } as never);
    buildActivityFindAllConditions({
      filters: baseFilters({ categoryNames: ['Event', 'FYI'] }),
      deletedStatusId: DELETED_STATUS_ID,
      completedStatusId: COMPLETED_STATUS_ID,
      allowIncludeDeleted: false,
      db,
    });
    expect(select).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalled();
  });

  it('requires both start and end in range when scheduledBothDatesInRange is true', () => {
    const { db } = createMockDb();
    const conditions = buildActivityFindAllConditions({
      filters: baseFilters({
        scheduledBothDatesInRange: true,
        startDateFrom: '2026-05-01',
        startDateTo: '2026-05-31',
      }),
      deletedStatusId: DELETED_STATUS_ID,
      completedStatusId: COMPLETED_STATUS_ID,
      allowIncludeDeleted: false,
      db,
    });
    // 4 non-empty date guards + 2 lower bounds + 2 upper bounds + 2 archive exclusions
    expect(conditions).toHaveLength(10);
  });

  it('uses single-sided start date bounds when scheduledBothDatesInRange is false', () => {
    const { db } = createMockDb();
    const conditions = buildActivityFindAllConditions({
      filters: baseFilters({
        startDateFrom: '2026-05-01',
        startDateTo: '2026-05-31',
      }),
      deletedStatusId: DELETED_STATUS_ID,
      completedStatusId: COMPLETED_STATUS_ID,
      allowIncludeDeleted: false,
      db,
    });
    // 2 archive exclusions + 2 start-date bounds
    expect(conditions).toHaveLength(4);
  });

  it('adds pitch date null guard when pitchDateNotScheduled is true', () => {
    const { db } = createMockDb();
    const conditions = buildActivityFindAllConditions({
      filters: baseFilters({ pitchDateNotScheduled: true }),
      deletedStatusId: DELETED_STATUS_ID,
      completedStatusId: COMPLETED_STATUS_ID,
      allowIncludeDeleted: false,
      db,
    });
    expect(conditions).toHaveLength(3);
  });

  it('adds pitch date scheduled guard when pitchDateScheduled is true', () => {
    const { db } = createMockDb();
    const conditions = buildActivityFindAllConditions({
      filters: baseFilters({ pitchDateScheduled: true }),
      deletedStatusId: DELETED_STATUS_ID,
      completedStatusId: COMPLETED_STATUS_ID,
      allowIncludeDeleted: false,
      db,
    });
    // 2 archive exclusions + isNotNull + non-empty guard
    expect(conditions).toHaveLength(4);
  });

  it('builds confirmed-status exists queries for date and time filters', () => {
    const { select, db } = createMockDb();
    buildActivityFindAllConditions({
      filters: baseFilters({
        dateConfirmedFilter: 'confirmed',
        timeConfirmedFilter: 'not_confirmed',
      }),
      deletedStatusId: DELETED_STATUS_ID,
      completedStatusId: COMPLETED_STATUS_ID,
      allowIncludeDeleted: false,
      db,
    });
    expect(select).toHaveBeenCalledTimes(2);
  });

  it('builds an exists subquery for event planner lead filter', () => {
    const { select, db } = createMockDb();
    buildActivityFindAllConditions({
      filters: baseFilters({ eventPlannerLeadIds: [50, 51] }),
      deletedStatusId: DELETED_STATUS_ID,
      completedStatusId: COMPLETED_STATUS_ID,
      allowIncludeDeleted: false,
      db,
    });
    expect(select).toHaveBeenCalledTimes(1);
  });

  it('builds an exists subquery for translation language filter', () => {
    const { select, db } = createMockDb();
    buildActivityFindAllConditions({
      filters: baseFilters({ translationLanguageIds: [3] }),
      deletedStatusId: DELETED_STATUS_ID,
      completedStatusId: COMPLETED_STATUS_ID,
      allowIncludeDeleted: false,
      db,
    });
    expect(select).toHaveBeenCalledTimes(1);
  });

  it('builds an exists subquery for pitch required status names', () => {
    const { select, db } = createMockDb();
    buildActivityFindAllConditions({
      filters: baseFilters({ pitchRequiredStatusNames: ['Required'] }),
      deletedStatusId: DELETED_STATUS_ID,
      completedStatusId: COMPLETED_STATUS_ID,
      allowIncludeDeleted: false,
      db,
    });
    expect(select).toHaveBeenCalledTimes(1);
  });

  it('adds a direct inArray condition for translation required status ids', () => {
    const { select, db } = createMockDb();
    const conditions = buildActivityFindAllConditions({
      filters: baseFilters({ translationRequiredStatusIds: [2] }),
      deletedStatusId: DELETED_STATUS_ID,
      completedStatusId: COMPLETED_STATUS_ID,
      allowIncludeDeleted: false,
      db,
    });
    // 2 archive exclusions + 1 inArray on activities.translationsRequiredStatusId
    expect(conditions).toHaveLength(3);
    expect(select).not.toHaveBeenCalled();
  });
});
