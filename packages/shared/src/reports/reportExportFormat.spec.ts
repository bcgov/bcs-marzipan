import { describe, expect, it } from 'vitest';

import type { ReportResponse } from '../schemas/lookup.schema';
import { createMockActivityResponse } from '../test-utils';
import {
  buildReportExportTable,
  serializeReportTableToCsv,
} from './reportExportFormat';

const minimalReport = {
  id: 1,
  name: 'look-ahead',
  displayName: 'Look Ahead',
  sortOrder: 1,
  isActive: true,
  visibility: 'team' as const,
  config: null,
  description: null,
} satisfies ReportResponse;

describe('reportExportFormat', () => {
  it('buildReportExportTable produces aligned columns and rows', () => {
    const table = buildReportExportTable({
      report: minimalReport,
      sections: [
        {
          name: 'Sec A',
          activities: [
            createMockActivityResponse({
              id: 1,
              title: 'T1',
              displayId: 'BC-1-2',
              startDate: '2025-03-01',
              startTime: '10:00',
              lookAheadStatus: 'new',
              summary: 'S',
              executiveSummary: 'E',
              category: [],
              tags: [],
              representativesAttending: [],
            }),
          ],
        },
      ],
    });

    expect(table.columns.length).toBe(7);
    expect(table.rows).toHaveLength(1);
    expect(table.rows[0][0]).toBe('Sec A');
    expect(table.rows[0][5]).toBe('BC-1-2');
    expect(table.rows[0][6]).toBe('BC');
  });

  it('appends event lead to Activity Details when configured', () => {
    const table = buildReportExportTable({
      report: {
        ...minimalReport,
        config: {
          fields: ['executiveSummary', 'event_lead'],
          sections: [{ id: 'events', name: 'Events', order: 1 }],
        },
      },
      sections: [
        {
          name: 'Sec A',
          activities: [
            createMockActivityResponse({
              id: 1,
              title: 'T1',
              displayId: 'BC-1-2',
              startDate: '2025-03-01',
              startTime: '10:00',
              lookAheadStatus: 'new',
              summary: 'S',
              executiveSummary: 'E',
              category: [],
              tags: [],
              representativesAttending: [],
              commsContacts: [{ userId: 2, name: 'Lead Person', isLead: true }],
            }),
          ],
        },
      ],
    });

    expect(table.rows[0][4]).toBe('T1 – E – Event lead: Lead Person');
  });

  it('serializeReportTableToCsv escapes quotes', () => {
    const csv = serializeReportTableToCsv({
      columns: ['A'],
      rows: [['say "hi"']],
    });
    expect(csv).toBe('"A"\n"say ""hi"""');
  });
});
