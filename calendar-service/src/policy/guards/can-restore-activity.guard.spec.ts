import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Mock } from 'vitest';

import { SYSTEM_ROLES, type AuthUser } from '@corpcal/shared';

import { PolicyService } from '../policy.service';
import { CanRestoreActivityGuard } from './can-restore-activity.guard';

describe('CanRestoreActivityGuard', () => {
  let guard: CanRestoreActivityGuard;
  let policyService: {
    isCommsContactForActivity: Mock;
  };

  beforeEach(async () => {
    policyService = {
      isCommsContactForActivity: vi.fn(),
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

  it('should return true when user is admin', async () => {
    const user: AuthUser = {
      id: 18,
      username: 'admin',
      displayName: 'Admin User',
      email: 'admin@example.com',
      roleId: 4,
      roleName: SYSTEM_ROLES.ADMIN,
      permissions: [],
      teamIds: [],
    };
    const ctx = createMockContext(user, { id: '42' });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(policyService.isCommsContactForActivity).not.toHaveBeenCalled();
  });

  it('should return true when user is system admin', async () => {
    const user: AuthUser = {
      id: 20,
      username: 'sysadmin',
      displayName: 'System Admin',
      email: 'sysadmin@example.com',
      roleId: 5,
      roleName: SYSTEM_ROLES.SYSTEM_ADMIN,
      permissions: [],
      teamIds: [],
    };
    const ctx = createMockContext(user, { id: '1' });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(policyService.isCommsContactForActivity).not.toHaveBeenCalled();
  });

  it('should return true when user is comms contact (non-admin)', async () => {
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
    const ctx = createMockContext(user, { id: '42' });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(policyService.isCommsContactForActivity).toHaveBeenCalledWith(42, 5);
  });

  it('should throw ForbiddenException when user is not admin and not comms contact', async () => {
    const user: AuthUser = {
      id: 3,
      username: 'editor',
      displayName: 'Editor User',
      email: 'editor@example.com',
      roleId: 2,
      roleName: 'Editor',
      permissions: ['activities.view', 'activities.edit'],
      teamIds: [],
    };
    policyService.isCommsContactForActivity.mockResolvedValue(false);
    const ctx = createMockContext(user, { id: '1' });

    let err: ForbiddenException | undefined;
    await guard.canActivate(ctx).catch((e) => {
      err = e;
    });

    expect(err).toBeInstanceOf(ForbiddenException);
    expect(err?.getResponse()).toMatchObject({
      message: 'Permission denied',
      required: 'Be a comms contact on this activity or an admin to restore',
    });
    expect(policyService.isCommsContactForActivity).toHaveBeenCalledWith(1, 3);
  });

  it('should throw BadRequestException when activity id param is missing', async () => {
    const user: AuthUser = {
      id: 1,
      username: 'u',
      displayName: 'U',
      email: 'u@e.com',
      roleId: 1,
      roleName: 'View Only',
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
      roleName: 'View Only',
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
      roleName: 'View Only',
      permissions: [],
      teamIds: [],
    };
    const ctx = createMockContext(user, { id: '1.5' });

    await expect(guard.canActivate(ctx)).rejects.toThrow(BadRequestException);
    await expect(guard.canActivate(ctx)).rejects.toThrow('Invalid activity ID');
    expect(policyService.isCommsContactForActivity).not.toHaveBeenCalled();
  });
});
