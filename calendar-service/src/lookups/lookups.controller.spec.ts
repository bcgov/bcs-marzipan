import { Test, TestingModule } from '@nestjs/testing';

import type { AuthUser } from '@corpcal/shared';
import type { LookupItem } from '@corpcal/shared/api/types';

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

  const mockLookupsService = {
    getCategories: vi.fn(),
    getOrganizations: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
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
        sortOrder: 1,
      };
      const created = { id: 10, name: body.name, sortOrder: body.sortOrder };
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
});
