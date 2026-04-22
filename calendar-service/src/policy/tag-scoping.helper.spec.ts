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
   * Returns both the db and the spy so call-count assertions can be made
   * on the spy directly (avoiding the unbound-method lint rule).
   */
  const makeMockDb = (
    globalIds: number[],
    teamScopedIds: number[] = []
  ): { db: Database; selectSpy: ReturnType<typeof vi.fn> } => {
    let callIndex = 0;
    const selectSpy = vi.fn(() => {
      const idx = callIndex++;
      return makeChain(
        idx === 0 ? globalIds.map((id) => ({ id })) : [],
        teamScopedIds.map((id) => ({ id }))
      );
    });
    const db = { select: selectSpy } as unknown as Database;
    return { db, selectSpy };
  };

  it('returns only global tag IDs when teamIds is undefined', async () => {
    const { db, selectSpy } = makeMockDb([1, 2, 3]);

    const result = await getVisibleTagIds(db);

    expect(result.sort((a, b) => a - b)).toEqual([1, 2, 3]);
    expect(selectSpy).toHaveBeenCalledTimes(1);
  });

  it('returns only global tag IDs when teamIds is an empty array', async () => {
    const { db, selectSpy } = makeMockDb([4, 5]);

    const result = await getVisibleTagIds(db, []);

    expect(result.sort((a, b) => a - b)).toEqual([4, 5]);
    expect(selectSpy).toHaveBeenCalledTimes(1);
  });

  it('returns global and team-scoped tag IDs when teamIds are provided', async () => {
    const { db, selectSpy } = makeMockDb([1, 2], [3, 4]);

    const result = await getVisibleTagIds(db, [10, 11]);

    expect(result.sort((a, b) => a - b)).toEqual([1, 2, 3, 4]);
    expect(selectSpy).toHaveBeenCalledTimes(2);
  });

  it('deduplicates tag IDs that appear in both global and team-scoped results', async () => {
    // id=2 is returned by both the global query and the team-scoped query
    const { db } = makeMockDb([1, 2], [2, 3]);

    const result = await getVisibleTagIds(db, [7]);

    expect(result.sort((a, b) => a - b)).toEqual([1, 2, 3]);
  });

  it('returns an empty array when no tags match either query', async () => {
    const { db } = makeMockDb([], []);

    const result = await getVisibleTagIds(db, [99]);

    expect(result).toEqual([]);
  });
});
