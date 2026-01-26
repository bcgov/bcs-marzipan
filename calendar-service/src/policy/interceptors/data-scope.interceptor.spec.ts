import { Test, TestingModule } from '@nestjs/testing';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { DataScopeInterceptor } from './data-scope.interceptor';
import { PolicyService } from '../policy.service';
import type { AuthUser } from '@corpcal/shared';
import { SYSTEM_ROLES, SYSTEM_ROLE_IDS } from '@corpcal/shared';

describe('DataScopeInterceptor', () => {
  let interceptor: DataScopeInterceptor;
  let mockPolicyService: jest.Mocked<PolicyService>;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let bypassesDataScopingMock: jest.Mock;

  beforeEach(async () => {
    bypassesDataScopingMock = jest.fn();
    mockPolicyService = {
      bypassesDataScoping: bypassesDataScopingMock,
    } as unknown as jest.Mocked<PolicyService>;

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
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(request),
      }),
    } as unknown as ExecutionContext;
  };

  const createMockCallHandler = (): CallHandler => {
    return {
      handle: jest.fn().mockReturnValue(of({})),
    } as unknown as CallHandler;
  };

  it('should set dataScope to default when no user is present', (done) => {
    mockExecutionContext = createMockExecutionContext(undefined);
    mockCallHandler = createMockCallHandler();

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: () => {
        const request = mockExecutionContext.switchToHttp().getRequest();
        expect(request.dataScope).toEqual({
          teamIds: [],
          bypass: false,
        });
        done();
      },
    });
  });

  it('should set bypass to true and empty teamIds for Admin role', (done) => {
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
        done();
      },
    });
  });

  it('should set bypass to true and empty teamIds for System Admin role', (done) => {
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
        done();
      },
    });
  });

  it('should set bypass to true and empty teamIds for Advanced role', (done) => {
    bypassesDataScopingMock.mockReturnValue(true);
    const user: AuthUser = {
      id: 1,
      username: 'advanced',
      displayName: 'Advanced User',
      email: 'advanced@example.com',
      roleId: SYSTEM_ROLE_IDS.ADVANCED,
      roleName: SYSTEM_ROLES.ADVANCED,
      permissions: [],
      teamIds: [1, 2, 3],
    };
    mockExecutionContext = createMockExecutionContext(user);
    mockCallHandler = createMockCallHandler();

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: () => {
        const request = mockExecutionContext.switchToHttp().getRequest();
        expect(request.dataScope).toEqual({
          teamIds: [],
          bypass: true,
        });
        expect(bypassesDataScopingMock).toHaveBeenCalledWith(
          SYSTEM_ROLES.ADVANCED
        );
        done();
      },
    });
  });

  it('should set bypass to false and use user teamIds for Editor role', (done) => {
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
        done();
      },
    });
  });

  it('should set bypass to false and empty teamIds for View Only role with no teams', (done) => {
    bypassesDataScopingMock.mockReturnValue(false);
    const user: AuthUser = {
      id: 1,
      username: 'viewer',
      displayName: 'Viewer User',
      email: 'viewer@example.com',
      roleId: SYSTEM_ROLE_IDS.VIEW_ONLY,
      roleName: SYSTEM_ROLES.VIEW_ONLY,
      permissions: [],
      teamIds: [],
    };
    mockExecutionContext = createMockExecutionContext(user);
    mockCallHandler = createMockCallHandler();

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: () => {
        const request = mockExecutionContext.switchToHttp().getRequest();
        expect(request.dataScope).toEqual({
          teamIds: [],
          bypass: false,
        });
        expect(bypassesDataScopingMock).toHaveBeenCalledWith(
          SYSTEM_ROLES.VIEW_ONLY
        );
        done();
      },
    });
  });

  it('should handle user with undefined teamIds', (done) => {
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

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: () => {
        const request = mockExecutionContext.switchToHttp().getRequest();
        expect(request.dataScope).toEqual({
          teamIds: [],
          bypass: false,
        });
        done();
      },
    });
  });
});
