import { describe, expect, it } from 'vitest';

import type { ReportDataResponse } from '../../../api/report-data';
import { toCalendarDateString } from '../../../datetime/types';
import { buildLookAheadCoverDateRangeLine } from './lookAheadCoverDateRange';

describe('buildLookAheadCoverDateRangeLine', () => {
  it('uses meta.resolvedDateRange when present', () => {
    const data: ReportDataResponse = {
      report: {
        id: 1,
        name: 'look-ahead',
        displayName: 'Look Ahead',
        sortOrder: 1,
        isActive: true,
        visibility: 'global',
        config: null,
        description: null,
      },
      sections: [],
      meta: {
        resolvedDateRange: {
          start: toCalendarDateString('2026-04-28'),
          end: toCalendarDateString('2026-05-04'),
        },
        wasClamped: false,
        inferredBound: null,
        activityCount: 0,
        largeResultWarning: false,
      },
    };

    expect(buildLookAheadCoverDateRangeLine(data)).toBe(
      'Tue, Apr 28, 2026 to Mon, May 4, 2026'
    );
  });

  it('returns empty when resolvedDateRange is missing', () => {
    const data: ReportDataResponse = {
      report: {
        id: 1,
        name: 'look-ahead',
        displayName: 'Look Ahead',
        sortOrder: 1,
        isActive: true,
        visibility: 'global',
        config: null,
        description: null,
      },
      sections: [],
    };

    expect(buildLookAheadCoverDateRangeLine(data)).toBe('');
  });
});
