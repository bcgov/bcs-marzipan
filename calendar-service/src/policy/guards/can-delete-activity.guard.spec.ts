import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PERMISSIONS, type AuthUser } from '@corpcal/shared';

import { CanDeleteActivityGuard } from './can-delete-activity.guard';

describe('CanDeleteActivityGuard', () => {
  let guard: CanDeleteActivityGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CanDeleteActivityGuard],
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

  it('should throw ForbiddenException when user is undefined', () => {
    const ctx = createMockContext(undefined);

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(ctx)).toThrow('Authentication required');
  });

  it('should return true when user has activities.delete permission', () => {
    const user: AuthUser = {
      id: 10,
      username: 'admin',
      displayName: 'Admin User',
      email: 'admin@example.com',
      roleId: 5,
      roleName: 'Admin',
      permissions: [PERMISSIONS.ACTIVITIES.DELETE],
      teamIds: [],
    };
    const ctx = createMockContext(user);

    const result = guard.canActivate(ctx);

    expect(result).toBe(true);
  });

  it('should throw ForbiddenException when user is comms lead but has no activities.delete permission', () => {
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
    const ctx = createMockContext(user, { id: '42' });

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(ctx)).toThrow(
      /Only admin can delete activities/
    );
  });

  it('should throw ForbiddenException when user has no permission', () => {
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

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(ctx)).toThrow(
      /Only admin can delete activities/
    );
  });

  it('should throw BadRequestException when activity id param is missing', () => {
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

    expect(() => guard.canActivate(ctx)).toThrow(BadRequestException);
    expect(() => guard.canActivate(ctx)).toThrow('Activity ID required');
  });

  it('should throw BadRequestException when activity id is invalid', () => {
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

    expect(() => guard.canActivate(ctx)).toThrow(BadRequestException);
    expect(() => guard.canActivate(ctx)).toThrow('Invalid activity ID');
  });
});
