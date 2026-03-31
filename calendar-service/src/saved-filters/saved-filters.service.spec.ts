import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { DatabaseService } from '../database/database.service';
import { SavedFiltersService } from './saved-filters.service';

describe('SavedFiltersService', () => {
  let service: SavedFiltersService;

  type Terminal = 'limit' | 'orderBy' | 'where' | 'from';
  const createChain = (
    resolvedValue: unknown,
    terminal: Terminal = 'limit'
  ) => {
    const value = Array.isArray(resolvedValue)
      ? resolvedValue
      : [resolvedValue];
    const chain = {
      from: vi.fn(),
      where: vi.fn(),
      orderBy: vi.fn(),
      limit: vi.fn(),
      returning: vi.fn(),
      set: vi.fn(),
      values: vi.fn(),
    };
    chain.from.mockReturnValue(chain);
    chain.where.mockReturnValue(chain);
    chain.orderBy.mockReturnValue(chain);
    chain.limit.mockReturnValue(chain);
    chain.returning.mockReturnValue(chain);
    chain.set.mockReturnValue(chain);
    chain.values.mockReturnValue(chain);
    (chain[terminal] as ReturnType<typeof vi.fn>).mockResolvedValue(value);
    return chain;
  };

  const mockDatabaseService = {
    db: {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const db = mockDatabaseService.db;
    db.select.mockReturnValue(db);
    db.from.mockReturnValue(db);
    db.where.mockReturnValue(db);
    db.orderBy.mockReturnValue(db);
    db.limit.mockReturnValue(db);
    db.insert.mockReturnValue(db);
    db.values.mockReturnValue(db);
    db.returning.mockResolvedValue([]);
    db.update.mockReturnValue(db);
    db.set.mockReturnValue(db);
    db.delete.mockReturnValue(db);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SavedFiltersService,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();

    service = module.get<SavedFiltersService>(SavedFiltersService);
  });

  const makeSavedFilterRow = (overrides = {}) => ({
    id: 1,
    ownerUserId: 10,
    contextKey: 'all',
    name: 'My filter',
    filterState: { categoryNames: ['Event'] },
    searchKeyword: 'test',
    sortOrder: 0,
    isActive: true,
    scopeType: 'user',
    scopeTeamId: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  });

  describe('listByContext', () => {
    it('should return saved filters for user with no team visibility', async () => {
      const row = makeSavedFilterRow();
      const chain = createChain([row], 'orderBy');
      const defaultChain = createChain([], 'limit');
      mockDatabaseService.db.select
        .mockReturnValueOnce(chain)
        .mockReturnValueOnce(defaultChain);
      chain.from.mockReturnValue(chain);
      chain.where.mockReturnValue(chain);
      defaultChain.from.mockReturnValue(defaultChain);
      defaultChain.where.mockReturnValue(defaultChain);

      const result = await service.listByContext(10, 'all', []);

      expect(result.filters).toHaveLength(1);
      expect(result.defaultSavedFilterId).toBeNull();
      expect(result.filters[0]).toEqual(
        expect.objectContaining({
          id: 1,
          name: 'My filter',
          contextKey: 'all',
          ownerUserId: 10,
        })
      );
    });

    it('should include team-shared filters when user has team IDs', async () => {
      const userRow = makeSavedFilterRow();
      const teamRow = makeSavedFilterRow({
        id: 2,
        name: 'Team filter',
        scopeType: 'team',
        scopeTeamId: 5,
      });
      const globalRow = makeSavedFilterRow({
        id: 3,
        name: 'Global filter',
        scopeType: 'global',
        scopeTeamId: null,
      });
      const chain = createChain([userRow, teamRow, globalRow], 'orderBy');
      const defaultChain = createChain([], 'limit');
      mockDatabaseService.db.select
        .mockReturnValueOnce(chain)
        .mockReturnValueOnce(defaultChain);
      chain.from.mockReturnValue(chain);
      chain.where.mockReturnValue(chain);
      defaultChain.from.mockReturnValue(defaultChain);
      defaultChain.where.mockReturnValue(defaultChain);

      const result = await service.listByContext(10, 'all', [5]);

      expect(result.filters).toHaveLength(3);
    });
  });

  describe('create', () => {
    it('should create a new saved filter', async () => {
      const row = makeSavedFilterRow();

      // assertNameUnique: no existing with same name
      const nameCheckChain = createChain([], 'limit');
      const defaultIdChain = createChain([], 'limit');
      mockDatabaseService.db.select
        .mockReturnValueOnce(nameCheckChain)
        .mockReturnValueOnce(defaultIdChain);
      nameCheckChain.from.mockReturnValue(nameCheckChain);
      nameCheckChain.where.mockReturnValue(nameCheckChain);
      defaultIdChain.from.mockReturnValue(defaultIdChain);
      defaultIdChain.where.mockReturnValue(defaultIdChain);

      // insert
      const insertChain = createChain(row, 'limit');
      mockDatabaseService.db.insert.mockReturnValueOnce(insertChain);
      insertChain.values = vi.fn().mockReturnValue(insertChain);
      const returningMock = vi.fn().mockResolvedValue([row]);
      insertChain.returning = returningMock;
      insertChain.values.mockReturnValue({ returning: returningMock });

      const result = await service.create(10, {
        contextKey: 'all',
        name: 'My filter',
        filterState: { categoryNames: ['Event'] },
        searchKeyword: 'test',
      });

      expect(result).toEqual(
        expect.objectContaining({ id: 1, name: 'My filter' })
      );
    });

    it('should reject create when filter payload is empty', async () => {
      await expect(
        service.create(10, {
          contextKey: 'all',
          name: 'Empty',
          filterState: {},
          searchKeyword: '',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException for duplicate names', async () => {
      const existing = { id: 99 };
      const nameCheckChain = createChain(existing, 'limit');
      mockDatabaseService.db.select.mockReturnValueOnce(nameCheckChain);
      nameCheckChain.from.mockReturnValue(nameCheckChain);
      nameCheckChain.where.mockReturnValue(nameCheckChain);

      await expect(
        service.create(10, {
          contextKey: 'all',
          name: 'Duplicate',
          filterState: { activityStatusIds: [1] },
          searchKeyword: '',
        })
      ).rejects.toThrow(ConflictException);
    });

    it('should reject team scope when scopeTeamId is missing', async () => {
      await expect(
        service.create(10, {
          contextKey: 'all',
          name: 'Team scoped',
          filterState: {},
          searchKeyword: '',
          scopeType: 'team',
        })
      ).rejects.toThrow('scopeTeamId is required when scopeType is team');
    });

    it('should reject team scope when user has no team ids', async () => {
      await expect(
        service.create(
          10,
          {
            contextKey: 'all',
            name: 'Team scoped',
            filterState: {},
            searchKeyword: '',
            scopeType: 'team',
            scopeTeamId: 5,
          },
          { teamIds: [] }
        )
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject team scope when scopeTeamId is not one of the user teams', async () => {
      await expect(
        service.create(
          10,
          {
            contextKey: 'all',
            name: 'Team scoped',
            filterState: {},
            searchKeyword: '',
            scopeType: 'team',
            scopeTeamId: 99,
          },
          { teamIds: [1, 2, 5] }
        )
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create team-scoped filter when scopeTeamId is in user team ids', async () => {
      const row = makeSavedFilterRow({
        name: 'Team scoped ok',
        filterState: { categoryNames: ['Event'] },
        searchKeyword: '',
        scopeType: 'team',
        scopeTeamId: 5,
      });

      const nameCheckChain = createChain([], 'limit');
      const defaultIdChain = createChain([], 'limit');
      mockDatabaseService.db.select
        .mockReturnValueOnce(nameCheckChain)
        .mockReturnValueOnce(defaultIdChain);
      nameCheckChain.from.mockReturnValue(nameCheckChain);
      nameCheckChain.where.mockReturnValue(nameCheckChain);
      defaultIdChain.from.mockReturnValue(defaultIdChain);
      defaultIdChain.where.mockReturnValue(defaultIdChain);

      const insertChain = createChain(row, 'limit');
      mockDatabaseService.db.insert.mockReturnValueOnce(insertChain);
      insertChain.values = vi.fn().mockReturnValue(insertChain);
      const returningMock = vi.fn().mockResolvedValue([row]);
      insertChain.returning = returningMock;
      insertChain.values.mockReturnValue({ returning: returningMock });

      const result = await service.create(
        10,
        {
          contextKey: 'all',
          name: 'Team scoped ok',
          filterState: { categoryNames: ['Event'] },
          searchKeyword: '',
          scopeType: 'team',
          scopeTeamId: 5,
        },
        { teamIds: [5, 12] }
      );

      expect(result).toEqual(
        expect.objectContaining({
          name: 'Team scoped ok',
          scopeType: 'team',
          scopeTeamId: 5,
        })
      );
    });
  });

  describe('update', () => {
    it('should reject update when merged filter payload becomes empty', async () => {
      const row = makeSavedFilterRow();
      const findChain = createChain(row, 'limit');
      mockDatabaseService.db.select.mockReturnValueOnce(findChain);
      findChain.from.mockReturnValue(findChain);
      findChain.where.mockReturnValue(findChain);

      await expect(
        service.update(10, 1, {
          filterState: {},
          searchKeyword: '',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow name-only update without merged empty check', async () => {
      const row = makeSavedFilterRow();
      const findChain = createChain(row, 'limit');
      findChain.from.mockReturnValue(findChain);
      findChain.where.mockReturnValue(findChain);

      const nameCheckChain = createChain([], 'limit');
      nameCheckChain.from.mockReturnValue(nameCheckChain);
      nameCheckChain.where.mockReturnValue(nameCheckChain);

      const defaultIdChain = createChain([], 'limit');
      defaultIdChain.from.mockReturnValue(defaultIdChain);
      defaultIdChain.where.mockReturnValue(defaultIdChain);

      mockDatabaseService.db.select
        .mockReturnValueOnce(findChain)
        .mockReturnValueOnce(nameCheckChain)
        .mockReturnValueOnce(defaultIdChain);

      const updated = { ...row, name: 'Renamed unique 701' };
      const updateChain = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([updated]),
      };
      mockDatabaseService.db.update.mockReturnValueOnce(updateChain);

      const result = await service.update(10, 1, {
        name: 'Renamed unique 701',
      });

      expect(result.name).toBe('Renamed unique 701');
    });
  });

  describe('findOwnedOrFail', () => {
    it('should throw NotFoundException when filter does not exist', async () => {
      const chain = createChain([], 'limit');
      mockDatabaseService.db.select.mockReturnValueOnce(chain);
      chain.from.mockReturnValue(chain);
      chain.where.mockReturnValue(chain);

      await expect(service.remove(10, 999)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own the filter', async () => {
      const row = makeSavedFilterRow({ ownerUserId: 99 });
      const chain = createChain(row, 'limit');
      mockDatabaseService.db.select.mockReturnValueOnce(chain);
      chain.from.mockReturnValue(chain);
      chain.where.mockReturnValue(chain);

      await expect(service.remove(10, 1)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should soft-delete a filter the user owns', async () => {
      const row = makeSavedFilterRow({ ownerUserId: 10 });
      const findChain = createChain(row, 'limit');
      mockDatabaseService.db.select.mockReturnValueOnce(findChain);
      findChain.from.mockReturnValue(findChain);
      findChain.where.mockReturnValue(findChain);

      const updateChain = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined),
      };
      mockDatabaseService.db.update.mockReturnValueOnce(updateChain);

      await service.remove(10, 1);

      expect(mockDatabaseService.db.update).toHaveBeenCalled();
    });
  });
});
