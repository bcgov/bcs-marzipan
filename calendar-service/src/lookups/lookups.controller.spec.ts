import { Test, TestingModule } from '@nestjs/testing';

import type { AuthUser } from '@corpcal/shared';
import type { LookupItem, VenueQuickPickItem } from '@corpcal/shared/api/types';

import { LookupsController } from './lookups.controller';
import { LookupsService } from './lookups.service';

const mockUser: AuthUser = {
  id: 1,
  username: 'testuser',
  displayName: 'Test User',
  email: 'test@example.com',
  roleId: 4,
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

  const mockVenueQuickPick: VenueQuickPickItem = {
    id: 1,
    venueName: 'BC Legislature',
    street: '501 Belleville St',
    city: 'Victoria',
    provinceOrState: 'British Columbia',
    country: 'Canada',
  };

  const mockLookupsService = {
    getCategories: vi.fn(),
    getOrganizations: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    getVenueQuickPicks: vi.fn(),
    getVenueLastUsed: vi.fn(),
    createVenueQuickPick: vi.fn(),
    updateVenueQuickPick: vi.fn(),
    deleteVenueQuickPick: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LookupsController],
      providers: [
        {
          provide: LookupsService,
          useValue: mockLookupsService,
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

  describe('getCategories', () => {
    it('should return all categories', async () => {
      mockLookupsService.getCategories.mockResolvedValue(mockLookupItems);

      const result = await controller.getCategories();

      expect(result).toEqual({
        success: true,
        data: mockLookupItems,
      });
      expect(mockLookupsService.getCategories).toHaveBeenCalledTimes(1);
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

  describe('getVenueQuickPicks', () => {
    it('should return venue quick-picks', async () => {
      mockLookupsService.getVenueQuickPicks.mockResolvedValue([
        mockVenueQuickPick,
      ]);

      const result = await controller.getVenueQuickPicks();

      expect(result).toEqual({
        success: true,
        data: [mockVenueQuickPick],
      });
      expect(mockLookupsService.getVenueQuickPicks).toHaveBeenCalledTimes(1);
    });
  });

  describe('getVenueLastUsed', () => {
    it('should return last-used venues for current user', async () => {
      mockLookupsService.getVenueLastUsed.mockResolvedValue([
        mockVenueQuickPick,
      ]);

      const result = await controller.getVenueLastUsed(mockUser);

      expect(result).toEqual({
        success: true,
        data: [mockVenueQuickPick],
      });
      expect(mockLookupsService.getVenueLastUsed).toHaveBeenCalledWith(
        mockUser.id
      );
      expect(mockLookupsService.getVenueLastUsed).toHaveBeenCalledTimes(1);
    });
  });

  describe('createVenueQuickPick', () => {
    it('should create a venue quick-pick and pass user id to service', async () => {
      const body = {
        venueName: 'Vancouver Convention Centre',
        street: '1055 Canada Pl',
        city: 'Vancouver',
        provinceOrState: 'British Columbia',
        country: 'Canada',
      };
      mockLookupsService.createVenueQuickPick.mockResolvedValue(
        mockVenueQuickPick
      );

      const result = await controller.createVenueQuickPick(body, mockUser);

      expect(result).toEqual({ success: true, data: mockVenueQuickPick });
      expect(mockLookupsService.createVenueQuickPick).toHaveBeenCalledWith(
        body,
        mockUser.id
      );
      expect(mockLookupsService.createVenueQuickPick).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateVenueQuickPick', () => {
    it('should update a venue quick-pick and pass user id to service', async () => {
      const id = '1';
      const body = { venueName: 'Updated Venue Name' };
      mockLookupsService.updateVenueQuickPick.mockResolvedValue({
        ...mockVenueQuickPick,
        venueName: body.venueName,
      });

      const result = await controller.updateVenueQuickPick(id, body, mockUser);

      expect(result.success).toBe(true);
      expect(result.data.venueName).toBe(body.venueName);
      expect(mockLookupsService.updateVenueQuickPick).toHaveBeenCalledWith(
        1,
        body,
        mockUser.id
      );
      expect(mockLookupsService.updateVenueQuickPick).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteVenueQuickPick', () => {
    it('should delete a venue quick-pick', async () => {
      mockLookupsService.deleteVenueQuickPick.mockResolvedValue(undefined);

      const result = await controller.deleteVenueQuickPick('1');

      expect(result).toEqual({ success: true });
      expect(mockLookupsService.deleteVenueQuickPick).toHaveBeenCalledWith(1);
      expect(mockLookupsService.deleteVenueQuickPick).toHaveBeenCalledTimes(1);
    });
  });
});
