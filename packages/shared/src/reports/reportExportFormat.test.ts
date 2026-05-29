import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ActivityResponse, ReportResponse } from '../api/types';
import { buildReportExportTable } from './reportExportFormat';

describe('buildReportExportTable', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const minimalReport = {
    id: 1,
    name: 'look-ahead',
    displayName: 'Look Ahead',
    sortOrder: 0,
    isActive: true,
    visibility: 'global',
    config: { fields: ['displayId', 'title'] },
    description: null,
  } as ReportResponse;

  it('passes through YYYY-MM-DD startDate verbatim', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const table = buildReportExportTable({
      report: minimalReport,
      sections: [
        {
          name: 'Section A',
          activities: [
            {
              displayId: 'A-1',
              title: 'Act',
              startDate: '2026-04-27',
              startTime: '09:30',
              lookAheadStatus: 'ok',
              executiveSummary: null,
              summary: null,
            } as unknown as ActivityResponse,
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
      report: minimalReport,
      sections: [
        {
          name: 'Section A',
          activities: [
            {
              displayId: 'A-1',
              title: 'Act',
              startDate: '2026-04-27T00:00:00.000Z',
              startTime: '',
              lookAheadStatus: '',
              executiveSummary: null,
              summary: null,
            } as unknown as ActivityResponse,
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
