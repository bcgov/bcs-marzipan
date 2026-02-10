import { Test, TestingModule } from '@nestjs/testing';
import { PolicyService } from './policy.service';
import { DatabaseService } from '../database/database.service';
import { SYSTEM_ROLES } from '@corpcal/shared';

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

    it('should return true for Advanced role', () => {
      expect(service.bypassesDataScoping(SYSTEM_ROLES.ADVANCED)).toBe(true);
    });

    it('should return false for Editor role', () => {
      expect(service.bypassesDataScoping(SYSTEM_ROLES.EDITOR)).toBe(false);
    });

    it('should return false for View Only role', () => {
      expect(service.bypassesDataScoping(SYSTEM_ROLES.VIEW_ONLY)).toBe(false);
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
});
