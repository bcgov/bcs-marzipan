import { describe, expect, it } from 'vitest';

import { countReportActivities } from './report-data-utils';

describe('countReportActivities', () => {
  it('returns 0 when data is undefined', () => {
    expect(countReportActivities(undefined)).toBe(0);
  });

  it('sums activities across sections', () => {
    expect(
      countReportActivities({
        report: { id: 1, name: 'test', displayName: 'Test', config: null },
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
        report: { id: 1, name: 'test', displayName: 'Test', config: null },
        sections: [
          { id: 'a', name: 'A', order: 0, activities: [{ id: 1 }] as never[] },
        ],
      })
    ).toBe(1);
  });
});
