import { eq, and, inArray, sql } from 'drizzle-orm';
import type { Visibility } from '@corpcal/shared';
import { categories, teamCategories } from '@corpcal/database/schema';
import type { Database } from '../database/database.provider';

/**
 * Returns category IDs visible to the given team IDs: global categories plus
 * team-scoped categories for those teams. Deduplicated.
 * If teamIds is empty or undefined, returns only global category IDs.
 */
export async function getVisibleCategoryIds(
  db: Database,
  teamIds?: number[]
): Promise<number[]> {
  if (!teamIds || teamIds.length === 0) {
    const globalRows = await db
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(
          eq(categories.isActive, true),
          sql`${categories.visibility} = ${'global' satisfies Visibility}`
        )
      );
    return globalRows.map((r) => r.id);
  }

  const [globalRows, teamScopedRows] = await Promise.all([
    db
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(
          eq(categories.isActive, true),
          sql`${categories.visibility} = ${'global' satisfies Visibility}`
        )
      ),
    db
      .select({ id: categories.id })
      .from(categories)
      .innerJoin(
        teamCategories,
        and(
          eq(categories.id, teamCategories.categoryId),
          eq(teamCategories.isActive, true),
          inArray(teamCategories.teamId, teamIds)
        )
      )
      .where(
        and(
          eq(categories.isActive, true),
          sql`${categories.visibility} = ${'team' satisfies Visibility}`
        )
      ),
  ]);

  const ids = new Set<number>();
  for (const r of globalRows) ids.add(r.id);
  for (const r of teamScopedRows) ids.add(r.id);
  return Array.from(ids);
}
