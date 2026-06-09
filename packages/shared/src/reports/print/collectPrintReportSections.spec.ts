import { describe, expect, it } from 'vitest';

import type { ReportDataResponse } from '../../api/report-data';
import { toCalendarDateString } from '../../datetime/types';
import { createMockActivityListItem } from '../../test-utils';
import { collectPrintReportSections } from './collectPrintReportSections';

describe('collectPrintReportSections', () => {
  it('buckets spanning activities under the first in-range report day', () => {
    const data: ReportDataResponse = {
      report: {
        id: 1,
        name: 'look-ahead',
        displayName: 'Look Ahead',
        sortOrder: 1,
        isActive: true,
        visibility: 'team',
        config: {
          fields: ['startDate', 'title'],
          sections: [
            {
              id: 'events',
              name: 'Events',
              order: 1,
              filter: { lookAheadSection: 'events' },
              printPerDayColumnHeaderRepeat: true,
            },
          ],
        },
        description: null,
      },
      sections: [
        {
          id: 'events',
          name: 'Events',
          order: 1,
          activities: [
            createMockActivityListItem({
              id: 1,
              startDate: '2025-06-01',
              endDate: '2025-06-30',
              title: 'Spanning event',
            }),
          ],
        },
      ],
      meta: {
        resolvedDateRange: {
          start: toCalendarDateString('2025-06-16'),
          end: toCalendarDateString('2025-06-24'),
        },
        activityCount: 1,
        wasClamped: false,
        inferredBound: null,
        largeResultWarning: false,
      },
    };

    const sections = collectPrintReportSections(data);
    const events = sections[0];
    expect(events.activitiesByKey.get('2025-06-16')).toHaveLength(1);
    expect(events.activitiesByKey.has('2025-06-01')).toBe(false);
  });
});
