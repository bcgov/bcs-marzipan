import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Mock } from 'vitest';

import { PERMISSIONS, SYSTEM_ROLES, type AuthUser } from '@corpcal/shared';

import { PolicyService } from '../policy.service';
import { CanRestoreActivityGuard } from './can-restore-activity.guard';

describe('CanRestoreActivityGuard', () => {
  let guard: CanRestoreActivityGuard;
  let policyService: {
    getActivityStatusNameForActivity: Mock;
    isCommsContactForActivity: Mock;
    getLeadTeamIdForActivity: Mock;
  };

  beforeEach(async () => {
    policyService = {
      getActivityStatusNameForActivity: vi
        .fn()
        .mockResolvedValue('delete_requested'),
      isCommsContactForActivity: vi.fn(),
      getLeadTeamIdForActivity: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CanRestoreActivityGuard,
        {
          provide: PolicyService,
          useValue: policyService,
        },
      ],
    }).compile();

    guard = module.get<CanRestoreActivityGuard>(CanRestoreActivityGuard);
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

  it('should return true when user is admin and status is delete_requested', async () => {
    policyService.getActivityStatusNameForActivity.mockResolvedValue(
      'delete_requested'
    );
    const user: AuthUser = {
      id: 18,
      username: 'admin',
      displayName: 'Admin User',
      email: 'admin@example.com',
      roleId: 5,
      roleName: SYSTEM_ROLES.ADMIN,
      permissions: [PERMISSIONS.ACTIVITIES.DELETE_ANY],
      teamIds: [],
    };
    const ctx = createMockContext(user, { id: '42' });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(policyService.getActivityStatusNameForActivity).toHaveBeenCalledWith(
      42
    );
    expect(policyService.isCommsContactForActivity).not.toHaveBeenCalled();
  });

  it('should return true when user is system admin and status is delete_requested', async () => {
    policyService.getActivityStatusNameForActivity.mockResolvedValue(
      'delete_requested'
    );
    const user: AuthUser = {
      id: 20,
      username: 'sysadmin',
      displayName: 'System Admin',
      email: 'sysadmin@example.com',
      roleId: 6,
      roleName: SYSTEM_ROLES.SYSTEM_ADMIN,
      permissions: [PERMISSIONS.ACTIVITIES.DELETE_ANY],
      teamIds: [],
    };
    const ctx = createMockContext(user, { id: '1' });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(policyService.isCommsContactForActivity).not.toHaveBeenCalled();
  });

  it('should return true when status is deleted and user has delete.any', async () => {
    policyService.getActivityStatusNameForActivity.mockResolvedValue('deleted');
    const user: AuthUser = {
      id: 18,
      username: 'admin',
      displayName: 'Admin User',
      email: 'admin@example.com',
      roleId: 5,
      roleName: SYSTEM_ROLES.ADMIN,
      permissions: [PERMISSIONS.ACTIVITIES.DELETE_ANY],
      teamIds: [],
    };
    const ctx = createMockContext(user, { id: '42' });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(policyService.isCommsContactForActivity).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException when status is deleted and user lacks delete.any', async () => {
    policyService.getActivityStatusNameForActivity.mockResolvedValue('deleted');
    const user: AuthUser = {
      id: 5,
      username: 'editor',
      displayName: 'Editor',
      email: 'editor@example.com',
      roleId: 2,
      roleName: 'Editor',
      permissions: [
        PERMISSIONS.ACTIVITIES.DELETE,
        PERMISSIONS.ACTIVITIES.REQUEST_DELETE,
      ],
      teamIds: [10],
    };
    policyService.isCommsContactForActivity.mockResolvedValue(true);
    policyService.getLeadTeamIdForActivity.mockResolvedValue(10);
    const ctx = createMockContext(user, { id: '42' });

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(ctx)).rejects.toThrow(
      'Restore from deleted requires activities.delete.any'
    );
    expect(policyService.isCommsContactForActivity).not.toHaveBeenCalled();
  });

  it('should return true when user is comms contact with requestDelete and status delete_requested', async () => {
    policyService.getActivityStatusNameForActivity.mockResolvedValue(
      'delete_requested'
    );
    const user: AuthUser = {
      id: 5,
      username: 'comms',
      displayName: 'Comms Contact',
      email: 'comms@example.com',
      roleId: 2,
      roleName: 'Editor',
      permissions: [PERMISSIONS.ACTIVITIES.REQUEST_DELETE],
      teamIds: [],
    };
    policyService.isCommsContactForActivity.mockResolvedValue(true);
    policyService.getLeadTeamIdForActivity.mockResolvedValue(10);
    const ctx = createMockContext(user, { id: '42' });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(policyService.isCommsContactForActivity).toHaveBeenCalledWith(42, 5);
  });

  it('should return true when user is in activity lead team with requestDelete and status delete_requested', async () => {
    policyService.getActivityStatusNameForActivity.mockResolvedValue(
      'delete_requested'
    );
    const user: AuthUser = {
      id: 7,
      username: 'teammate',
      displayName: 'Team Member',
      email: 'team@example.com',
      roleId: 2,
      roleName: 'Editor',
      permissions: [PERMISSIONS.ACTIVITIES.REQUEST_DELETE],
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

  it('should throw ForbiddenException when status delete_requested and user has no restore permission', async () => {
    policyService.getActivityStatusNameForActivity.mockResolvedValue(
      'delete_requested'
    );
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
    policyService.isCommsContactForActivity.mockResolvedValue(true);
    policyService.getLeadTeamIdForActivity.mockResolvedValue(10);
    const ctx = createMockContext(user, { id: '1' });

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(ctx)).rejects.toThrow(
      'You do not have permission to restore this activity.'
    );
    expect(policyService.isCommsContactForActivity).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException when status delete_requested user has permission but not comms/lead-team/admin', async () => {
    policyService.getActivityStatusNameForActivity.mockResolvedValue(
      'delete_requested'
    );
    const user: AuthUser = {
      id: 3,
      username: 'editor',
      displayName: 'Editor User',
      email: 'editor@example.com',
      roleId: 2,
      roleName: 'Editor',
      permissions: [PERMISSIONS.ACTIVITIES.REQUEST_DELETE],
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
        "Be a comms contact, a member of the activity's lead team, or an admin to restore",
    });
    expect(policyService.isCommsContactForActivity).toHaveBeenCalledWith(1, 3);
    expect(policyService.getLeadTeamIdForActivity).toHaveBeenCalledWith(1);
  });

  it('should return true when status is not delete_requested or deleted', async () => {
    policyService.getActivityStatusNameForActivity.mockResolvedValue('changed');
    const user: AuthUser = {
      id: 3,
      username: 'editor',
      displayName: 'Editor User',
      email: 'editor@example.com',
      roleId: 2,
      roleName: 'Editor',
      permissions: [],
      teamIds: [],
    };
    const ctx = createMockContext(user, { id: '1' });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(policyService.isCommsContactForActivity).not.toHaveBeenCalled();
    expect(policyService.getLeadTeamIdForActivity).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException when activity status is unknown (null)', async () => {
    policyService.getActivityStatusNameForActivity.mockResolvedValue(null);
    const user: AuthUser = {
      id: 1,
      username: 'u',
      displayName: 'U',
      email: 'u@e.com',
      roleId: 1,
      roleName: 'Editor',
      permissions: [PERMISSIONS.ACTIVITIES.REQUEST_DELETE],
      teamIds: [5],
    };
    const ctx = createMockContext(user, { id: '999' });

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(ctx)).rejects.toThrow(
      /Activity not found or status unknown; cannot restore/
    );
    expect(policyService.getActivityStatusNameForActivity).toHaveBeenCalledWith(
      999
    );
    expect(policyService.isCommsContactForActivity).not.toHaveBeenCalled();
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
