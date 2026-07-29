import { describe, expect, it, vi } from 'vitest';

import { teamCategories, teamTags } from '@corpcal/database/schema';

import type { DrizzleDbExecutor } from '../database/database.provider';
import {
  loadTeamMetadataForLookupIds,
  teamMetadataForLookup,
} from './lookups-team-metadata.helper';
import {
  loadActiveCategoryTeamIds,
  loadActiveTagTeamIds,
  syncCategoryTeams,
  syncTagTeams,
} from './lookups-team-sync.helper';

describe('lookups-team-sync.helper', () => {
  const makeTx = () => {
    const updateWhere = vi.fn().mockResolvedValue(undefined);
    const updateSet = vi.fn().mockReturnValue({ where: updateWhere });
    const update = vi.fn().mockReturnValue({ set: updateSet });
    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    const insertValues = vi.fn().mockReturnValue({
      onConflictDoUpdate,
    });
    const insert = vi.fn().mockReturnValue({ values: insertValues });
    const selectWhere = vi.fn().mockResolvedValue([]);
    const selectFrom = vi.fn().mockReturnValue({ where: selectWhere });
    const select = vi.fn().mockReturnValue({ from: selectFrom });

    return {
      tx: {
        update,
        insert,
        select,
      } as unknown as DrizzleDbExecutor,
      spies: {
        update,
        updateSet,
        updateWhere,
        insert,
        insertValues,
        onConflictDoUpdate,
        select,
        selectFrom,
        selectWhere,
      },
    };
  };

  it('syncCategoryTeams deactivates all rows then upserts team associations', async () => {
    const { tx, spies } = makeTx();

    await syncCategoryTeams(tx, 10, 'team', [1, 2]);

    expect(spies.update).toHaveBeenCalledWith(teamCategories);
    expect(spies.updateSet).toHaveBeenCalledWith({ isActive: false });
    expect(spies.updateWhere).toHaveBeenCalledTimes(1);
    expect(spies.insert).toHaveBeenCalledTimes(1);
    expect(spies.insertValues).toHaveBeenCalledWith([
      { categoryId: 10, teamId: 1, isActive: true },
      { categoryId: 10, teamId: 2, isActive: true },
    ]);
  });

  it('syncCategoryTeams skips upserts when visibility is global', async () => {
    const { tx, spies } = makeTx();

    await syncCategoryTeams(tx, 10, 'global', [1]);

    expect(spies.update).toHaveBeenCalledTimes(1);
    expect(spies.insert).not.toHaveBeenCalled();
  });

  it('syncTagTeams upserts active team rows', async () => {
    const { tx, spies } = makeTx();

    await syncTagTeams(tx, 20, 'team', [3]);

    expect(spies.update).toHaveBeenCalledWith(teamTags);
    expect(spies.insertValues).toHaveBeenCalledWith([
      { tagId: 20, teamId: 3, isActive: true },
    ]);
  });

  it('loadActiveCategoryTeamIds returns active team ids', async () => {
    const { tx, spies } = makeTx();
    spies.selectWhere.mockResolvedValue([{ teamId: 4 }, { teamId: 5 }]);

    const result = await loadActiveCategoryTeamIds(tx, 10);

    expect(result).toEqual([4, 5]);
    expect(spies.selectFrom).toHaveBeenCalledWith(teamCategories);
  });

  it('loadActiveTagTeamIds returns active team ids', async () => {
    const { tx, spies } = makeTx();
    spies.selectWhere.mockResolvedValue([{ teamId: 7 }]);

    const result = await loadActiveTagTeamIds(tx, 20);

    expect(result).toEqual([7]);
    expect(spies.selectFrom).toHaveBeenCalledWith(teamTags);
  });
});

describe('lookups-team-metadata.helper', () => {
  it('teamMetadataForLookup returns metadata only for team visibility', () => {
    const maps = {
      teamNamesByLookupId: new Map([[1, ['Team A']]]),
      teamIdsByLookupId: new Map([[1, [10]]]),
    };

    expect(teamMetadataForLookup(1, 'team', maps)).toEqual({
      teamNames: ['Team A'],
      teamIds: [10],
    });
    expect(teamMetadataForLookup(1, 'global', maps)).toEqual({});
  });

  it('loadTeamMetadataForLookupIds groups rows by lookup id', async () => {
    const selectWhere = vi.fn().mockResolvedValue([
      { lookupId: 1, teamId: 10, teamName: 'Team A' },
      { lookupId: 1, teamId: 11, teamName: 'Team B' },
    ]);
    const innerJoin = vi.fn().mockReturnValue({ where: selectWhere });
    const from = vi.fn().mockReturnValue({ innerJoin });
    const select = vi.fn().mockReturnValue({ from });
    const db = { select } as unknown as DrizzleDbExecutor;

    const result = await loadTeamMetadataForLookupIds(db, [1], {
      lookupIdColumn: teamCategories.categoryId,
      teamIdColumn: teamCategories.teamId,
      junctionTable: teamCategories,
    });

    expect(result.teamIdsByLookupId.get(1)).toEqual([10, 11]);
    expect(result.teamNamesByLookupId.get(1)).toEqual(['Team A', 'Team B']);
  });
});
