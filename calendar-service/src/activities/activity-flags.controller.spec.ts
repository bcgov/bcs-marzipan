import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import 'reflect-metadata';

import type { AuthUser } from '@corpcal/shared';

import { PERMISSIONS_METADATA_KEY } from '../policy/decorators/require-permission.decorator';
import { ActivitiesGateway } from './activities.gateway';
import { ActivityFlagsController } from './activity-flags.controller';
import { ActivityFlagsService } from './services/activity-flags.service';

describe('ActivityFlagsController', () => {
  let controller: ActivityFlagsController;

  const mockFlagsService = {
    syncFlags: vi.fn().mockResolvedValue({
      addedAssigneeIds: [],
      removedAssigneeIds: [],
    }),
    removeAssigneeFlag: vi.fn().mockResolvedValue(undefined),
    removeFlag: vi.fn().mockResolvedValue(undefined),
  };

  const mockGateway = {
    broadcastActivityUpdated: vi.fn(),
  };

  const mockUser = {
    id: 7,
    teamIds: [10, 20],
  } as unknown as AuthUser;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivityFlagsController],
      providers: [
        {
          provide: ActivityFlagsService,
          useValue: mockFlagsService,
        },
        {
          provide: ActivitiesGateway,
          useValue: mockGateway,
        },
      ],
    }).compile();

    controller = module.get(ActivityFlagsController);
    vi.clearAllMocks();
  });

  it('marks write endpoints with activities.flag permission metadata', () => {
    const expected = { keys: ['activities.flag'], mode: 'any' as const };
    const handlers = ActivityFlagsController.prototype as Record<
      'upsertFlag' | 'syncFlags',
      (...args: unknown[]) => unknown
    >;
    // SWC attaches SetMetadata to the handler function (same target as PermissionsGuard).
    expect(
      Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handlers.upsertFlag)
    ).toEqual(expected);
    expect(
      Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handlers.syncFlags)
    ).toEqual(expected);
  });

  it('syncs a single assignee for the legacy flag route when the caller is on the team', async () => {
    const result = await controller.upsertFlag(
      42,
      {
        teamId: 10,
        assigneeId: 88,
        note: 'follow up',
      },
      mockUser
    );

    expect(result).toEqual({ success: true });
    expect(mockFlagsService.syncFlags).toHaveBeenCalledWith(
      42,
      10,
      [88],
      7,
      'follow up'
    );
    expect(mockGateway.broadcastActivityUpdated).toHaveBeenCalledWith(42);
  });

  it('rejects the legacy flag route when the caller is not on the team', async () => {
    await expect(
      controller.upsertFlag(
        42,
        {
          teamId: 99,
          assigneeId: 88,
          note: 'follow up',
        },
        mockUser
      )
    ).rejects.toThrow(ForbiddenException);

    expect(mockFlagsService.syncFlags).not.toHaveBeenCalled();
    expect(mockGateway.broadcastActivityUpdated).not.toHaveBeenCalled();
  });

  it('passes the full assignee list through the multi-assignee endpoint', async () => {
    await controller.syncFlags(
      42,
      {
        teamId: 10,
        assigneeIds: [88, 89],
        note: 'bulk sync',
        displayTeamPerAssignee: { 88: 10, 89: null },
      },
      mockUser
    );

    expect(mockFlagsService.syncFlags).toHaveBeenCalledWith(
      42,
      10,
      [88, 89],
      7,
      'bulk sync',
      { 88: 10, 89: null }
    );
    expect(mockGateway.broadcastActivityUpdated).toHaveBeenCalledWith(42);
  });
});
