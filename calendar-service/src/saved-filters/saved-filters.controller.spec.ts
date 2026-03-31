import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PERMISSIONS, type AuthUser } from '@corpcal/shared';

import { SavedFiltersController } from './saved-filters.controller';
import { SavedFiltersService } from './saved-filters.service';

describe('SavedFiltersController', () => {
  let controller: SavedFiltersController;

  const mockSavedFiltersService = {
    getOwnedFilterForDuplicate: vi.fn(),
    duplicate: vi.fn(),
    list: vi.fn(),
    setMyDefault: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  const baseUser: AuthUser = {
    id: 10,
    username: 'u',
    displayName: 'U',
    email: 'u@example.com',
    roleId: 1,
    roleName: 'User',
    permissions: [
      PERMISSIONS.SAVED_FILTERS.VIEW,
      PERMISSIONS.SAVED_FILTERS.CREATE,
      PERMISSIONS.SAVED_FILTERS.EDIT,
      PERMISSIONS.SAVED_FILTERS.DELETE,
      PERMISSIONS.SAVED_FILTERS.SHARE_TEAM,
      PERMISSIONS.SAVED_FILTERS.SHARE_GLOBAL,
    ],
    teamIds: [5],
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SavedFiltersController],
      providers: [
        { provide: SavedFiltersService, useValue: mockSavedFiltersService },
      ],
    }).compile();

    controller = module.get<SavedFiltersController>(SavedFiltersController);
  });

  describe('duplicate', () => {
    const makeRow = (overrides: Record<string, unknown> = {}) => ({
      id: 1,
      ownerUserId: 10,
      name: 'Src',
      filterState: { categoryNames: ['A'] },
      searchKeyword: '',
      isDefault: false,
      sortOrder: 0,
      isActive: true,
      scopeType: 'user',
      scopeTeamId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    });

    it('throws ForbiddenException when duplicating team-scoped source without SHARE_TEAM', async () => {
      mockSavedFiltersService.getOwnedFilterForDuplicate.mockResolvedValue({
        scopeType: 'team',
        row: makeRow({ scopeType: 'team', scopeTeamId: 5 }),
      });

      const user: AuthUser = {
        ...baseUser,
        permissions: baseUser.permissions.filter(
          (p) => p !== PERMISSIONS.SAVED_FILTERS.SHARE_TEAM
        ),
      };

      await expect(controller.duplicate(user, 1, {})).rejects.toThrow(
        ForbiddenException
      );
      expect(mockSavedFiltersService.duplicate).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when duplicating global-scoped source without SHARE_GLOBAL', async () => {
      mockSavedFiltersService.getOwnedFilterForDuplicate.mockResolvedValue({
        scopeType: 'global',
        row: makeRow({ scopeType: 'global' }),
      });

      const user: AuthUser = {
        ...baseUser,
        permissions: baseUser.permissions.filter(
          (p) => p !== PERMISSIONS.SAVED_FILTERS.SHARE_GLOBAL
        ),
      };

      await expect(controller.duplicate(user, 1, {})).rejects.toThrow(
        ForbiddenException
      );
      expect(mockSavedFiltersService.duplicate).not.toHaveBeenCalled();
    });

    it('calls duplicate when team scope and user has SHARE_TEAM', async () => {
      const row = makeRow({ scopeType: 'team', scopeTeamId: 5 });
      mockSavedFiltersService.getOwnedFilterForDuplicate.mockResolvedValue({
        scopeType: 'team',
        row,
      });
      mockSavedFiltersService.duplicate.mockResolvedValue({
        id: 2,
        name: 'Src (copy)',
        ownerUserId: 10,
        filterState: {},
        searchKeyword: '',
        isDefault: false,
        sortOrder: 0,
        scopeType: 'team',
        scopeTeamId: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const result = await controller.duplicate(baseUser, 1, {});

      expect(result.success).toBe(true);
      expect(mockSavedFiltersService.duplicate).toHaveBeenCalledWith(
        10,
        {},
        row
      );
    });
  });
});
