import { and, eq } from 'drizzle-orm';

import { teamCategories, teamTags } from '@corpcal/database/schema';

import type { DrizzleDbExecutor } from '../database/database.provider';

export async function syncCategoryTeams(
  tx: DrizzleDbExecutor,
  categoryId: number,
  visibility: 'global' | 'team',
  teamIds: number[] | undefined
): Promise<void> {
  await tx
    .update(teamCategories)
    .set({ isActive: false })
    .where(eq(teamCategories.categoryId, categoryId));

  if (visibility !== 'team' || !teamIds?.length) {
    return;
  }

  await tx
    .insert(teamCategories)
    .values(teamIds.map((teamId) => ({ categoryId, teamId, isActive: true })))
    .onConflictDoUpdate({
      target: [teamCategories.categoryId, teamCategories.teamId],
      set: { isActive: true },
    });
}

export async function syncTagTeams(
  tx: DrizzleDbExecutor,
  tagId: number,
  visibility: 'global' | 'team',
  teamIds: number[] | undefined
): Promise<void> {
  await tx
    .update(teamTags)
    .set({ isActive: false })
    .where(eq(teamTags.tagId, tagId));

  if (visibility !== 'team' || !teamIds?.length) {
    return;
  }

  await tx
    .insert(teamTags)
    .values(teamIds.map((teamId) => ({ tagId, teamId, isActive: true })))
    .onConflictDoUpdate({
      target: [teamTags.tagId, teamTags.teamId],
      set: { isActive: true },
    });
}

export async function loadActiveCategoryTeamIds(
  tx: DrizzleDbExecutor,
  categoryId: number
): Promise<number[]> {
  const rows = await tx
    .select({ teamId: teamCategories.teamId })
    .from(teamCategories)
    .where(
      and(
        eq(teamCategories.categoryId, categoryId),
        eq(teamCategories.isActive, true)
      )
    );
  return rows.map((r) => r.teamId);
}

export async function loadActiveTagTeamIds(
  tx: DrizzleDbExecutor,
  tagId: number
): Promise<number[]> {
  const rows = await tx
    .select({ teamId: teamTags.teamId })
    .from(teamTags)
    .where(and(eq(teamTags.tagId, tagId), eq(teamTags.isActive, true)));
  return rows.map((r) => r.teamId);
}
