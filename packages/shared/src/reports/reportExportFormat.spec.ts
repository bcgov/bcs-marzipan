import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ReportResponse } from '../schemas/lookup.schema';
import { createMockActivityListItem } from '../test-utils';
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
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('buildReportExportTable produces aligned columns and rows', () => {
    const table = buildReportExportTable({
      report: minimalReport,
      sections: [
        {
          name: 'Sec A',
          activities: [
            createMockActivityListItem({
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
            createMockActivityListItem({
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

  it('passes through YYYY-MM-DD startDate verbatim', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const table = buildReportExportTable({
      report: {
        ...minimalReport,
        sortOrder: 0,
        visibility: 'global',
        config: {
          fields: ['displayId', 'title'],
          sections: [{ id: 'events', name: 'Events', order: 1 }],
        },
      },
      sections: [
        {
          name: 'Section A',
          activities: [
            createMockActivityListItem({
              displayId: 'A-1',
              title: 'Act',
              startDate: '2026-04-27',
              startTime: '09:30',
              lookAheadStatus: 'none',
              summary: '',
            }),
          ],
        },
      ],
    });
    expect(table.rows[0]?.[1]).toBe('2026-04-27');
    expect(warn).not.toHaveBeenCalled();
  });

  it('omits date and logs when startDate is not YYYY-MM-DD', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const table = buildReportExportTable({
      report: {
        ...minimalReport,
        sortOrder: 0,
        visibility: 'global',
        config: {
          fields: ['displayId', 'title'],
          sections: [{ id: 'events', name: 'Events', order: 1 }],
        },
      },
      sections: [
        {
          name: 'Section A',
          activities: [
            createMockActivityListItem({
              displayId: 'A-1',
              title: 'Act',
              startDate: '2026-04-27T00:00:00.000Z',
              startTime: null,
              lookAheadStatus: null,
              summary: '',
            }),
          ],
        },
      ],
    });
    expect(table.rows[0]?.[1]).toBe('');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(
      /activity\.startDate must be YYYY-MM-DD/i
    );
  });
});
