import { Test, TestingModule } from '@nestjs/testing';

import { DatabaseService } from '../database/database.service';
import { FavouritesService } from './favourites.service';

describe('FavouritesService', () => {
  let service: FavouritesService;

  const mockDb = {
    select: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
  };

  const mockDatabaseService = { db: mockDb };

  /** Build a chainable query mock that resolves `resolvedValue` on the given terminal call. */
  function makeChain(resolvedValue: unknown, terminal: string) {
    const chain: Record<string, ReturnType<typeof vi.fn>> = {};
    const methods = [
      'from',
      'where',
      'select',
      'values',
      'onConflictDoNothing',
    ];
    for (const m of methods) {
      chain[m] = vi.fn().mockReturnValue(chain);
    }
    chain[terminal] = vi.fn().mockResolvedValue(resolvedValue);
    return chain;
  }

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavouritesService,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();

    service = module.get<FavouritesService>(FavouritesService);
  });

  describe('list', () => {
    it('returns activity IDs for the given user', async () => {
      const rows = [{ activityId: 10 }, { activityId: 20 }];
      const chain = makeChain(rows, 'where');
      mockDb.select.mockReturnValue(chain);

      const result = await service.list(5);

      expect(result).toEqual([10, 20]);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('returns an empty array when the user has no favourites', async () => {
      const chain = makeChain([], 'where');
      mockDb.select.mockReturnValue(chain);

      const result = await service.list(5);

      expect(result).toEqual([]);
    });
  });

  describe('add', () => {
    it('inserts a row with onConflictDoNothing', async () => {
      const chain = makeChain(undefined, 'onConflictDoNothing');
      mockDb.insert.mockReturnValue(chain);

      await service.add(5, 10);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(chain.values).toHaveBeenCalledWith({ userId: 5, activityId: 10 });
      expect(chain.onConflictDoNothing).toHaveBeenCalled();
    });

    it('does not throw when the row already exists (conflict ignored)', async () => {
      const chain = makeChain(undefined, 'onConflictDoNothing');
      mockDb.insert.mockReturnValue(chain);

      await expect(service.add(5, 10)).resolves.toBeUndefined();
    });
  });

  describe('remove', () => {
    it('deletes the matching row', async () => {
      const chain = makeChain(undefined, 'where');
      mockDb.delete.mockReturnValue(chain);

      await service.remove(5, 10);

      expect(mockDb.delete).toHaveBeenCalled();
      expect(chain.where).toHaveBeenCalled();
    });

    it('does not throw when the row does not exist', async () => {
      const chain = makeChain(undefined, 'where');
      mockDb.delete.mockReturnValue(chain);

      await expect(service.remove(5, 99)).resolves.toBeUndefined();
    });
  });
});
