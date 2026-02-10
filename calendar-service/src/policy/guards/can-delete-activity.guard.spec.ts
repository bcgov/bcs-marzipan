import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { CanDeleteActivityGuard } from './can-delete-activity.guard';
import { PolicyService } from '../policy.service';
import { PERMISSIONS } from '@corpcal/shared';
import type { AuthUser } from '@corpcal/shared';
import type { Mock } from 'vitest';

describe('CanDeleteActivityGuard', () => {
  let guard: CanDeleteActivityGuard;
  let policyService: {
    isCommsLeadForActivity: Mock;
  };

  beforeEach(async () => {
    policyService = {
      isCommsLeadForActivity: vi.fn(),
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
    expect(policyService.isCommsLeadForActivity).not.toHaveBeenCalled();
  });

  it('should return true when user has activities.delete permission', async () => {
    const user: AuthUser = {
      id: 10,
      username: 'admin',
      displayName: 'Admin User',
      email: 'admin@example.com',
      roleId: 4,
      roleName: 'Admin',
      permissions: [PERMISSIONS.ACTIVITIES.DELETE],
      teamIds: [],
    };
    const ctx = createMockContext(user);

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(policyService.isCommsLeadForActivity).not.toHaveBeenCalled();
  });

  it('should return true when user is comms lead for the activity', async () => {
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
    policyService.isCommsLeadForActivity.mockResolvedValue(true);
    const ctx = createMockContext(user, { id: '42' });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(policyService.isCommsLeadForActivity).toHaveBeenCalledWith(42, 5);
  });

  it('should throw ForbiddenException when user has no permission and is not comms lead', async () => {
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
    policyService.isCommsLeadForActivity.mockResolvedValue(false);
    const ctx = createMockContext(user, { id: '1' });

    let err: ForbiddenException | undefined;
    await guard.canActivate(ctx).catch((e) => {
      err = e;
    });

    expect(err).toBeInstanceOf(ForbiddenException);
    expect(err?.getResponse()).toMatchObject({
      message: 'Permission denied',
      required: expect.arrayContaining([
        PERMISSIONS.ACTIVITIES.DELETE,
        'or be the comms lead for this activity',
      ]),
    });
    expect(policyService.isCommsLeadForActivity).toHaveBeenCalledWith(1, 3);
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
    expect(policyService.isCommsLeadForActivity).not.toHaveBeenCalled();
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
    expect(policyService.isCommsLeadForActivity).not.toHaveBeenCalled();
  });
});
