import { describe, expect, it, vi } from 'vitest';

import {
  activityDateSpanOverlapsRange,
  activityScheduledRangeOverlaps,
  type DateRangeValue,
} from '@corpcal/shared';
import type { FilterActivitiesQueryParams } from '@corpcal/shared/schemas';

import {
  DEFAULT_DATA_SCOPE,
  resolveDataScope,
  type DataScope,
} from '../../policy/dto/user-context.dto';
import {
  buildActivityFindAllConditions,
  buildActivityVisibilityCondition,
  buildScheduledWindowOverlapConditions,
  hasActivityFindAllFilterFields,
} from './activity-find-all-filters';

const DELETED_STATUS_ID = 99;
const COMPLETED_STATUS_ID = 5;
/** Bypass visibility so filter-only tests stay focused on non-visibility conditions. */
const BYPASS_DATA_SCOPE: DataScope = { teamIds: [], bypass: true };

type ScheduledWindowFilters = Pick<
  FilterActivitiesQueryParams,
  'startDateFrom' | 'startDateTo' | 'scheduledDateRangeOverlaps'
>;

/** Mirrors `buildScheduledWindowOverlapConditions` semantics for parity tests. */
function activityMatchesScheduledWindowOverlap(
  startDate: string | null,
  endDate: string | null,
  filters: ScheduledWindowFilters
): boolean {
  const hasLower =
    filters.startDateFrom != null && filters.startDateFrom !== '';
  const hasUpper = filters.startDateTo != null && filters.startDateTo !== '';
  if (!hasLower && !hasUpper) {
    if (filters.scheduledDateRangeOverlaps === true) {
      return (
        startDate != null &&
        startDate !== '' &&
        endDate != null &&
        endDate !== ''
      );
    }
    return true;
  }

  if (startDate == null || startDate === '') return false;

  const requireFullSpan = filters.scheduledDateRangeOverlaps === true;
  if (requireFullSpan && (endDate == null || endDate === '')) return false;

  const effectiveEnd = requireFullSpan ? endDate! : (endDate ?? startDate);

  if (hasLower && effectiveEnd < filters.startDateFrom!) return false;
  if (hasUpper && startDate > filters.startDateTo!) return false;
  return true;
}

function scheduledWindowToDateRange(
  filters: ScheduledWindowFilters
): DateRangeValue {
  return {
    startDate: filters.startDateFrom ?? '',
    endDate: filters.startDateTo ?? '',
    noStartDate: filters.startDateFrom == null || filters.startDateFrom === '',
    noEndDate: filters.startDateTo == null || filters.startDateTo === '',
  };
}

function sharedScheduledOverlapPredicate(
  startDate: string | null,
  endDate: string | null,
  filters: ScheduledWindowFilters
): boolean {
  const range = scheduledWindowToDateRange(filters);
  return filters.scheduledDateRangeOverlaps === true
    ? activityScheduledRangeOverlaps(startDate, endDate, range)
    : activityDateSpanOverlapsRange(startDate, endDate, range);
}

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
    ['scheduledDateRangeOverlaps', { scheduledDateRangeOverlaps: true }],
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
      dataScope: BYPASS_DATA_SCOPE,
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
      dataScope: BYPASS_DATA_SCOPE,
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
      dataScope: BYPASS_DATA_SCOPE,
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
      dataScope: BYPASS_DATA_SCOPE,
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
      dataScope: BYPASS_DATA_SCOPE,
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
      dataScope: BYPASS_DATA_SCOPE,
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
      dataScope: BYPASS_DATA_SCOPE,
    });
    expect(select).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalled();
  });

  it('requires full span overlap when scheduledDateRangeOverlaps is true', () => {
    const { db } = createMockDb();
    const conditions = buildActivityFindAllConditions({
      filters: baseFilters({
        scheduledDateRangeOverlaps: true,
        startDateFrom: '2026-05-01',
        startDateTo: '2026-05-31',
      }),
      deletedStatusId: DELETED_STATUS_ID,
      completedStatusId: COMPLETED_STATUS_ID,
      allowIncludeDeleted: false,
      db,
      dataScope: BYPASS_DATA_SCOPE,
    });
    // 1 start guard + 1 end guard + 1 overlap lower + 1 overlap upper + 2 archive exclusions
    expect(conditions).toHaveLength(6);
  });

  it('uses span overlap when date bounds are set without the flag', () => {
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
      dataScope: BYPASS_DATA_SCOPE,
    });
    // 2 archive exclusions + 1 start guard + 1 coalesce lower + 1 upper overlap
    expect(conditions).toHaveLength(5);
  });

  it('adds pitch date null guard when pitchDateNotScheduled is true', () => {
    const { db } = createMockDb();
    const conditions = buildActivityFindAllConditions({
      filters: baseFilters({ pitchDateNotScheduled: true }),
      deletedStatusId: DELETED_STATUS_ID,
      completedStatusId: COMPLETED_STATUS_ID,
      allowIncludeDeleted: false,
      db,
      dataScope: BYPASS_DATA_SCOPE,
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
      dataScope: BYPASS_DATA_SCOPE,
    });
    // 2 archive exclusions + isNotNull
    expect(conditions).toHaveLength(3);
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
      dataScope: BYPASS_DATA_SCOPE,
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
      dataScope: BYPASS_DATA_SCOPE,
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
      dataScope: BYPASS_DATA_SCOPE,
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
      dataScope: BYPASS_DATA_SCOPE,
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
      dataScope: BYPASS_DATA_SCOPE,
    });
    // 2 archive exclusions + 1 inArray on activities.translationsRequiredStatusId
    expect(conditions).toHaveLength(3);
    expect(select).not.toHaveBeenCalled();
  });

  it('applies visibility when dataScope is resolved from missing ctx (default-deny)', () => {
    const { db } = createMockDb();
    expect(resolveDataScope(undefined)).toEqual(DEFAULT_DATA_SCOPE);
    const conditions = buildActivityFindAllConditions({
      filters: baseFilters(),
      deletedStatusId: DELETED_STATUS_ID,
      completedStatusId: COMPLETED_STATUS_ID,
      allowIncludeDeleted: false,
      db,
      dataScope: resolveDataScope(undefined),
    });
    // 2 archive exclusions + 1 visibility (global-only)
    expect(conditions).toHaveLength(3);
  });

  it('adds visibility condition for scoped users with no teams (global only)', () => {
    const { db } = createMockDb();
    const conditions = buildActivityFindAllConditions({
      filters: baseFilters(),
      deletedStatusId: DELETED_STATUS_ID,
      completedStatusId: COMPLETED_STATUS_ID,
      allowIncludeDeleted: false,
      db,
      dataScope: { teamIds: [], bypass: false },
    });
    // 2 archive exclusions + 1 visibility
    expect(conditions).toHaveLength(3);
  });

  it('adds visibility condition for scoped users with team membership', () => {
    const { select, db } = createMockDb();
    const conditions = buildActivityFindAllConditions({
      filters: baseFilters(),
      deletedStatusId: DELETED_STATUS_ID,
      completedStatusId: COMPLETED_STATUS_ID,
      allowIncludeDeleted: false,
      db,
      dataScope: { teamIds: [1, 2], bypass: false },
    });
    expect(conditions).toHaveLength(3);
    expect(select).toHaveBeenCalledTimes(1);
  });

  it('omits visibility condition when dataScope bypass is true', () => {
    const { db } = createMockDb();
    const conditions = buildActivityFindAllConditions({
      filters: baseFilters(),
      deletedStatusId: DELETED_STATUS_ID,
      completedStatusId: COMPLETED_STATUS_ID,
      allowIncludeDeleted: false,
      db,
      dataScope: { teamIds: [1], bypass: true },
    });
    expect(conditions).toHaveLength(2);
  });
});

describe('buildScheduledWindowOverlapConditions', () => {
  const window: ScheduledWindowFilters = {
    startDateFrom: '2026-05-01',
    startDateTo: '2026-05-31',
  };

  const withFlag: ScheduledWindowFilters = {
    ...window,
    scheduledDateRangeOverlaps: true,
  };

  const activities = {
    fullyInside: { start: '2026-05-10', end: '2026-05-20' },
    fullyContainsWindow: { start: '2026-04-01', end: '2026-06-30' },
    endsBeforeWindow: { start: '2026-04-01', end: '2026-04-30' },
    startsAfterWindow: { start: '2026-06-01', end: '2026-06-30' },
    overlapsStart: { start: '2026-04-15', end: '2026-05-10' },
    overlapsEnd: { start: '2026-05-20', end: '2026-06-15' },
    singleDayInWindow: { start: '2026-05-15', end: null },
    missingStart: { start: null, end: '2026-05-15' },
  } as const;

  it('returns no conditions when neither bound is set without the flag', () => {
    expect(buildScheduledWindowOverlapConditions(baseFilters())).toEqual([]);
  });

  it('returns non-null date guards when the flag is set but neither bound is set', () => {
    expect(
      buildScheduledWindowOverlapConditions(
        baseFilters({ scheduledDateRangeOverlaps: true })
      )
    ).toHaveLength(2);
  });

  it('builds open lower-bound overlap (startDateFrom only)', () => {
    const filters = baseFilters({ startDateFrom: '2026-05-01' });
    expect(buildScheduledWindowOverlapConditions(filters)).toHaveLength(2);
    expect(
      activityMatchesScheduledWindowOverlap(
        activities.endsBeforeWindow.start,
        activities.endsBeforeWindow.end,
        filters
      )
    ).toBe(false);
    expect(
      activityMatchesScheduledWindowOverlap(
        activities.overlapsEnd.start,
        activities.overlapsEnd.end,
        filters
      )
    ).toBe(true);
  });

  it('builds open upper-bound overlap (startDateTo only)', () => {
    const filters = baseFilters({ startDateTo: '2026-05-31' });
    expect(buildScheduledWindowOverlapConditions(filters)).toHaveLength(2);
    expect(
      activityMatchesScheduledWindowOverlap(
        activities.startsAfterWindow.start,
        activities.startsAfterWindow.end,
        filters
      )
    ).toBe(false);
    expect(
      activityMatchesScheduledWindowOverlap(
        activities.overlapsStart.start,
        activities.overlapsStart.end,
        filters
      )
    ).toBe(true);
  });

  it.each([
    ['fully inside', activities.fullyInside, true],
    ['fully contains window', activities.fullyContainsWindow, true],
    ['ends before window', activities.endsBeforeWindow, false],
    ['starts after window', activities.startsAfterWindow, false],
    ['overlaps start edge', activities.overlapsStart, true],
    ['overlaps end edge', activities.overlapsEnd, true],
    ['missing start', activities.missingStart, false],
  ] as const)(
    'with scheduledDateRangeOverlaps: %s => %s',
    (_label, activity, expected) => {
      expect(
        activityMatchesScheduledWindowOverlap(
          activity.start,
          activity.end,
          withFlag
        )
      ).toBe(expected);
      expect(
        sharedScheduledOverlapPredicate(activity.start, activity.end, withFlag)
      ).toBe(expected);
    }
  );

  it('requires both activity dates when scheduledDateRangeOverlaps is true', () => {
    expect(
      activityMatchesScheduledWindowOverlap(
        activities.singleDayInWindow.start,
        activities.singleDayInWindow.end,
        withFlag
      )
    ).toBe(false);
    expect(
      sharedScheduledOverlapPredicate(
        activities.singleDayInWindow.start,
        activities.singleDayInWindow.end,
        withFlag
      )
    ).toBe(false);
    expect(
      buildScheduledWindowOverlapConditions(baseFilters(withFlag))
    ).toHaveLength(4);
  });

  it('treats missing end as single-day overlap without the flag', () => {
    const filters = baseFilters(window);
    expect(
      activityMatchesScheduledWindowOverlap(
        activities.singleDayInWindow.start,
        activities.singleDayInWindow.end,
        filters
      )
    ).toBe(true);
    expect(
      sharedScheduledOverlapPredicate(
        activities.singleDayInWindow.start,
        activities.singleDayInWindow.end,
        filters
      )
    ).toBe(true);
    expect(buildScheduledWindowOverlapConditions(filters)).toHaveLength(3);
  });

  it('matches shared overlap predicates for calendar-date fixtures', () => {
    const cases = [
      activities.fullyInside,
      activities.fullyContainsWindow,
      activities.endsBeforeWindow,
      activities.startsAfterWindow,
      activities.overlapsStart,
      activities.overlapsEnd,
      activities.singleDayInWindow,
      activities.missingStart,
    ];
    for (const activity of cases) {
      for (const filters of [window, withFlag]) {
        expect(
          activityMatchesScheduledWindowOverlap(
            activity.start,
            activity.end,
            filters
          )
        ).toBe(
          sharedScheduledOverlapPredicate(activity.start, activity.end, filters)
        );
      }
    }
  });
});

describe('buildActivityVisibilityCondition', () => {
  it('uses global-only match when teamIds is empty', () => {
    const { select, db } = createMockDb();
    buildActivityVisibilityCondition(db, []);
    expect(select).not.toHaveBeenCalled();
  });

  it('builds shared-with exists subquery when teamIds is non-empty', () => {
    const { select, db } = createMockDb();
    buildActivityVisibilityCondition(db, [10, 20]);
    expect(select).toHaveBeenCalledTimes(1);
  });
});
