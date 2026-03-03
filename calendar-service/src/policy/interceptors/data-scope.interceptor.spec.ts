import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import type { Mock } from 'vitest';

import { SYSTEM_ROLE_IDS, SYSTEM_ROLES, type AuthUser } from '@corpcal/shared';

import { PolicyService } from '../policy.service';
import { DataScopeInterceptor } from './data-scope.interceptor';

describe('DataScopeInterceptor', () => {
  let interceptor: DataScopeInterceptor;
  let mockPolicyService: {
    bypassesDataScoping: Mock;
  };
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let bypassesDataScopingMock: Mock;

  beforeEach(async () => {
    bypassesDataScopingMock = vi.fn();
    mockPolicyService = {
      bypassesDataScoping: bypassesDataScopingMock,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataScopeInterceptor,
        {
          provide: PolicyService,
          useValue: mockPolicyService,
        },
      ],
    }).compile();

    interceptor = module.get<DataScopeInterceptor>(DataScopeInterceptor);
  });

  const createMockExecutionContext = (user?: AuthUser): ExecutionContext => {
    const request: Record<string, unknown> = { user };
    return {
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue(request),
      }),
    } as unknown as ExecutionContext;
  };

  const createMockCallHandler = (): CallHandler => {
    return {
      handle: vi.fn().mockReturnValue(of({})),
    } as unknown as CallHandler;
  };

  it('should set dataScope to default when no user is present', async () => {
    mockExecutionContext = createMockExecutionContext(undefined);
    mockCallHandler = createMockCallHandler();

    await new Promise<void>((resolve) => {
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          const request = mockExecutionContext.switchToHttp().getRequest();
          expect(request.dataScope).toEqual({
            teamIds: [],
            bypass: false,
          });
          resolve();
        },
      });
    });
  });

  it('should set bypass to true and empty teamIds for Admin role', async () => {
    bypassesDataScopingMock.mockReturnValue(true);
    const user: AuthUser = {
      id: 1,
      username: 'admin',
      displayName: 'Admin User',
      email: 'admin@example.com',
      roleId: SYSTEM_ROLE_IDS.ADMIN,
      roleName: SYSTEM_ROLES.ADMIN,
      permissions: [],
      teamIds: [1, 2, 3],
    };
    mockExecutionContext = createMockExecutionContext(user);
    mockCallHandler = createMockCallHandler();

    await new Promise<void>((resolve) => {
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          const request = mockExecutionContext.switchToHttp().getRequest();
          expect(request.dataScope).toEqual({
            teamIds: [],
            bypass: true,
          });
          expect(bypassesDataScopingMock).toHaveBeenCalledWith(
            SYSTEM_ROLES.ADMIN
          );
          resolve();
        },
      });
    });
  });

  it('should set bypass to true and empty teamIds for System Admin role', async () => {
    bypassesDataScopingMock.mockReturnValue(true);
    const user: AuthUser = {
      id: 1,
      username: 'sysadmin',
      displayName: 'System Admin User',
      email: 'sysadmin@example.com',
      roleId: SYSTEM_ROLE_IDS.SYSTEM_ADMIN,
      roleName: SYSTEM_ROLES.SYSTEM_ADMIN,
      permissions: [],
      teamIds: [1, 2],
    };
    mockExecutionContext = createMockExecutionContext(user);
    mockCallHandler = createMockCallHandler();

    await new Promise<void>((resolve) => {
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          const request = mockExecutionContext.switchToHttp().getRequest();
          expect(request.dataScope).toEqual({
            teamIds: [],
            bypass: true,
          });
          expect(bypassesDataScopingMock).toHaveBeenCalledWith(
            SYSTEM_ROLES.SYSTEM_ADMIN
          );
          resolve();
        },
      });
    });
  });

  it('should set bypass to true and empty teamIds for Advanced Editor role', async () => {
    bypassesDataScopingMock.mockReturnValue(true);
    const user: AuthUser = {
      id: 1,
      username: 'advanced',
      displayName: 'Advanced Editor User',
      email: 'advanced@example.com',
      roleId: SYSTEM_ROLE_IDS.ADVANCED_EDITOR,
      roleName: SYSTEM_ROLES.ADVANCED_EDITOR,
      permissions: [],
      teamIds: [1, 2, 3],
    };
    mockExecutionContext = createMockExecutionContext(user);
    mockCallHandler = createMockCallHandler();

    await new Promise<void>((resolve) => {
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          const request = mockExecutionContext.switchToHttp().getRequest();
          expect(request.dataScope).toEqual({
            teamIds: [],
            bypass: true,
          });
          expect(bypassesDataScopingMock).toHaveBeenCalledWith(
            SYSTEM_ROLES.ADVANCED_EDITOR
          );
          resolve();
        },
      });
    });
  });

  it('should use user.bypassDataScoping when present without calling policy', async () => {
    const user: AuthUser = {
      id: 1,
      username: 'user',
      displayName: 'User',
      email: 'user@example.com',
      roleId: SYSTEM_ROLE_IDS.EDITOR,
      roleName: SYSTEM_ROLES.EDITOR,
      permissions: [],
      teamIds: [1],
      bypassDataScoping: true,
    };
    mockExecutionContext = createMockExecutionContext(user);
    mockCallHandler = createMockCallHandler();

    await new Promise<void>((resolve) => {
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          const request = mockExecutionContext.switchToHttp().getRequest();
          expect(request.dataScope).toEqual({
            teamIds: [],
            bypass: true,
          });
          expect(bypassesDataScopingMock).not.toHaveBeenCalled();
          resolve();
        },
      });
    });
  });

  it('should set bypass to false and use user teamIds for Editor role', async () => {
    bypassesDataScopingMock.mockReturnValue(false);
    const user: AuthUser = {
      id: 1,
      username: 'editor',
      displayName: 'Editor User',
      email: 'editor@example.com',
      roleId: SYSTEM_ROLE_IDS.EDITOR,
      roleName: SYSTEM_ROLES.EDITOR,
      permissions: [],
      teamIds: [1, 2],
    };
    mockExecutionContext = createMockExecutionContext(user);
    mockCallHandler = createMockCallHandler();

    await new Promise<void>((resolve) => {
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          const request = mockExecutionContext.switchToHttp().getRequest();
          expect(request.dataScope).toEqual({
            teamIds: [1, 2],
            bypass: false,
          });
          expect(bypassesDataScopingMock).toHaveBeenCalledWith(
            SYSTEM_ROLES.EDITOR
          );
          resolve();
        },
      });
    });
  });

  it('should set bypass to false and empty teamIds for Viewer role with no teams', async () => {
    bypassesDataScopingMock.mockReturnValue(false);
    const user: AuthUser = {
      id: 1,
      username: 'viewer',
      displayName: 'Viewer User',
      email: 'viewer@example.com',
      roleId: SYSTEM_ROLE_IDS.VIEWER,
      roleName: SYSTEM_ROLES.VIEWER,
      permissions: [],
      teamIds: [],
    };
    mockExecutionContext = createMockExecutionContext(user);
    mockCallHandler = createMockCallHandler();

    await new Promise<void>((resolve) => {
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          const request = mockExecutionContext.switchToHttp().getRequest();
          expect(request.dataScope).toEqual({
            teamIds: [],
            bypass: false,
          });
          expect(bypassesDataScopingMock).toHaveBeenCalledWith(
            SYSTEM_ROLES.VIEWER
          );
          resolve();
        },
      });
    });
  });

  it('should handle user with undefined teamIds', async () => {
    bypassesDataScopingMock.mockReturnValue(false);
    const user: AuthUser = {
      id: 1,
      username: 'editor',
      displayName: 'Editor User',
      email: 'editor@example.com',
      roleId: SYSTEM_ROLE_IDS.EDITOR,
      roleName: SYSTEM_ROLES.EDITOR,
      permissions: [],
      teamIds: undefined as unknown as number[],
    };
    mockExecutionContext = createMockExecutionContext(user);
    mockCallHandler = createMockCallHandler();

    await new Promise<void>((resolve) => {
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          const request = mockExecutionContext.switchToHttp().getRequest();
          expect(request.dataScope).toEqual({
            teamIds: [],
            bypass: false,
          });
          resolve();
        },
      });
    });
  });
});
