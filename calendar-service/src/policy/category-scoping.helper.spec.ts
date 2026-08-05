import { describe, expect, it, vi } from 'vitest';

import type { Database } from '../database/database.provider';
import { getSelectableCategoryIds } from './category-scoping.helper';

describe('getSelectableCategoryIds', () => {
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

  const makeMockDb = (
    globalIds: number[],
    teamScopedIds: number[] = []
  ): Database => {
    let callCount = 0;
    const selectSpy = vi.fn().mockImplementation(() => {
      const chain =
        callCount === 0
          ? makeChain(globalIds.map((id) => ({ id })))
          : makeChain(
              [],
              teamScopedIds.map((id) => ({ id }))
            );
      callCount += 1;
      return chain;
    });
    return { select: selectSpy } as unknown as Database;
  };

  it('returns only global category ids when teamIds is undefined', async () => {
    const db = makeMockDb([1, 2]);
    const result = await getSelectableCategoryIds(db);
    expect(result).toEqual([1, 2]);
  });

  it('returns only global category ids when teamIds is empty', async () => {
    const db = makeMockDb([1]);
    const result = await getSelectableCategoryIds(db, []);
    expect(result).toEqual([1]);
  });

  it('merges global and team-scoped category ids', async () => {
    const db = makeMockDb([1, 2], [3]);
    const result = await getSelectableCategoryIds(db, [10, 11]);
    expect(result.sort()).toEqual([1, 2, 3]);
  });
});
