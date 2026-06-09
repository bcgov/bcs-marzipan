import { Test, TestingModule } from '@nestjs/testing';

import { SYSTEM_ROLE_IDS, type AuthUser } from '@corpcal/shared';
import type { LookupItem, VenuePresetItem } from '@corpcal/shared/api/types';
import type { TeamListItem } from '@corpcal/shared/schemas';

import { TeamsService } from '../teams/teams.service';
import { LookupsController } from './lookups.controller';
import { LookupsService } from './lookups.service';

const mockUser: AuthUser = {
  id: 1,
  username: 'testuser',
  displayName: 'Test User',
  email: 'test@example.com',
  roleId: 5,
  roleName: 'Admin',
  permissions: ['lookups.manage'],
  teamIds: [],
};

describe('LookupsController', () => {
  let controller: LookupsController;

  const mockLookupItems: LookupItem[] = [
    { id: 1, label: 'Category 1', value: 1 },
    { id: 2, label: 'Category 2', value: 2 },
  ];

  const mockVenuePreset: VenuePresetItem = {
    id: 1,
    venueName: 'BC Legislature',
    addressLine1: '501 Belleville St',
    addressLine2: null,
    city: 'Victoria',
    provinceOrState: 'British Columbia',
    country: 'Canada',
    isPinned: true,
    pinnedSortOrder: 1,
  };

  const mockLookupsService = {
    getCategories: vi.fn(),
    getOrganizations: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    getVenuePresets: vi.fn(),
    createVenuePreset: vi.fn(),
    updateVenuePreset: vi.fn(),
    deleteVenuePreset: vi.fn(),
    getActivityTeamSharingQuickShare: vi.fn(),
    getRolePermissions: vi.fn(),
    getAllPermissions: vi.fn(),
    updatePermissionVisibility: vi.fn(),
  };

  const mockTeamsService = {
    findAll: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LookupsController],
      providers: [
        {
          provide: LookupsService,
          useValue: mockLookupsService,
        },
        {
          provide: TeamsService,
          useValue: mockTeamsService,
        },
      ],
    }).compile();

    controller = module.get<LookupsController>(LookupsController);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getActivityTeamSharing', () => {
    const mockTeams: TeamListItem[] = [
      {
        id: 1,
        name: 'Team A',
        displayName: 'Team A',
        abbreviation: 'TA',
        description: null,
        sortOrder: 0,
        isActive: true,
        roleId: null,
        memberCount: 2,
        ministryId: 5,
        ministryName: 'M1',
      },
    ];

    it('returns teams and quick share groups', async () => {
      mockTeamsService.findAll.mockResolvedValue(mockTeams);
      mockLookupsService.getActivityTeamSharingQuickShare.mockResolvedValue({
        groups: [
          {
            id: 1,
            name: 'Social',
            sortOrder: 0,
            ministryIds: [5],
          },
        ],
      });

      const result = await controller.getActivityTeamSharing();

      expect(result).toEqual({
        success: true,
        data: {
          teams: mockTeams,
          quickShare: {
            groups: [
              {
                id: 1,
                name: 'Social',
                sortOrder: 0,
                ministryIds: [5],
              },
            ],
          },
        },
      });
      expect(mockTeamsService.findAll).toHaveBeenCalledWith(true);
      expect(
        mockLookupsService.getActivityTeamSharingQuickShare
      ).toHaveBeenCalledTimes(1);
    });

    it('returns quickShare null when there are no ministry groups', async () => {
      mockTeamsService.findAll.mockResolvedValue([]);
      mockLookupsService.getActivityTeamSharingQuickShare.mockResolvedValue(
        null
      );

      const result = await controller.getActivityTeamSharing();

      expect(result).toEqual({
        success: true,
        data: { teams: [], quickShare: null },
      });
    });
  });

  describe('getCategories', () => {
    it('should return all categories', async () => {
      mockLookupsService.getCategories.mockResolvedValue(mockLookupItems);

      const result = await controller.getCategories(mockUser);

      expect(result).toEqual({
        success: true,
        data: mockLookupItems,
      });
      expect(mockLookupsService.getCategories).toHaveBeenCalledWith(
        mockUser.teamIds
      );
    });
  });

  describe('getOrganizations', () => {
    it('should return all organizations without filters', async () => {
      mockLookupsService.getOrganizations.mockResolvedValue(mockLookupItems);

      const result = await controller.getOrganizations();

      expect(result).toEqual({
        success: true,
        data: mockLookupItems,
      });
      expect(mockLookupsService.getOrganizations).toHaveBeenCalledWith({
        userId: undefined,
        role: undefined,
        organizationId: undefined,
      });
    });

    it('should return filtered organizations by userId', async () => {
      mockLookupsService.getOrganizations.mockResolvedValue(mockLookupItems);

      const result = await controller.getOrganizations(1);

      expect(result).toEqual({
        success: true,
        data: mockLookupItems,
      });
      expect(mockLookupsService.getOrganizations).toHaveBeenCalledWith({
        userId: 1,
        role: undefined,
        organizationId: undefined,
      });
    });

    it('should return filtered organizations by role', async () => {
      mockLookupsService.getOrganizations.mockResolvedValue(mockLookupItems);

      const result = await controller.getOrganizations(undefined, 'admin');

      expect(result).toEqual({
        success: true,
        data: mockLookupItems,
      });
      expect(mockLookupsService.getOrganizations).toHaveBeenCalledWith({
        userId: undefined,
        role: 'admin',
        organizationId: undefined,
      });
    });
  });

  describe('createCategory', () => {
    it('should create a category and pass user id to service', async () => {
      const body = {
        name: 'New Category',
        displayName: 'New Category',
        sortOrder: 1,
      };
      const created = {
        id: 10,
        name: body.name,
        displayName: body.displayName,
        sortOrder: body.sortOrder,
      };
      mockLookupsService.createCategory.mockResolvedValue(created);

      const result = await controller.createCategory(body, mockUser);

      expect(result).toEqual({ success: true, data: created });
      expect(mockLookupsService.createCategory).toHaveBeenCalledWith(
        body,
        mockUser.id
      );
      expect(mockLookupsService.createCategory).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateCategory', () => {
    it('should update a category and pass user id to service', async () => {
      const id = '5';
      const body = { displayName: 'Updated Name' };
      const transformedBody = { ...body, displayName: body.displayName };
      const updated = { id: 5, name: 'Cat', displayName: body.displayName };
      mockLookupsService.updateCategory.mockResolvedValue(updated);

      const result = await controller.updateCategory(id, body, mockUser);

      expect(result).toEqual({ success: true, data: updated });
      expect(mockLookupsService.updateCategory).toHaveBeenCalledWith(
        5,
        transformedBody,
        mockUser.id
      );
      expect(mockLookupsService.updateCategory).toHaveBeenCalledTimes(1);
    });
  });

  describe('getVenuePresets', () => {
    it('should return venue presets', async () => {
      mockLookupsService.getVenuePresets.mockResolvedValue([mockVenuePreset]);

      const result = await controller.getVenuePresets();

      expect(result).toEqual({
        success: true,
        data: [mockVenuePreset],
      });
      expect(mockLookupsService.getVenuePresets).toHaveBeenCalledTimes(1);
    });
  });

  describe('createVenuePreset', () => {
    it('should create a venue preset and pass user id to service', async () => {
      const body = {
        venueName: 'Vancouver Convention Centre',
        addressLine1: '1055 Canada Pl',
        city: 'Vancouver',
        provinceOrState: 'British Columbia',
        country: 'Canada',
      };
      mockLookupsService.createVenuePreset.mockResolvedValue(mockVenuePreset);

      const result = await controller.createVenuePreset(body, mockUser);

      expect(result).toEqual({ success: true, data: mockVenuePreset });
      expect(mockLookupsService.createVenuePreset).toHaveBeenCalledWith(
        body,
        mockUser.id
      );
      expect(mockLookupsService.createVenuePreset).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateVenuePreset', () => {
    it('should update a venue preset and pass user id to service', async () => {
      const id = '1';
      const body = { venueName: 'Updated Venue Name' };
      mockLookupsService.updateVenuePreset.mockResolvedValue({
        ...mockVenuePreset,
        venueName: body.venueName,
      });

      const result = await controller.updateVenuePreset(id, body, mockUser);

      expect(result.success).toBe(true);
      expect(result.data.venueName).toBe(body.venueName);
      expect(mockLookupsService.updateVenuePreset).toHaveBeenCalledWith(
        1,
        body,
        mockUser.id
      );
      expect(mockLookupsService.updateVenuePreset).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteVenuePreset', () => {
    it('should delete a venue preset', async () => {
      mockLookupsService.deleteVenuePreset.mockResolvedValue(undefined);

      const result = await controller.deleteVenuePreset('1');

      expect(result).toEqual({ success: true });
      expect(mockLookupsService.deleteVenuePreset).toHaveBeenCalledWith(1);
      expect(mockLookupsService.deleteVenuePreset).toHaveBeenCalledTimes(1);
    });
  });

  describe('permissions endpoints', () => {
    it('getRolePermissions returns envelope and calls service with numeric id', async () => {
      const mockPerms = [
        {
          key: 'perm.view_users',
          displayName: 'View users',
          description: 'Can view users',
          hasPermission: true,
        },
        {
          key: 'perm.edit_users',
          displayName: 'Edit users',
          description: null,
          hasPermission: false,
        },
      ];

      mockLookupsService.getRolePermissions.mockResolvedValue(mockPerms);

      const result = await controller.getRolePermissions('3');

      expect(result).toEqual({ success: true, data: mockPerms });
      expect(mockLookupsService.getRolePermissions).toHaveBeenCalledWith(3);
    });

    it('getAllPermissions rejects non-system-admin callers', async () => {
      mockLookupsService.getAllPermissions.mockResolvedValue([]);

      await expect(controller.getAllPermissions(mockUser)).rejects.toThrow(
        'Only System Admin users can manage permission visibility.'
      );
      expect(mockLookupsService.getAllPermissions).not.toHaveBeenCalled();
    });

    it('getAllPermissions returns data for system admin', async () => {
      const sysAdminUser = {
        ...mockUser,
        roleId: SYSTEM_ROLE_IDS.SYSTEM_ADMIN,
        permissions: ['system.manage_permissions'],
      };
      const perms = [{ id: 1, key: 'perm.a', showInUserManagement: true }];
      mockLookupsService.getAllPermissions.mockResolvedValue(perms);

      const result = await controller.getAllPermissions(sysAdminUser);

      expect(result).toEqual({ success: true, data: perms });
      expect(mockLookupsService.getAllPermissions).toHaveBeenCalledTimes(1);
    });

    it('updatePermissionVisibility rejects non-system-admin callers', async () => {
      await expect(
        controller.updatePermissionVisibility(
          '10',
          { showInUserManagement: true } as any,
          mockUser
        )
      ).rejects.toThrow(
        'Only System Admin users can manage permission visibility.'
      );
    });

    it('updatePermissionVisibility calls service and returns envelope for system admin', async () => {
      const sysAdminUser = {
        ...mockUser,
        roleId: SYSTEM_ROLE_IDS.SYSTEM_ADMIN,
        permissions: ['system.manage_permissions'],
      };
      const updated = { id: 10, key: 'perm.x', showInUserManagement: true };
      mockLookupsService.updatePermissionVisibility.mockResolvedValue(updated);

      const result = await controller.updatePermissionVisibility(
        '10',
        { showInUserManagement: true },
        sysAdminUser
      );

      expect(result).toEqual({ success: true, data: updated });
      expect(
        mockLookupsService.updatePermissionVisibility
      ).toHaveBeenCalledWith(10, true, sysAdminUser.id);
    });
  });
});
