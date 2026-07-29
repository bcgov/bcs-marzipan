import { and, eq, inArray } from 'drizzle-orm';

import { teamCategories, teams, teamTags } from '@corpcal/database/schema';

import type { DrizzleDbExecutor } from '../database/database.provider';

export interface TeamMetadataMaps {
  teamNamesByLookupId: Map<number, string[]>;
  teamIdsByLookupId: Map<number, number[]>;
}

/**
 * Loads active team junction rows for team-scoped lookup IDs.
 */
export async function loadTeamMetadataForLookupIds(
  db: DrizzleDbExecutor,
  lookupIds: number[],
  junction: {
    lookupIdColumn: typeof teamCategories.categoryId | typeof teamTags.tagId;
    teamIdColumn: typeof teamCategories.teamId | typeof teamTags.teamId;
    junctionTable: typeof teamCategories | typeof teamTags;
  }
): Promise<TeamMetadataMaps> {
  const teamNamesByLookupId = new Map<number, string[]>();
  const teamIdsByLookupId = new Map<number, number[]>();

  if (lookupIds.length === 0) {
    return { teamNamesByLookupId, teamIdsByLookupId };
  }

  const rows = await db
    .select({
      lookupId: junction.lookupIdColumn,
      teamId: junction.teamIdColumn,
      teamName: teams.displayName,
    })
    .from(junction.junctionTable)
    .innerJoin(teams, eq(junction.teamIdColumn, teams.id))
    .where(
      and(
        inArray(junction.lookupIdColumn, lookupIds),
        eq(junction.junctionTable.isActive, true)
      )
    );

  for (const row of rows) {
    const name = row.teamName ?? '';
    if (!teamNamesByLookupId.has(row.lookupId)) {
      teamNamesByLookupId.set(row.lookupId, []);
      teamIdsByLookupId.set(row.lookupId, []);
    }
    teamNamesByLookupId.get(row.lookupId)!.push(name);
    teamIdsByLookupId.get(row.lookupId)!.push(row.teamId);
  }

  return { teamNamesByLookupId, teamIdsByLookupId };
}

export function teamMetadataForLookup(
  lookupId: number,
  visibility: string,
  maps: TeamMetadataMaps
): { teamNames?: string[]; teamIds?: number[] } {
  if (visibility !== 'team') {
    return {};
  }
  return {
    teamNames: maps.teamNamesByLookupId.get(lookupId) ?? [],
    teamIds: maps.teamIdsByLookupId.get(lookupId) ?? [],
  };
}
