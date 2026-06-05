import { describe, expect, it } from 'vitest';

import type { ReportDataResponse } from '@corpcal/shared/api/types';

import { countReportActivities } from './report-data-utils';

const MINIMAL_REPORT: ReportDataResponse['report'] = {
  id: 1,
  name: 'test',
  displayName: 'Test',
  sortOrder: 0,
  isActive: true,
  visibility: 'global',
  config: null,
  description: null,
};

describe('countReportActivities', () => {
  it('returns 0 when data is undefined', () => {
    expect(countReportActivities(undefined)).toBe(0);
  });

  it('sums activities across sections', () => {
    expect(
      countReportActivities({
        report: MINIMAL_REPORT,
        sections: [
          {
            id: 'a',
            name: 'A',
            order: 0,
            activities: [{ id: 1 }, { id: 2 }] as never[],
          },
          {
            id: 'b',
            name: 'B',
            order: 1,
            activities: [{ id: 3 }] as never[],
          },
        ],
      })
    ).toBe(3);
  });

  it('counts rows when meta is missing', () => {
    expect(
      countReportActivities({
        report: MINIMAL_REPORT,
        sections: [
          { id: 'a', name: 'A', order: 0, activities: [{ id: 1 }] as never[] },
        ],
      })
    ).toBe(1);
  });
});
