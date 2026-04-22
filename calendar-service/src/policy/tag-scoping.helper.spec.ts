import { describe, expect, it, vi } from 'vitest';

import type { Database } from '../database/database.provider';
import { getVisibleTagIds } from './tag-scoping.helper';

describe('getVisibleTagIds', () => {
  /**
   * Build a query-chain mock that resolves `.where()` to `directResult`
   * and `.innerJoin(...).where()` to `joinResult`.
   */
  const makeChain = (
    directResult: { id: number }[],
    joinResult: { id: number }[] = []
  ) => ({
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(directResult),
    innerJoin: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(joinResult),
    }),
  });

  /**
   * Build a mock `db` whose `select()` returns the appropriate chain on each
   * call:  call 0 → global-tags chain, call 1 → team-scoped chain.
   */
  const makeMockDb = (
    globalIds: number[],
    teamScopedIds: number[] = []
  ): Database => {
    let callIndex = 0;
    return {
      select: vi.fn(() => {
        const idx = callIndex++;
        return makeChain(
          idx === 0 ? globalIds.map((id) => ({ id })) : [],
          teamScopedIds.map((id) => ({ id }))
        );
      }),
    } as unknown as Database;
  };

  it('returns only global tag IDs when teamIds is undefined', async () => {
    const mockDb = makeMockDb([1, 2, 3]);

    const result = await getVisibleTagIds(mockDb);

    expect(result.sort((a, b) => a - b)).toEqual([1, 2, 3]);
    expect(vi.mocked(mockDb.select.bind(mockDb)).mock.calls).toHaveLength(1);
  });

  it('returns only global tag IDs when teamIds is an empty array', async () => {
    const mockDb = makeMockDb([4, 5]);

    const result = await getVisibleTagIds(mockDb, []);

    expect(result.sort((a, b) => a - b)).toEqual([4, 5]);
    expect(vi.mocked(mockDb.select.bind(mockDb)).mock.calls).toHaveLength(1);
  });

  it('returns global and team-scoped tag IDs when teamIds are provided', async () => {
    const mockDb = makeMockDb([1, 2], [3, 4]);

    const result = await getVisibleTagIds(mockDb, [10, 11]);

    expect(result.sort((a, b) => a - b)).toEqual([1, 2, 3, 4]);
    const selectCalls = vi.mocked(mockDb.select.bind(mockDb)).mock.calls;
    expect(selectCalls).toHaveLength(2);
  });

  it('deduplicates tag IDs that appear in both global and team-scoped results', async () => {
    // id=2 is returned by both the global query and the team-scoped query
    const mockDb = makeMockDb([1, 2], [2, 3]);

    const result = await getVisibleTagIds(mockDb, [7]);

    expect(result.sort((a, b) => a - b)).toEqual([1, 2, 3]);
  });

  it('returns an empty array when no tags match either query', async () => {
    const mockDb = makeMockDb([], []);

    const result = await getVisibleTagIds(mockDb, [99]);

    expect(result).toEqual([]);
  });
});
