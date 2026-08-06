import { describe, expect, it } from 'vitest';

import { DEFAULT_ACTIVITY_FILTER_STATE } from '@corpcal/shared';

import {
  ACTIVITY_FILTER_DETAIL_POPOVER_MAX_VALUES_PER_ROW,
  buildActivityFilterSummaryLines,
  buildActivityFilterSummaryLinesForDetailPopover,
  clearSavedFilterChip,
  getAppliedActivityFilterTypeLabels,
  type ActivityFilterSummaryContext,
} from './activity-filter-summary';

const emptyCtx: ActivityFilterSummaryContext = {
  statusOptions: [],
  pitchRequiredStatusOptions: [],
  tagOptions: [],
  ministryOptions: [],
  organizationOptions: [],
  commsContactOptions: [],
  eventPlannerOptions: [],
  translationStatusOptions: [],
  translationOptions: [],
};

describe('getAppliedActivityFilterTypeLabels', () => {
  it('returns labels in chip-row order', () => {
    const labels = getAppliedActivityFilterTypeLabels(
      {
        ...DEFAULT_ACTIVITY_FILTER_STATE,
        categoryIds: [1],
        activityStatusIds: [1],
      },
      'kw',
      {
        ...emptyCtx,
        categoryOptions: [{ value: '1', label: 'Alpha' }],
        statusOptions: [{ value: '1', label: 'Published' }],
      }
    );
    expect(labels).toEqual(['Search', 'Category', 'Status']);
  });
});

describe('buildActivityFilterSummaryLines', () => {
  it('includes search when keyword is non-empty', () => {
    const lines = buildActivityFilterSummaryLines(
      DEFAULT_ACTIVITY_FILTER_STATE,
      '  hello ',
      emptyCtx
    );
    expect(lines).toEqual([{ label: 'Search', value: 'hello' }]);
  });

  it('formats scheduled date range', () => {
    const lines = buildActivityFilterSummaryLines(
      {
        ...DEFAULT_ACTIVITY_FILTER_STATE,
        dateRange: {
          startDate: '2026-03-26',
          endDate: '2026-03-28',
          noStartDate: false,
          noEndDate: false,
        },
      },
      '',
      emptyCtx
    );
    expect(lines[0]).toEqual({
      label: 'Date',
      value: 'Mar 26, 2026 – Mar 28, 2026',
    });
  });

  it('resolves status ids via options', () => {
    const lines = buildActivityFilterSummaryLines(
      {
        ...DEFAULT_ACTIVITY_FILTER_STATE,
        activityStatusIds: [2],
      },
      '',
      {
        ...emptyCtx,
        statusOptions: [{ value: '2', label: 'Published' }],
      }
    );
    expect(lines).toContainEqual({
      label: 'Status',
      value: 'Published',
    });
  });

  it('maps translation language ids to labels', () => {
    const lines = buildActivityFilterSummaryLines(
      {
        ...DEFAULT_ACTIVITY_FILTER_STATE,
        translationLanguageIds: [5],
      },
      '',
      {
        ...emptyCtx,
        translationOptions: [{ value: '5', label: 'ZH-HANS' }],
      }
    );
    expect(lines).toContainEqual({
      label: 'Languages',
      value: 'ZH-HANS',
    });
  });
});

describe('buildActivityFilterSummaryLinesForDetailPopover', () => {
  it('truncates more than ACTIVITY_FILTER_DETAIL_POPOVER_MAX_VALUES_PER_ROW tag labels', () => {
    const ids = Array.from(
      { length: ACTIVITY_FILTER_DETAIL_POPOVER_MAX_VALUES_PER_ROW + 1 },
      (_, i) => i + 1
    );
    const tagOptions = ids.map((id) => ({
      value: String(id),
      label: `Tag ${id}`,
    }));
    const lines = buildActivityFilterSummaryLinesForDetailPopover(
      { ...DEFAULT_ACTIVITY_FILTER_STATE, tagIds: ids },
      '',
      { ...emptyCtx, tagOptions }
    );
    const tagsLine = lines.find((l) => l.label === 'Tags');
    expect(tagsLine).toBeDefined();
    expect(tagsLine?.value).toContain('+1 more');
    expect(tagsLine?.value.startsWith('Tag 1')).toBe(true);
  });

  it('does not truncate when value count is at the limit', () => {
    const ids = Array.from(
      { length: ACTIVITY_FILTER_DETAIL_POPOVER_MAX_VALUES_PER_ROW },
      (_, i) => i + 1
    );
    const tagOptions = ids.map((id) => ({
      value: String(id),
      label: `Tag ${id}`,
    }));
    const lines = buildActivityFilterSummaryLinesForDetailPopover(
      { ...DEFAULT_ACTIVITY_FILTER_STATE, tagIds: ids },
      '',
      { ...emptyCtx, tagOptions }
    );
    const tagsLine = lines.find((l) => l.label === 'Tags');
    expect(tagsLine?.value.includes('more')).toBe(false);
    expect(tagsLine?.value.split(', ').length).toBe(
      ACTIVITY_FILTER_DETAIL_POPOVER_MAX_VALUES_PER_ROW
    );
  });
});

describe('clearSavedFilterChip', () => {
  it('clears search keyword only for search chip', () => {
    const next = clearSavedFilterChip(
      'search',
      DEFAULT_ACTIVITY_FILTER_STATE,
      'hello'
    );
    expect(next.searchKeyword).toBe('');
    expect(next.filterState).toBe(DEFAULT_ACTIVITY_FILTER_STATE);
  });

  it('removes a single tag id', () => {
    const next = clearSavedFilterChip(
      'tag:2',
      { ...DEFAULT_ACTIVITY_FILTER_STATE, tagIds: [1, 2, 3] },
      ''
    );
    expect(next.filterState.tagIds).toEqual([1, 3]);
  });

  it('removes one category id', () => {
    const next = clearSavedFilterChip(
      'category:1',
      {
        ...DEFAULT_ACTIVITY_FILTER_STATE,
        categoryIds: [1, 2],
      },
      ''
    );
    expect(next.filterState.categoryIds).toEqual([2]);
  });
});
