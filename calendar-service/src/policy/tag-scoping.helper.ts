import { and, eq, inArray, sql } from 'drizzle-orm';

import { tags, teamTags } from '@corpcal/database/schema';
import type { Visibility } from '@corpcal/shared';

import type { Database } from '../database/database.provider';

/**
 * Returns tag IDs selectable by the given team IDs: global tags plus
 * team-scoped tags for those teams. Used for activity save validation only.
 * If teamIds is empty or undefined, returns only global tag IDs.
 */
export async function getSelectableTagIds(
  db: Database,
  teamIds?: number[]
): Promise<number[]> {
  if (!teamIds || teamIds.length === 0) {
    const globalRows = await db
      .select({ id: tags.id })
      .from(tags)
      .where(
        and(
          eq(tags.isActive, true),
          sql`${tags.visibility} = ${'global' satisfies Visibility}`
        )
      );
    return globalRows.map((r) => r.id);
  }

  const [globalRows, teamScopedRows] = await Promise.all([
    db
      .select({ id: tags.id })
      .from(tags)
      .where(
        and(
          eq(tags.isActive, true),
          sql`${tags.visibility} = ${'global' satisfies Visibility}`
        )
      ),
    db
      .select({ id: tags.id })
      .from(tags)
      .innerJoin(
        teamTags,
        and(
          eq(tags.id, teamTags.tagId),
          eq(teamTags.isActive, true),
          inArray(teamTags.teamId, teamIds)
        )
      )
      .where(
        and(
          eq(tags.isActive, true),
          sql`${tags.visibility} = ${'team' satisfies Visibility}`
        )
      ),
  ]);

  const ids = new Set<number>();
  for (const r of globalRows) ids.add(r.id);
  for (const r of teamScopedRows) ids.add(r.id);
  return Array.from(ids);
}

/** @deprecated Use getSelectableTagIds */
export const getVisibleTagIds = getSelectableTagIds;
