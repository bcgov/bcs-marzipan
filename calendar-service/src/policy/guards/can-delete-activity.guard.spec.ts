import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Mock } from 'vitest';

import { PERMISSIONS, type AuthUser } from '@corpcal/shared';

import { PolicyService } from '../policy.service';
import { CanDeleteActivityGuard } from './can-delete-activity.guard';

describe('CanDeleteActivityGuard', () => {
  let guard: CanDeleteActivityGuard;
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
        CanDeleteActivityGuard,
        {
          provide: PolicyService,
          useValue: policyService,
        },
      ],
    }).compile();

    guard = module.get<CanDeleteActivityGuard>(CanDeleteActivityGuard);
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
  });

  it('should return true when user has activities.delete.any', async () => {
    const user: AuthUser = {
      id: 10,
      username: 'admin',
      displayName: 'Admin User',
      email: 'admin@example.com',
      roleId: 5,
      roleName: 'Admin',
      permissions: [
        PERMISSIONS.ACTIVITIES.DELETE,
        PERMISSIONS.ACTIVITIES.DELETE_ANY,
      ],
      teamIds: [],
    };
    const ctx = createMockContext(user, { id: '42' });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(policyService.isCommsContactForActivity).not.toHaveBeenCalled();
    expect(policyService.getLeadTeamIdForActivity).not.toHaveBeenCalled();
  });

  it('should return true when user has activities.delete and is comms contact', async () => {
    const user: AuthUser = {
      id: 5,
      username: 'comms',
      displayName: 'Comms Lead',
      email: 'comms@example.com',
      roleId: 2,
      roleName: 'Editor',
      permissions: [PERMISSIONS.ACTIVITIES.DELETE],
      teamIds: [],
    };
    policyService.isCommsContactForActivity.mockResolvedValue(true);
    policyService.getLeadTeamIdForActivity.mockResolvedValue(10);
    const ctx = createMockContext(user, { id: '42' });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(policyService.isCommsContactForActivity).toHaveBeenCalledWith(42, 5);
  });

  it('should return true when user has activities.delete and is lead-team member', async () => {
    const user: AuthUser = {
      id: 7,
      username: 'teammate',
      displayName: 'Team Member',
      email: 'team@example.com',
      roleId: 2,
      roleName: 'Editor',
      permissions: [PERMISSIONS.ACTIVITIES.DELETE],
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

  it('should throw ForbiddenException when user has activities.delete but not delete.any and not comms/lead-team', async () => {
    const user: AuthUser = {
      id: 3,
      username: 'editor',
      displayName: 'Editor User',
      email: 'editor@example.com',
      roleId: 2,
      roleName: 'Editor',
      permissions: [PERMISSIONS.ACTIVITIES.DELETE],
      teamIds: [5, 6],
    };
    policyService.isCommsContactForActivity.mockResolvedValue(false);
    policyService.getLeadTeamIdForActivity.mockResolvedValue(10);
    const ctx = createMockContext(user, { id: '1' });

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(ctx)).rejects.toThrow(
      /You may only delete activities where you are a comms contact or lead-team member/
    );
    expect(policyService.isCommsContactForActivity).toHaveBeenCalledWith(1, 3);
    expect(policyService.getLeadTeamIdForActivity).toHaveBeenCalledWith(1);
  });

  it('should throw ForbiddenException when user is comms lead but has no activities.delete permission', async () => {
    const user: AuthUser = {
      id: 5,
      username: 'comms',
      displayName: 'Comms Lead',
      email: 'comms@example.com',
      roleId: 2,
      roleName: 'Editor',
      permissions: [],
      teamIds: [],
    };
    policyService.isCommsContactForActivity.mockResolvedValue(true);
    const ctx = createMockContext(user, { id: '42' });

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(ctx)).rejects.toThrow(
      /You do not have the required permission to delete activities/
    );
    expect(policyService.isCommsContactForActivity).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException when user has no permission', async () => {
    const user: AuthUser = {
      id: 3,
      username: 'editor',
      displayName: 'Editor User',
      email: 'editor@example.com',
      roleId: 2,
      roleName: 'Editor',
      permissions: [PERMISSIONS.ACTIVITIES.VIEW, PERMISSIONS.ACTIVITIES.EDIT],
      teamIds: [],
    };
    const ctx = createMockContext(user, { id: '1' });

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(ctx)).rejects.toThrow(
      /You do not have the required permission to delete activities/
    );
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
  });
});
