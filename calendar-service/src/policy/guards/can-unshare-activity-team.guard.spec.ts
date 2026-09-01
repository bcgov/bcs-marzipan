import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

import { PERMISSIONS, SYSTEM_ROLES, type AuthUser } from '@corpcal/shared';

import { CanUnshareActivityTeamGuard } from './can-unshare-activity-team.guard';

describe('CanUnshareActivityTeamGuard', () => {
  const guard = new CanUnshareActivityTeamGuard();

  const createMockContext = (
    user: AuthUser | undefined,
    params: { id?: string; teamId?: string } = { id: '1', teamId: '7' }
  ): ExecutionContext =>
    ({
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({
          user,
          params,
        }),
      }),
    }) as unknown as ExecutionContext;

  it('should throw ForbiddenException when user is undefined', () => {
    const ctx = createMockContext(undefined);

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(ctx)).toThrow('Authentication required');
  });

  it('should throw BadRequestException when teamId param is missing', () => {
    const user: AuthUser = {
      id: 5,
      username: 'user',
      displayName: 'User',
      email: 'user@example.com',
      roleId: 2,
      roleName: 'Editor',
      permissions: [PERMISSIONS.ACTIVITIES.UNSHARE],
      teamIds: [7],
    };
    const ctx = createMockContext(user, { id: '1' });

    expect(() => guard.canActivate(ctx)).toThrow(BadRequestException);
    expect(() => guard.canActivate(ctx)).toThrow('Team ID required');
  });

  it('should throw BadRequestException when teamId param is not a number', () => {
    const user: AuthUser = {
      id: 5,
      username: 'user',
      displayName: 'User',
      email: 'user@example.com',
      roleId: 2,
      roleName: 'Editor',
      permissions: [PERMISSIONS.ACTIVITIES.UNSHARE],
      teamIds: [7],
    };
    const ctx = createMockContext(user, { id: '1', teamId: 'abc' });

    expect(() => guard.canActivate(ctx)).toThrow(BadRequestException);
    expect(() => guard.canActivate(ctx)).toThrow('Invalid team ID');
  });

  it('should return true when user is Admin (bypass), regardless of team membership', () => {
    const user: AuthUser = {
      id: 1,
      username: 'admin',
      displayName: 'Admin',
      email: 'admin@example.com',
      roleId: 5,
      roleName: SYSTEM_ROLES.ADMIN,
      permissions: [PERMISSIONS.ACTIVITIES.UNSHARE],
      teamIds: [],
    };
    const ctx = createMockContext(user, { id: '1', teamId: '99' });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should return true when user is System Admin (bypass)', () => {
    const user: AuthUser = {
      id: 2,
      username: 'sysadmin',
      displayName: 'System Admin',
      email: 'sysadmin@example.com',
      roleId: 6,
      roleName: SYSTEM_ROLES.SYSTEM_ADMIN,
      permissions: [PERMISSIONS.ACTIVITIES.UNSHARE],
      teamIds: [],
    };
    const ctx = createMockContext(user, { id: '1', teamId: '99' });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should return true when user belongs to the team being unshared', () => {
    const user: AuthUser = {
      id: 5,
      username: 'user',
      displayName: 'User',
      email: 'user@example.com',
      roleId: 2,
      roleName: 'Editor',
      permissions: [PERMISSIONS.ACTIVITIES.UNSHARE],
      teamIds: [7],
    };
    const ctx = createMockContext(user, { id: '1', teamId: '7' });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should throw ForbiddenException when user does not belong to the team being unshared', () => {
    const user: AuthUser = {
      id: 5,
      username: 'user',
      displayName: 'User',
      email: 'user@example.com',
      roleId: 2,
      roleName: 'Editor',
      permissions: [PERMISSIONS.ACTIVITIES.UNSHARE],
      teamIds: [7],
    };
    const ctx = createMockContext(user, { id: '1', teamId: '8' });

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(ctx)).toThrow(
      'You may only unshare an activity from a team you belong to.'
    );
  });
});
