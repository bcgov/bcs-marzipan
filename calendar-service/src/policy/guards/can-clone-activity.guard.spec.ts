import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Mock } from 'vitest';

import { PERMISSIONS, SYSTEM_ROLES, type AuthUser } from '@corpcal/shared';

import { PolicyService } from '../policy.service';
import { CanCloneActivityGuard } from './can-clone-activity.guard';

describe('CanCloneActivityGuard', () => {
  let guard: CanCloneActivityGuard;
  let policyService: {
    getActivityStatusNameForActivity: Mock;
    isCommsContactForActivity: Mock;
    getLeadTeamIdForActivity: Mock;
  };

  beforeEach(async () => {
    policyService = {
      getActivityStatusNameForActivity: vi.fn().mockResolvedValue('new'),
      isCommsContactForActivity: vi.fn().mockResolvedValue(false),
      getLeadTeamIdForActivity: vi.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CanCloneActivityGuard,
        { provide: PolicyService, useValue: policyService },
      ],
    }).compile();

    guard = module.get<CanCloneActivityGuard>(CanCloneActivityGuard);
  });

  const createMockContext = (
    user: AuthUser | undefined,
    params: { id?: string } = { id: '42' }
  ): ExecutionContext =>
    ({
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({ user, params }),
      }),
    }) as unknown as ExecutionContext;

  const editorUser = (overrides: Partial<AuthUser> = {}): AuthUser => ({
    id: 3,
    username: 'editor',
    displayName: 'Editor User',
    email: 'editor@example.com',
    roleId: 2,
    roleName: 'Editor',
    permissions: [PERMISSIONS.ACTIVITIES.CREATE, PERMISSIONS.ACTIVITIES.EDIT],
    teamIds: [],
    ...overrides,
  });

  const adminUser = (): AuthUser => ({
    id: 18,
    username: 'admin',
    displayName: 'Admin User',
    email: 'admin@example.com',
    roleId: 5,
    roleName: SYSTEM_ROLES.ADMIN,
    permissions: [
      PERMISSIONS.ACTIVITIES.CREATE,
      PERMISSIONS.ACTIVITIES.EDIT,
      PERMISSIONS.ACTIVITIES.DELETE_ANY,
    ],
    teamIds: [],
  });

  it('throws ForbiddenException when user is undefined', async () => {
    const ctx = createMockContext(undefined);
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(ctx)).rejects.toThrow(
      'Authentication required'
    );
  });

  it('throws BadRequestException when activity id is missing', async () => {
    const ctx = createMockContext(editorUser(), {});
    await expect(guard.canActivate(ctx)).rejects.toThrow(BadRequestException);
    await expect(guard.canActivate(ctx)).rejects.toThrow(
      'Activity ID required'
    );
  });

  it('throws BadRequestException when activity id is not a number', async () => {
    const ctx = createMockContext(editorUser(), { id: 'abc' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(BadRequestException);
    await expect(guard.canActivate(ctx)).rejects.toThrow('Invalid activity ID');
  });

  it('allows admin on a non-blocked source', async () => {
    policyService.getActivityStatusNameForActivity.mockResolvedValue('new');
    const ctx = createMockContext(adminUser());
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(policyService.isCommsContactForActivity).not.toHaveBeenCalled();
  });

  it('allows system admin on a non-blocked source', async () => {
    policyService.getActivityStatusNameForActivity.mockResolvedValue('new');
    const ctx = createMockContext(
      editorUser({
        roleName: SYSTEM_ROLES.SYSTEM_ADMIN,
        permissions: [
          PERMISSIONS.ACTIVITIES.CREATE,
          PERMISSIONS.ACTIVITIES.DELETE_ANY,
        ],
      })
    );
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('allows a comms contact with create permission', async () => {
    policyService.getActivityStatusNameForActivity.mockResolvedValue('new');
    policyService.isCommsContactForActivity.mockResolvedValue(true);
    const ctx = createMockContext(editorUser());
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(policyService.isCommsContactForActivity).toHaveBeenCalledWith(42, 3);
  });

  it('allows a lead-team member with create permission', async () => {
    policyService.getActivityStatusNameForActivity.mockResolvedValue('new');
    policyService.isCommsContactForActivity.mockResolvedValue(false);
    policyService.getLeadTeamIdForActivity.mockResolvedValue(10);
    const ctx = createMockContext(editorUser({ teamIds: [10, 20] }));
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('throws ForbiddenException for an editor who is neither comms nor lead-team', async () => {
    policyService.getActivityStatusNameForActivity.mockResolvedValue('new');
    policyService.isCommsContactForActivity.mockResolvedValue(false);
    policyService.getLeadTeamIdForActivity.mockResolvedValue(10);
    const ctx = createMockContext(editorUser({ teamIds: [99] }));
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException on a blocked source when user lacks delete.any', async () => {
    policyService.getActivityStatusNameForActivity.mockResolvedValue(
      'delete_requested'
    );
    policyService.isCommsContactForActivity.mockResolvedValue(true);
    const ctx = createMockContext(editorUser());
    await expect(guard.canActivate(ctx)).rejects.toThrow(
      /requires activities.delete.any/
    );
  });

  it('allows a blocked source when the user is comms contact and has delete.any', async () => {
    policyService.getActivityStatusNameForActivity.mockResolvedValue('deleted');
    policyService.isCommsContactForActivity.mockResolvedValue(true);
    const ctx = createMockContext(
      editorUser({
        permissions: [
          PERMISSIONS.ACTIVITIES.CREATE,
          PERMISSIONS.ACTIVITIES.EDIT,
          PERMISSIONS.ACTIVITIES.DELETE_ANY,
        ],
      })
    );
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('allows admin on a blocked source (admin bypasses eligibility but still needs delete.any)', async () => {
    policyService.getActivityStatusNameForActivity.mockResolvedValue('deleted');
    const ctx = createMockContext(adminUser());
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(policyService.isCommsContactForActivity).not.toHaveBeenCalled();
  });
});
