import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';

import { SYSTEM_ROLES } from '@corpcal/shared';

import { DatabaseService } from '../database/database.service';
import { PolicyService } from './policy.service';

describe('PolicyService', () => {
  let service: PolicyService;
  let mockDatabaseService: {
    db: unknown;
  };

  beforeEach(async () => {
    mockDatabaseService = {
      db: {} as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PolicyService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<PolicyService>(PolicyService);
  });

  describe('bypassesDataScoping', () => {
    it('should return true for Admin role', () => {
      expect(service.bypassesDataScoping(SYSTEM_ROLES.ADMIN)).toBe(true);
    });

    it('should return true for System Admin role', () => {
      expect(service.bypassesDataScoping(SYSTEM_ROLES.SYSTEM_ADMIN)).toBe(true);
    });

    it('should return true for Advanced Editor role', () => {
      expect(service.bypassesDataScoping(SYSTEM_ROLES.ADVANCED_EDITOR)).toBe(
        true
      );
    });

    it('should return true for Advanced Viewer role', () => {
      expect(service.bypassesDataScoping(SYSTEM_ROLES.ADVANCED_VIEWER)).toBe(
        true
      );
    });

    it('should return false for Editor role', () => {
      expect(service.bypassesDataScoping(SYSTEM_ROLES.EDITOR)).toBe(false);
    });

    it('should return false for Viewer role', () => {
      expect(service.bypassesDataScoping(SYSTEM_ROLES.VIEWER)).toBe(false);
    });

    it('should return false for unknown role name', () => {
      expect(service.bypassesDataScoping('Unknown Role')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(service.bypassesDataScoping('')).toBe(false);
    });
  });

  describe('hasPermission', () => {
    it('should return true when key is in permissions array', () => {
      const permissions = ['activities.view', 'activities.create'];
      expect(service.hasPermission(permissions, 'activities.view')).toBe(true);
    });

    it('should return false when key is not in permissions array', () => {
      const permissions = ['activities.view', 'activities.create'];
      expect(service.hasPermission(permissions, 'activities.delete')).toBe(
        false
      );
    });

    it('should return false for empty permissions array', () => {
      expect(service.hasPermission([], 'activities.view')).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true when user has one of the keys', () => {
      const permissions = ['activities.view', 'activities.create'];
      const required = ['activities.delete', 'activities.view'];
      expect(service.hasAnyPermission(permissions, required)).toBe(true);
    });

    it('should return true when user has all of the keys', () => {
      const permissions = ['activities.view', 'activities.create'];
      const required = ['activities.view', 'activities.create'];
      expect(service.hasAnyPermission(permissions, required)).toBe(true);
    });

    it('should return false when user has none of the keys', () => {
      const permissions = ['activities.view', 'activities.create'];
      const required = ['activities.delete', 'activities.approve'];
      expect(service.hasAnyPermission(permissions, required)).toBe(false);
    });

    it('should return false for empty permissions array', () => {
      const required = ['activities.view'];
      expect(service.hasAnyPermission([], required)).toBe(false);
    });

    it('should return true for empty keys array', () => {
      const permissions = ['activities.view'];
      expect(service.hasAnyPermission(permissions, [])).toBe(true);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true when user has all keys', () => {
      const permissions = [
        'activities.view',
        'activities.create',
        'activities.edit',
      ];
      const required = ['activities.view', 'activities.create'];
      expect(service.hasAllPermissions(permissions, required)).toBe(true);
    });

    it('should return false when user is missing one key', () => {
      const permissions = ['activities.view', 'activities.create'];
      const required = [
        'activities.view',
        'activities.create',
        'activities.delete',
      ];
      expect(service.hasAllPermissions(permissions, required)).toBe(false);
    });

    it('should return false for empty permissions array when keys are required', () => {
      const required = ['activities.view'];
      expect(service.hasAllPermissions([], required)).toBe(false);
    });

    it('should return true for empty keys array', () => {
      const permissions = ['activities.view'];
      expect(service.hasAllPermissions(permissions, [])).toBe(true);
    });

    it('should return true when both arrays are empty', () => {
      expect(service.hasAllPermissions([], [])).toBe(true);
    });
  });

  describe('getActivityStatusNameForActivity', () => {
    it('should return status name when activity exists', async () => {
      mockDatabaseService.db = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi
                  .fn()
                  .mockResolvedValue([{ name: 'delete_requested' }]),
              }),
            }),
          }),
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PolicyService,
          {
            provide: DatabaseService,
            useValue: mockDatabaseService,
          },
        ],
      }).compile();

      const policyService = module.get<PolicyService>(PolicyService);
      const result = await policyService.getActivityStatusNameForActivity(1);
      expect(result).toBe('delete_requested');
    });

    it('should return null when activity not found', async () => {
      mockDatabaseService.db = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PolicyService,
          {
            provide: DatabaseService,
            useValue: mockDatabaseService,
          },
        ],
      }).compile();

      const policyService = module.get<PolicyService>(PolicyService);
      const result = await policyService.getActivityStatusNameForActivity(999);
      expect(result).toBeNull();
    });
  });

  describe('getLeadTeamIdForActivity', () => {
    it('should return leadTeamId when activity exists', async () => {
      mockDatabaseService.db = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ leadTeamId: 5 }]),
            }),
          }),
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PolicyService,
          {
            provide: DatabaseService,
            useValue: mockDatabaseService,
          },
        ],
      }).compile();

      const policyService = module.get<PolicyService>(PolicyService);
      const result = await policyService.getLeadTeamIdForActivity(1);
      expect(result).toBe(5);
    });

    it('should return null when activity not found', async () => {
      mockDatabaseService.db = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PolicyService,
          {
            provide: DatabaseService,
            useValue: mockDatabaseService,
          },
        ],
      }).compile();

      const policyService = module.get<PolicyService>(PolicyService);
      const result = await policyService.getLeadTeamIdForActivity(999);
      expect(result).toBeNull();
    });
  });

  describe('getPermissionsForTeams', () => {
    it('should return empty array when teamIds is empty', async () => {
      const result = await service.getPermissionsForTeams([]);
      expect(result).toEqual([]);
    });

    it('should return merged permissions from team roles and team_permissions', async () => {
      mockDatabaseService.db = {
        select: vi
          .fn()
          .mockImplementation(
            (arg: { id?: number; roleId?: number; key?: string }) => {
              if ('roleId' in arg && !('key' in arg)) {
                return {
                  from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([
                      { id: 1, roleId: 2 },
                      { id: 2, roleId: 2 },
                    ]),
                  }),
                };
              }
              if ('key' in arg) {
                return {
                  from: vi.fn().mockReturnValue({
                    innerJoin: vi.fn().mockReturnValue({
                      where: vi
                        .fn()
                        .mockResolvedValue([
                          { key: 'activities.edit' },
                          { key: 'activities.view' },
                        ]),
                    }),
                  }),
                };
              }
              return {
                from: vi
                  .fn()
                  .mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
              };
            }
          ),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PolicyService,
          {
            provide: DatabaseService,
            useValue: mockDatabaseService,
          },
        ],
      }).compile();

      const policyService = module.get<PolicyService>(PolicyService);
      vi.spyOn(policyService as any, 'getPermissionsForRole').mockResolvedValue(
        ['activities.view', 'activities.create']
      );

      const result = await policyService.getPermissionsForTeams([1, 2]);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toContain('activities.view');
      expect(result).toContain('activities.create');
      expect(result).toContain('activities.edit');
    });
  });

  describe('getEffectivePermissionsForUser', () => {
    it('should return empty permissions and bypass false when user not found', async () => {
      mockDatabaseService.db = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PolicyService,
          {
            provide: DatabaseService,
            useValue: mockDatabaseService,
          },
        ],
      }).compile();

      const policyService = module.get<PolicyService>(PolicyService);
      vi.spyOn(policyService, 'getTeamIdsForUser').mockResolvedValue([]);

      const result = await policyService.getEffectivePermissionsForUser(999);
      expect(result).toEqual({ permissions: [], bypass: false });
    });

    it('should return merged user and team permissions and bypass from user role', async () => {
      mockDatabaseService.db = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi
                  .fn()
                  .mockReturnValue(Promise.resolve([{ roleId: 1 }])),
              }),
            }),
          }),
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PolicyService,
          {
            provide: DatabaseService,
            useValue: mockDatabaseService,
          },
        ],
      }).compile();

      const policyService = module.get<PolicyService>(PolicyService);
      vi.spyOn(policyService, 'getTeamIdsForUser').mockResolvedValue([1]);
      vi.spyOn(policyService as any, 'getPermissionsForRole').mockResolvedValue(
        ['activities.view']
      );
      vi.spyOn(policyService, 'getPermissionsForTeams').mockResolvedValue([
        'activities.edit',
      ]);
      vi.spyOn(policyService, 'getRoleName').mockResolvedValue(
        SYSTEM_ROLES.ADMIN
      );

      const result = await policyService.getEffectivePermissionsForUser(1);
      expect(result.permissions).toContain('activities.view');
      expect(result.permissions).toContain('activities.edit');
      expect(result.bypass).toBe(true);
    });
  });
});
