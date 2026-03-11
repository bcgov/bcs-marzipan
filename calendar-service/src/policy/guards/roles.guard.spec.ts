import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import type { Mock } from 'vitest';

import { SYSTEM_ROLE_IDS, SYSTEM_ROLES, type AuthUser } from '@corpcal/shared';

import { type RolesMetadata } from '../decorators/require-role.decorator';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let mockReflector: {
    getAllAndOverride: Mock;
  };
  let mockExecutionContext: ExecutionContext;

  beforeEach(async () => {
    mockReflector = {
      getAllAndOverride: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
  });

  const createMockExecutionContext = (user?: AuthUser): ExecutionContext => {
    return {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({
          user,
        }),
      }),
    } as unknown as ExecutionContext;
  };

  describe('when no metadata is present', () => {
    it('should return true when metadata is undefined', () => {
      mockReflector.getAllAndOverride.mockReturnValue(undefined);
      mockExecutionContext = createMockExecutionContext();

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should return true when metadata.roleNames is undefined', () => {
      mockReflector.getAllAndOverride.mockReturnValue({
        roleNames: undefined,
      } as any);
      mockExecutionContext = createMockExecutionContext();

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should return true when metadata.roleNames is empty array', () => {
      mockReflector.getAllAndOverride.mockReturnValue({
        roleNames: [],
      } as RolesMetadata);
      mockExecutionContext = createMockExecutionContext();

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });
  });

  describe('when user is not authenticated', () => {
    it('should throw ForbiddenException when request.user is undefined', () => {
      mockReflector.getAllAndOverride.mockReturnValue({
        roleNames: [SYSTEM_ROLES.ADMIN],
      } as RolesMetadata);
      mockExecutionContext = createMockExecutionContext(undefined);

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException
      );
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        'Authentication required'
      );
    });

    it('should throw ForbiddenException when user.roleName is undefined', () => {
      mockReflector.getAllAndOverride.mockReturnValue({
        roleNames: [SYSTEM_ROLES.ADMIN],
      } as RolesMetadata);
      const userWithoutRoleName = {
        id: 1,
        username: 'test',
        displayName: 'Test User',
        email: 'test@example.com',
        roleId: SYSTEM_ROLE_IDS.VIEWER,
        permissions: [],
        teamIds: [],
      } as unknown as AuthUser;
      mockExecutionContext = createMockExecutionContext(userWithoutRoleName);

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException
      );
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        'Authentication required'
      );
    });
  });

  describe('role matching', () => {
    it('should return true when user role is in allowed list', () => {
      mockReflector.getAllAndOverride.mockReturnValue({
        roleNames: [SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.EDITOR],
      } as RolesMetadata);
      const user: AuthUser = {
        id: 1,
        username: 'test',
        displayName: 'Test User',
        email: 'test@example.com',
        roleId: SYSTEM_ROLE_IDS.EDITOR,
        roleName: SYSTEM_ROLES.EDITOR,
        permissions: [],
        teamIds: [],
      };
      mockExecutionContext = createMockExecutionContext(user);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user role is not in allowed list', () => {
      mockReflector.getAllAndOverride.mockReturnValue({
        roleNames: [SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.SYSTEM_ADMIN],
      } as RolesMetadata);
      const user: AuthUser = {
        id: 1,
        username: 'test',
        displayName: 'Test User',
        email: 'test@example.com',
        roleId: SYSTEM_ROLE_IDS.EDITOR,
        roleName: SYSTEM_ROLES.EDITOR,
        permissions: [],
        teamIds: [],
      };
      mockExecutionContext = createMockExecutionContext(user);

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException
      );

      try {
        guard.canActivate(mockExecutionContext);
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect((error as ForbiddenException).message).toBe('Insufficient role');
        expect((error as ForbiddenException).getResponse()).toEqual({
          message: 'Insufficient role',
          required: [SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.SYSTEM_ADMIN],
        });
      }
    });

    it('should return true when user role matches exactly', () => {
      mockReflector.getAllAndOverride.mockReturnValue({
        roleNames: [SYSTEM_ROLES.ADMIN],
      } as RolesMetadata);
      const user: AuthUser = {
        id: 1,
        username: 'test',
        displayName: 'Test User',
        email: 'test@example.com',
        roleId: SYSTEM_ROLE_IDS.ADMIN,
        roleName: SYSTEM_ROLES.ADMIN,
        permissions: [],
        teamIds: [],
      };
      mockExecutionContext = createMockExecutionContext(user);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });
  });
});
