import { describe, expect, it } from 'vitest';

import type { ReportDataResponse } from '@corpcal/shared/api/types';

import { filterReportDataBySearchKeyword } from './report-search-filter';

const sampleData = {
  report: {
    id: 1,
    name: 'custom',
    displayName: 'Custom',
    sortOrder: 0,
    isActive: true,
    visibility: 'team',
    config: null,
    description: null,
  },
  sections: [
    {
      id: 'results',
      name: 'Results',
      order: 1,
      activities: [
        {
          id: 1,
          title: 'Budget briefing',
          displayId: 'MIN-000001',
          summary: '',
          category: [],
          tags: [],
          commsContacts: [],
          activityStatus: 'Active',
          eventPlanners: [],
          representativesAttending: [],
        },
        {
          id: 2,
          title: 'Other event',
          displayId: 'MIN-000002',
          summary: '',
          category: [],
          tags: [],
          commsContacts: [],
          activityStatus: 'Active',
          eventPlanners: [],
          representativesAttending: [],
        },
      ],
    },
  ],
  meta: {
    resolvedDateRange: { start: '2025-01-01', end: '2025-01-31' },
    wasClamped: false,
    inferredBound: null,
    activityCount: 2,
    largeResultWarning: false,
  },
} as unknown as ReportDataResponse;

describe('filterReportDataBySearchKeyword', () => {
  it('returns all activities when keyword is empty', () => {
    const result = filterReportDataBySearchKeyword(sampleData, '');
    expect(result?.sections[0]?.activities).toHaveLength(2);
    expect(result?.meta?.activityCount).toBe(2);
  });

  it('filters activities by keyword and updates meta count', () => {
    const result = filterReportDataBySearchKeyword(sampleData, 'budget');
    expect(result?.sections[0]?.activities.map((a) => a.id)).toEqual([1]);
    expect(result?.meta?.activityCount).toBe(1);
  });
});
