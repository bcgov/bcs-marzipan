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

export interface GovernmentRepresentativePartition<T> {
  leadMinister: T | null;
  remainder: T[];
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
 * Pins the lead team's ministry minister (when resolvable) ahead of the
 * admin sortOrder list for activity-form representative pickers.
 */
export function partitionGovernmentRepresentativesForLeadTeam<
  T extends GovernmentRepresentativeSortItem,
>(
  reps: readonly T[],
  leadTeamId: number | null | undefined,
  teams: readonly TeamMinistryRef[] | undefined
): GovernmentRepresentativePartition<T> {
  const sorted = [...reps].sort(compareGovernmentRepresentatives);

  if (leadTeamId == null) {
    return { leadMinister: null, remainder: sorted };
  }

  const leadTeamMinistryId = (teams ?? []).find(
    (team) => team.id === leadTeamId
  )?.ministryId;

  if (leadTeamMinistryId == null) {
    return { leadMinister: null, remainder: sorted };
  }

  const leadMinisterIndex = sorted.findIndex(
    (rep) => rep.ministryId === leadTeamMinistryId
  );

  if (leadMinisterIndex < 0) {
    return { leadMinister: null, remainder: sorted };
  }

  const leadMinister = sorted[leadMinisterIndex];
  const remainder = sorted.filter((rep) => rep.id !== leadMinister.id);

  return { leadMinister, remainder };
}
