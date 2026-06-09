import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ActivityResponse } from '@corpcal/shared/api/types';
import {
  defaultThirtySixtyNinetyDateRange,
  resolveThirtySixtyNinetyQueryWindow,
} from '@corpcal/shared/reports/thirty-sixty-ninety';
import { reportDataQuerySchema } from '@corpcal/shared/schemas';

import { ReportsService } from './reports.service';

function createActivity(
  id: number,
  startDate = '2026-05-15'
): ActivityResponse {
  return {
    id,
    displayId: `ACT-${id}`,
    isConfidential: false,
    title: `Activity ${id}`,
    startDate,
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
  const lookupsService = {} as never;

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
      lookupsService
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
    expect(activitiesService.findAll).toHaveBeenCalledTimes(1);
    expect(activitiesService.findAll.mock.calls[0]?.[0]).toMatchObject({
      startDateFrom: expectedRange.start,
      startDateTo: expectedRange.end,
    });
    expect(result.meta?.resolvedDateRange).toEqual({
      start: expectedRange.start,
      end: expectedRange.end,
    });
  });

  it('uses one activity query for the requested date window', async () => {
    await service.getReportData(
      'thirty-sixty-ninety',
      reportDataQuerySchema.parse({
        startDateFrom: '2026-05-01',
        startDateTo: '2026-06-30',
      }),
      ctx
    );

    expect(activitiesService.findAll).toHaveBeenCalledTimes(1);
    expect(activitiesService.findAll.mock.calls[0]?.[0]).toMatchObject({
      startDateFrom: '2026-05-01',
      startDateTo: '2026-06-30',
    });
  });

  it('groups activities into calendar month sections from a single query', async () => {
    activitiesService.findAll.mockResolvedValue([
      createActivity(10, '2026-05-10'),
      createActivity(20, '2026-06-05'),
    ]);

    const result = await service.getReportData(
      'thirty-sixty-ninety',
      reportDataQuerySchema.parse({
        startDateFrom: '2026-05-01',
        startDateTo: '2026-06-30',
      }),
      ctx
    );

    expect(result.sections).toHaveLength(2);
    expect(
      result.sections[0]?.activities.map((activity) => activity.id)
    ).toEqual([10]);
    expect(
      result.sections[1]?.activities.map((activity) => activity.id)
    ).toEqual([20]);
  });

  it('derives a bounded future query when only start is provided', async () => {
    const window = resolveThirtySixtyNinetyQueryWindow({
      startDateFrom: '2026-05-01',
    });

    await service.getReportData(
      'thirty-sixty-ninety',
      reportDataQuerySchema.parse({
        startDateFrom: '2026-05-01',
      }),
      ctx
    );

    expect(activitiesService.findAll).toHaveBeenCalledTimes(1);
    expect(activitiesService.findAll.mock.calls[0]?.[0]).toMatchObject({
      startDateFrom: '2026-05-01',
      startDateTo: window.queryStartDateTo,
    });
  });

  it('derives a bounded past query when only end is provided', async () => {
    const window = resolveThirtySixtyNinetyQueryWindow({
      startDateTo: '2026-06-30',
    });

    await service.getReportData(
      'thirty-sixty-ninety',
      reportDataQuerySchema.parse({
        startDateTo: '2026-06-30',
      }),
      ctx
    );

    expect(activitiesService.findAll).toHaveBeenCalledTimes(1);
    expect(activitiesService.findAll.mock.calls[0]?.[0]).toMatchObject({
      startDateFrom: window.queryStartDateFrom,
      startDateTo: '2026-06-30',
    });
  });

  it('filters omitted activities out of each month section', async () => {
    const retainedActivityDate = '2026-05-10';
    const omittedActivityDate = '2026-05-12';
    const expectedSectionId = retainedActivityDate.slice(0, 7);

    activitiesService.findAll.mockResolvedValue([
      createActivity(10, retainedActivityDate),
      createActivity(11, omittedActivityDate),
    ]);
    vi.spyOn(service, 'getActivitiesForReport').mockResolvedValue([
      { activityId: 11, omitted: true },
    ]);

    const result = await service.getReportData(
      'thirty-sixty-ninety',
      reportDataQuerySchema.parse({
        startDateFrom: '2026-05-01',
        startDateTo: '2026-05-31',
      }),
      ctx
    );

    const matchingSection = result.sections.find(
      (section) => section.id === expectedSectionId
    );
    expect(matchingSection).toBeDefined();
    expect(matchingSection?.activities.map((activity) => activity.id)).toEqual([
      10,
    ]);
    expect(result.sections).toHaveLength(1);
  });

  it('passes array filter params through to findAll', async () => {
    await service.getReportData(
      'thirty-sixty-ninety',
      reportDataQuerySchema.parse({
        tagIds: '1,2',
        activityStatusIds: '3',
        categoryNames: 'Event,FYI',
      }),
      ctx
    );

    expect(activitiesService.findAll).toHaveBeenCalledTimes(1);
    expect(activitiesService.findAll.mock.calls[0]?.[0]).toMatchObject({
      tagIds: [1, 2],
      activityStatusIds: [3],
      categoryNames: ['Event', 'FYI'],
    });
  });
});
