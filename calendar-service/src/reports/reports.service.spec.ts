import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ActivityResponse } from '@corpcal/shared/api/types';
import { defaultThirtySixtyNinetyDateRange } from '@corpcal/shared/reports/thirty-sixty-ninety';
import { reportDataQuerySchema } from '@corpcal/shared/schemas';

import { ReportsService } from './reports.service';

function createActivity(id: number): ActivityResponse {
  return {
    id,
    displayId: `ACT-${id}`,
    isConfidential: false,
    title: `Activity ${id}`,
  } as ActivityResponse;
}

describe('ReportsService.getReportData (thirty-sixty-ninety)', () => {
  const activitiesService = {
    findAll: vi.fn(),
  };
  const databaseService = {
    db: {},
  };
  const pdfGeneratorService = {};
  const configService = {
    get: vi.fn(),
  };
  const applicationSettings = {};
  const lookupsService = {};

  let service: ReportsService;
  const ctx = {} as never;
  const defaultQuery = reportDataQuerySchema.parse({});

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ReportsService(
      databaseService as never,
      activitiesService as never,
      pdfGeneratorService as never,
      configService as never,
      applicationSettings as never,
      lookupsService as never
    );

    vi.spyOn(service, 'findReportByName').mockResolvedValue({
      id: 2,
      name: 'thirty-sixty-ninety',
      displayName: '30/60/90',
      sortOrder: 2,
      isActive: true,
      visibility: 'team',
      config: {
        fields: ['startDate', 'title'],
        sections: [],
      },
      description: null,
    });
    vi.spyOn(service, 'getActivitiesForReport').mockResolvedValue([]);
    activitiesService.findAll.mockResolvedValue([]);
  });

  it('builds calendar month sections from the default three-month window', async () => {
    const expectedRange = defaultThirtySixtyNinetyDateRange(3);

    const result = await service.getReportData(
      'thirty-sixty-ninety',
      defaultQuery,
      ctx
    );

    expect(result.sections).toHaveLength(3);
    expect(result.sections.map((section) => section.name)).toEqual([
      expect.stringMatching(/^[A-Z][a-z]+ \d{4}$/),
      expect.stringMatching(/^[A-Z][a-z]+ \d{4}$/),
      expect.stringMatching(/^[A-Z][a-z]+ \d{4}$/),
    ]);
    expect(activitiesService.findAll).toHaveBeenCalledTimes(3);
    expect(activitiesService.findAll.mock.calls[0]?.[0]).toMatchObject({
      startDateFrom: expectedRange.start,
      startDateTo: expect.any(String),
    });
  });

  it('uses the requested date window when start and end dates are provided', async () => {
    await service.getReportData(
      'thirty-sixty-ninety',
      reportDataQuerySchema.parse({
        startDateFrom: '2026-05-01',
        startDateTo: '2026-06-30',
      }),
      ctx
    );

    expect(activitiesService.findAll).toHaveBeenCalledTimes(2);
    expect(activitiesService.findAll.mock.calls[0]?.[0]).toMatchObject({
      startDateFrom: '2026-05-01',
      startDateTo: '2026-05-31',
    });
    expect(activitiesService.findAll.mock.calls[1]?.[0]).toMatchObject({
      startDateFrom: '2026-06-01',
      startDateTo: '2026-06-30',
    });
  });

  it('filters omitted activities out of each month section', async () => {
    activitiesService.findAll.mockResolvedValue([
      createActivity(10),
      createActivity(11),
    ]);
    vi.spyOn(service, 'getActivitiesForReport').mockResolvedValue([
      { activityId: 11, omitted: true },
    ]);

    const result = await service.getReportData(
      'thirty-sixty-ninety',
      defaultQuery,
      ctx
    );

    for (const section of result.sections) {
      expect(section.activities.map((activity) => activity.id)).toEqual([10]);
    }
  });
});
