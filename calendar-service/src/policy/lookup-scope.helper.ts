import { and, eq, inArray } from 'drizzle-orm';

import {
  categories,
  tags,
  teamCategories,
  teamTags,
} from '@corpcal/database/schema';
import type { LookupTeamScope } from '@corpcal/shared/utils';

import type { Database } from '../database/database.provider';

async function loadTeamIdsByLookupId(
  db: Database,
  lookupIds: number[],
  junction: {
    lookupIdColumn: typeof teamCategories.categoryId | typeof teamTags.tagId;
    teamIdColumn: typeof teamCategories.teamId | typeof teamTags.teamId;
    junctionTable: typeof teamCategories | typeof teamTags;
  }
): Promise<Map<number, number[]>> {
  const teamIdsByLookupId = new Map<number, number[]>();
  if (lookupIds.length === 0) {
    return teamIdsByLookupId;
  }

  const rows = await db
    .select({
      lookupId: junction.lookupIdColumn,
      teamId: junction.teamIdColumn,
    })
    .from(junction.junctionTable)
    .where(
      and(
        inArray(junction.lookupIdColumn, lookupIds),
        eq(junction.junctionTable.isActive, true)
      )
    );

  for (const row of rows) {
    const existing = teamIdsByLookupId.get(row.lookupId) ?? [];
    existing.push(row.teamId);
    teamIdsByLookupId.set(row.lookupId, existing);
  }

  return teamIdsByLookupId;
}

async function getLookupScopeById(
  db: Database,
  ids: number[],
  table: typeof categories | typeof tags,
  junction: {
    lookupIdColumn: typeof teamCategories.categoryId | typeof teamTags.tagId;
    teamIdColumn: typeof teamCategories.teamId | typeof teamTags.teamId;
    junctionTable: typeof teamCategories | typeof teamTags;
  }
): Promise<Map<number, LookupTeamScope>> {
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length === 0) {
    return new Map();
  }

  const rows = await db
    .select({
      id: table.id,
      visibility: table.visibility,
    })
    .from(table)
    .where(and(eq(table.isActive, true), inArray(table.id, uniqueIds)));

  const teamScopedIds = rows
    .filter((row) => row.visibility === 'team')
    .map((row) => row.id);
  const teamIdsByLookupId = await loadTeamIdsByLookupId(
    db,
    teamScopedIds,
    junction
  );

  return new Map(
    rows.map((row) => [
      row.id,
      {
        visibility: row.visibility as 'global' | 'team',
        teamIds:
          row.visibility === 'team'
            ? (teamIdsByLookupId.get(row.id) ?? [])
            : undefined,
      },
    ])
  );
}

export async function getCategoryScopeById(
  db: Database,
  ids: number[]
): Promise<Map<number, LookupTeamScope>> {
  return getLookupScopeById(db, ids, categories, {
    lookupIdColumn: teamCategories.categoryId,
    teamIdColumn: teamCategories.teamId,
    junctionTable: teamCategories,
  });
}

export async function getTagScopeById(
  db: Database,
  ids: number[]
): Promise<Map<number, LookupTeamScope>> {
  return getLookupScopeById(db, ids, tags, {
    lookupIdColumn: teamTags.tagId,
    teamIdColumn: teamTags.teamId,
    junctionTable: teamTags,
  });
}
