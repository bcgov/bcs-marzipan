import { Test, TestingModule } from '@nestjs/testing';

import { PERMISSIONS, type AuthUser } from '@corpcal/shared';

import { FavouritesController } from './favourites.controller';
import { FavouritesService } from './favourites.service';

describe('FavouritesController', () => {
  let controller: FavouritesController;

  const mockFavouritesService = {
    list: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
  };

  const baseUser: AuthUser = {
    id: 42,
    username: 'testuser',
    displayName: 'Test User',
    email: 'test@example.com',
    roleId: 1,
    roleName: 'User',
    permissions: [PERMISSIONS.ACTIVITIES.VIEW],
    teamIds: [],
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FavouritesController],
      providers: [
        { provide: FavouritesService, useValue: mockFavouritesService },
      ],
    }).compile();

    controller = module.get<FavouritesController>(FavouritesController);
  });

  describe('list', () => {
    it('returns success with activityIds from the service', async () => {
      mockFavouritesService.list.mockResolvedValue([1, 2, 3]);

      const result = await controller.list(baseUser);

      expect(result).toEqual({
        success: true,
        data: { activityIds: [1, 2, 3] },
      });
      expect(mockFavouritesService.list).toHaveBeenCalledWith(42);
    });

    it('returns an empty activityIds array when user has no favourites', async () => {
      mockFavouritesService.list.mockResolvedValue([]);

      const result = await controller.list(baseUser);

      expect(result).toEqual({ success: true, data: { activityIds: [] } });
    });
  });

  describe('add', () => {
    it('calls service.add with the correct ids and returns success', async () => {
      mockFavouritesService.add.mockResolvedValue(undefined);

      const result = await controller.add(baseUser, 10);

      expect(result).toEqual({ success: true });
      expect(mockFavouritesService.add).toHaveBeenCalledWith(42, 10);
    });
  });

  describe('remove', () => {
    it('calls service.remove with the correct ids and returns success', async () => {
      mockFavouritesService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(baseUser, 10);

      expect(result).toEqual({ success: true });
      expect(mockFavouritesService.remove).toHaveBeenCalledWith(42, 10);
    });
  });
});
