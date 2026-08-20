export interface GovernmentRepresentativeSortItem {
  id: number;
  displayName?: string | null;
  name?: string | null;
  ministryId?: number | null;
  sortOrder?: number;
}

export interface TeamMinistryRef {
  id: number;
  ministryId?: number | null;
}

function compareGovernmentRepresentatives<
  T extends GovernmentRepresentativeSortItem,
>(a: T, b: T): number {
  const bySortOrder = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  if (bySortOrder !== 0) return bySortOrder;

  return (a.displayName ?? a.name ?? '').localeCompare(
    b.displayName ?? b.name ?? '',
    undefined,
    { sensitivity: 'base' }
  );
}

/**
 * Boosts government representatives linked to ministries the user's teams
 * belong to, while preserving admin sortOrder within each group.
 */
export function sortGovernmentRepresentativesForUser<
  T extends GovernmentRepresentativeSortItem,
>(
  reps: readonly T[],
  userTeamIds: number[] | undefined,
  teams: readonly TeamMinistryRef[] | undefined
): T[] {
  const userTeamIdSet = new Set(userTeamIds ?? []);
  if (userTeamIdSet.size === 0) {
    return [...reps].sort(compareGovernmentRepresentatives);
  }

  const userMinistryIds = new Set(
    (teams ?? [])
      .filter((team) => userTeamIdSet.has(team.id))
      .map((team) => team.ministryId)
      .filter((id): id is number => id != null)
  );

  if (userMinistryIds.size === 0) {
    return [...reps].sort(compareGovernmentRepresentatives);
  }

  const prioritized: T[] = [];
  const remainder: T[] = [];

  for (const rep of reps) {
    if (rep.ministryId != null && userMinistryIds.has(rep.ministryId)) {
      prioritized.push(rep);
    } else {
      remainder.push(rep);
    }
  }

  prioritized.sort(compareGovernmentRepresentatives);
  remainder.sort(compareGovernmentRepresentatives);

  return [...prioritized, ...remainder];
}
