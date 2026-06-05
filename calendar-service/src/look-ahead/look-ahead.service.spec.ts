import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ActivityResponse } from '@corpcal/shared/api/types';

import type { RequestContext as RequestContextType } from '../policy/dto/user-context.dto';
import { LookAheadService } from './look-ahead.service';

const testCtx: RequestContextType = {
  user: undefined,
  dataScope: { teamIds: [1], bypass: false },
};

function createActivity(id: number, overrides: Partial<ActivityResponse> = {}) {
  return {
    id,
    displayId: `ACT-${id}`,
    isConfidential: false,
    title: `Activity ${id}`,
    ...overrides,
  } as ActivityResponse;
}

describe('LookAheadService', () => {
  const reportsService = {
    findReportByName: vi.fn(),
    getActivitiesForReport: vi.fn(),
  };
  const activitiesService = {
    findAll: vi.fn(),
  };

  let service: LookAheadService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new LookAheadService(
      reportsService as never,
      activitiesService as never
    );
  });

  it('includes confidential activities when not omitted from the report', async () => {
    reportsService.findReportByName.mockResolvedValue({
      id: 1,
      name: 'look-ahead',
      displayName: 'Look Ahead',
      config: {
        fields: [],
        sections: [
          {
            id: 'events',
            name: 'Events',
            order: 1,
            filter: { lookAheadSection: 'events' },
          },
        ],
      },
    });
    reportsService.getActivitiesForReport.mockResolvedValue([
      { activityId: 10, omitted: false },
      { activityId: 11, omitted: false },
    ]);
    activitiesService.findAll.mockResolvedValue([
      createActivity(10, { isConfidential: false }),
      createActivity(11, {
        isConfidential: true,
        executiveSummary: 'Hold for GCPE.',
      }),
    ]);

    const result = await service.getLookAheadData(testCtx);

    expect(activitiesService.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ lookAheadSectionValues: ['events'] }),
      testCtx,
      expect.objectContaining({ outputShape: 'list' })
    );
    expect(result.sections[0]?.activities.map((a) => a.id)).toEqual([10, 11]);
    expect(result.sections[0]?.activities[1]?.isConfidential).toBe(true);
  });

  it('still excludes activities omitted via activityReportSettings', async () => {
    reportsService.findReportByName.mockResolvedValue({
      id: 1,
      name: 'look-ahead',
      displayName: 'Look Ahead',
      config: {
        fields: [],
        sections: [
          {
            id: 'events',
            name: 'Events',
            order: 1,
            filter: { lookAheadSection: 'events' },
          },
        ],
      },
    });
    reportsService.getActivitiesForReport.mockResolvedValue([
      { activityId: 10, omitted: false },
      { activityId: 11, omitted: true },
    ]);
    activitiesService.findAll.mockResolvedValue([
      createActivity(10),
      createActivity(11, { isConfidential: true }),
    ]);

    const result = await service.getLookAheadData(testCtx);

    expect(result.sections[0]?.activities.map((a) => a.id)).toEqual([10]);
  });

  it('throws when the look-ahead report is missing', async () => {
    reportsService.findReportByName.mockResolvedValue(null);

    await expect(service.getLookAheadData(testCtx)).rejects.toBeInstanceOf(
      NotFoundException
    );
  });
});
