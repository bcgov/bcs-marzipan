import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Mock } from 'vitest';

import type { AuthUser } from '@corpcal/shared';

import { PolicyService } from '../policy.service';
import { CanRequestDeleteActivityGuard } from './can-request-delete-activity.guard';

describe('CanRequestDeleteActivityGuard', () => {
  let guard: CanRequestDeleteActivityGuard;
  let policyService: {
    isCommsContactForActivity: Mock;
    getLeadTeamIdForActivity: Mock;
  };

  beforeEach(async () => {
    policyService = {
      isCommsContactForActivity: vi.fn(),
      getLeadTeamIdForActivity: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CanRequestDeleteActivityGuard,
        {
          provide: PolicyService,
          useValue: policyService,
        },
      ],
    }).compile();

    guard = module.get<CanRequestDeleteActivityGuard>(
      CanRequestDeleteActivityGuard
    );
  });

  const createMockContext = (
    user: AuthUser | undefined,
    params: { id?: string } = { id: '1' }
  ): ExecutionContext =>
    ({
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({
          user,
          params,
        }),
      }),
    }) as unknown as ExecutionContext;

  it('should throw ForbiddenException when user is undefined', async () => {
    const ctx = createMockContext(undefined);

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(ctx)).rejects.toThrow(
      'Authentication required'
    );
    expect(policyService.isCommsContactForActivity).not.toHaveBeenCalled();
  });

  it('should return true when user is comms contact for the activity', async () => {
    const user: AuthUser = {
      id: 5,
      username: 'comms',
      displayName: 'Comms Contact',
      email: 'comms@example.com',
      roleId: 2,
      roleName: 'Editor',
      permissions: [],
      teamIds: [],
    };
    policyService.isCommsContactForActivity.mockResolvedValue(true);
    policyService.getLeadTeamIdForActivity.mockResolvedValue(10);
    const ctx = createMockContext(user, { id: '42' });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(policyService.isCommsContactForActivity).toHaveBeenCalledWith(42, 5);
  });

  it('should return true when user is in activity lead team but not comms contact', async () => {
    const user: AuthUser = {
      id: 7,
      username: 'teammate',
      displayName: 'Team Member',
      email: 'team@example.com',
      roleId: 2,
      roleName: 'Editor',
      permissions: [],
      teamIds: [10, 20],
    };
    policyService.isCommsContactForActivity.mockResolvedValue(false);
    policyService.getLeadTeamIdForActivity.mockResolvedValue(10);
    const ctx = createMockContext(user, { id: '42' });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(policyService.isCommsContactForActivity).toHaveBeenCalledWith(42, 7);
    expect(policyService.getLeadTeamIdForActivity).toHaveBeenCalledWith(42);
  });

  it('should throw ForbiddenException when user is not comms contact or lead team member', async () => {
    const user: AuthUser = {
      id: 3,
      username: 'editor',
      displayName: 'Editor User',
      email: 'editor@example.com',
      roleId: 2,
      roleName: 'Editor',
      permissions: ['activities.view', 'activities.edit'],
      teamIds: [5, 6],
    };
    policyService.isCommsContactForActivity.mockResolvedValue(false);
    policyService.getLeadTeamIdForActivity.mockResolvedValue(10);
    const ctx = createMockContext(user, { id: '1' });

    let err: ForbiddenException | undefined;
    await guard.canActivate(ctx).catch((e) => {
      err = e;
    });

    expect(err).toBeInstanceOf(ForbiddenException);
    expect(err?.getResponse()).toMatchObject({
      message: 'Permission denied',
      required:
        "Be a comms contact or a member of the activity's lead team to request delete",
    });
    expect(policyService.isCommsContactForActivity).toHaveBeenCalledWith(1, 3);
    expect(policyService.getLeadTeamIdForActivity).toHaveBeenCalledWith(1);
  });

  it('should throw BadRequestException when activity id param is missing', async () => {
    const user: AuthUser = {
      id: 1,
      username: 'u',
      displayName: 'U',
      email: 'u@e.com',
      roleId: 1,
      roleName: 'Viewer',
      permissions: [],
      teamIds: [],
    };
    const ctx = createMockContext(user, {});

    await expect(guard.canActivate(ctx)).rejects.toThrow(BadRequestException);
    await expect(guard.canActivate(ctx)).rejects.toThrow(
      'Activity ID required'
    );
    expect(policyService.isCommsContactForActivity).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException when activity id is invalid', async () => {
    const user: AuthUser = {
      id: 1,
      username: 'u',
      displayName: 'U',
      email: 'u@e.com',
      roleId: 1,
      roleName: 'Viewer',
      permissions: [],
      teamIds: [],
    };
    const ctx = createMockContext(user, { id: 'not-a-number' });

    await expect(guard.canActivate(ctx)).rejects.toThrow(BadRequestException);
    await expect(guard.canActivate(ctx)).rejects.toThrow('Invalid activity ID');
    expect(policyService.isCommsContactForActivity).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException when activity id is not an integer', async () => {
    const user: AuthUser = {
      id: 1,
      username: 'u',
      displayName: 'U',
      email: 'u@e.com',
      roleId: 1,
      roleName: 'Viewer',
      permissions: [],
      teamIds: [],
    };
    const ctx = createMockContext(user, { id: '1.5' });

    await expect(guard.canActivate(ctx)).rejects.toThrow(BadRequestException);
    await expect(guard.canActivate(ctx)).rejects.toThrow('Invalid activity ID');
    expect(policyService.isCommsContactForActivity).not.toHaveBeenCalled();
  });
});
