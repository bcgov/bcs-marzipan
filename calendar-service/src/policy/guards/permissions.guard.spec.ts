import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import type { Mock } from 'vitest';

import { SYSTEM_ROLE_IDS, SYSTEM_ROLES, type AuthUser } from '@corpcal/shared';

import { PermissionsGuard } from './permissions.guard';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
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
        PermissionsGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<PermissionsGuard>(PermissionsGuard);
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

    it('should return true when metadata.keys is undefined', () => {
      mockReflector.getAllAndOverride.mockReturnValue({
        keys: undefined,
        mode: 'any',
      } as any);
      mockExecutionContext = createMockExecutionContext();

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should return true when metadata.keys is empty array', () => {
      mockReflector.getAllAndOverride.mockReturnValue({
        keys: [],
        mode: 'any',
      });
      mockExecutionContext = createMockExecutionContext();

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });
  });

  describe('when user is not authenticated', () => {
    it('should throw ForbiddenException when request.user is undefined', () => {
      mockReflector.getAllAndOverride.mockReturnValue({
        keys: ['activities.view'],
        mode: 'any',
      });
      mockExecutionContext = createMockExecutionContext(undefined);

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException
      );
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        'Authentication required'
      );
    });

    it('should throw ForbiddenException when user.permissions is undefined', () => {
      mockReflector.getAllAndOverride.mockReturnValue({
        keys: ['activities.view'],
        mode: 'any',
      });
      const userWithoutPermissions = {
        id: 1,
        username: 'test',
        displayName: 'Test User',
        email: 'test@example.com',
        roleId: SYSTEM_ROLE_IDS.EDITOR,
        roleName: SYSTEM_ROLES.EDITOR,
        teamIds: [],
      } as unknown as AuthUser;
      mockExecutionContext = createMockExecutionContext(userWithoutPermissions);

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException
      );
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        'Authentication required'
      );
    });
  });

  describe('mode: any', () => {
    it('should return true when user has one of the required permissions', () => {
      mockReflector.getAllAndOverride.mockReturnValue({
        keys: ['activities.view', 'activities.create'],
        mode: 'any',
      });
      const user: AuthUser = {
        id: 1,
        username: 'test',
        displayName: 'Test User',
        email: 'test@example.com',
        roleId: SYSTEM_ROLE_IDS.EDITOR,
        roleName: SYSTEM_ROLES.EDITOR,
        permissions: ['activities.view'],
        teamIds: [],
      };
      mockExecutionContext = createMockExecutionContext(user);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should return true when user has all of the required permissions', () => {
      mockReflector.getAllAndOverride.mockReturnValue({
        keys: ['activities.view', 'activities.create'],
        mode: 'any',
      });
      const user: AuthUser = {
        id: 1,
        username: 'test',
        displayName: 'Test User',
        email: 'test@example.com',
        roleId: SYSTEM_ROLE_IDS.EDITOR,
        roleName: SYSTEM_ROLES.EDITOR,
        permissions: ['activities.view', 'activities.create'],
        teamIds: [],
      };
      mockExecutionContext = createMockExecutionContext(user);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user has none of the required permissions', () => {
      mockReflector.getAllAndOverride.mockReturnValue({
        keys: ['activities.view', 'activities.create'],
        mode: 'any',
      });
      const user: AuthUser = {
        id: 1,
        username: 'test',
        displayName: 'Test User',
        email: 'test@example.com',
        roleId: SYSTEM_ROLE_IDS.EDITOR,
        roleName: SYSTEM_ROLES.EDITOR,
        permissions: ['activities.delete'],
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
        expect((error as ForbiddenException).message).toBe('Permission denied');
        expect((error as ForbiddenException).getResponse()).toEqual({
          message: 'Permission denied',
          required: ['activities.view', 'activities.create'],
        });
      }
    });
  });

  describe('mode: all', () => {
    it('should return true when user has all required permissions', () => {
      mockReflector.getAllAndOverride.mockReturnValue({
        keys: ['activities.view', 'activities.create'],
        mode: 'all',
      });
      const user: AuthUser = {
        id: 1,
        username: 'test',
        displayName: 'Test User',
        email: 'test@example.com',
        roleId: SYSTEM_ROLE_IDS.EDITOR,
        roleName: SYSTEM_ROLES.EDITOR,
        permissions: [
          'activities.view',
          'activities.create',
          'activities.edit',
        ],
        teamIds: [],
      };
      mockExecutionContext = createMockExecutionContext(user);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user is missing one permission', () => {
      mockReflector.getAllAndOverride.mockReturnValue({
        keys: ['activities.view', 'activities.create', 'activities.delete'],
        mode: 'all',
      });
      const user: AuthUser = {
        id: 1,
        username: 'test',
        displayName: 'Test User',
        email: 'test@example.com',
        roleId: SYSTEM_ROLE_IDS.EDITOR,
        roleName: SYSTEM_ROLES.EDITOR,
        permissions: ['activities.view', 'activities.create'],
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
        expect((error as ForbiddenException).message).toBe('Permission denied');
        expect((error as ForbiddenException).getResponse()).toEqual({
          message: 'Permission denied',
          required: [
            'activities.view',
            'activities.create',
            'activities.delete',
          ],
        });
      }
    });
  });
});
