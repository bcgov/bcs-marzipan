import type { ActivityTableRow } from './activityTableRow';

export type BulkSelectLeadTeamLookup = {
  id: number;
  name: string;
  displayName?: string | null;
  abbreviation?: string;
};

export function countActivitiesByLeadTeamId(
  rows: Pick<ActivityTableRow, 'leadTeamId'>[]
): Map<number, number> {
  const counts = new Map<number, number>();
  for (const row of rows) {
    if (row.leadTeamId == null) continue;
    counts.set(row.leadTeamId, (counts.get(row.leadTeamId) ?? 0) + 1);
  }
  return counts;
}

/** Short label for bulk-select lead team menu rows (abbreviation preferred). */
export function bulkSelectLeadTeamShortLabel(
  team: BulkSelectLeadTeamLookup
): string {
  const abbrev = team.abbreviation?.trim();
  if (abbrev) return abbrev;
  const display = team.displayName?.trim();
  if (display) return display;
  return team.name.trim() || `Team ${team.id}`;
}

export function bulkSelectLeadTeamMenuItemLabel(
  team: BulkSelectLeadTeamLookup,
  count: number
): string {
  return `${bulkSelectLeadTeamShortLabel(team)} activities (${count})`;
}

export function isBulkSelectLeadTeamItemDisabled(
  teamId: number,
  count: number,
  activeLeadTeamFilterIds: number[]
): boolean {
  if (count === 0) return true;
  if (activeLeadTeamFilterIds.length === 0) return false;
  return !activeLeadTeamFilterIds.includes(teamId);
}

export function activityIdsForLeadTeam(
  rows: Pick<ActivityTableRow, 'id' | 'leadTeamId'>[],
  teamId: number
): number[] {
  return rows.filter((row) => row.leadTeamId === teamId).map((row) => row.id);
}

export function activityIdsForUserLeadTeams(
  rows: Pick<ActivityTableRow, 'id' | 'leadTeamId'>[],
  userTeamIds: number[]
): number[] {
  if (userTeamIds.length === 0) return [];
  const teamSet = new Set(userTeamIds);
  return rows
    .filter((row) => row.leadTeamId != null && teamSet.has(row.leadTeamId))
    .map((row) => row.id);
}

export function bulkSelectLeadTeamsForMenu(
  teams: BulkSelectLeadTeamLookup[],
  userTeamIds: number[],
  canSelectAnyLeadTeam: boolean
): BulkSelectLeadTeamLookup[] {
  const list = canSelectAnyLeadTeam
    ? teams
    : teams.filter((team) => userTeamIds.includes(team.id));

  return [...list].sort((a, b) =>
    bulkSelectLeadTeamShortLabel(a).localeCompare(
      bulkSelectLeadTeamShortLabel(b),
      undefined,
      { sensitivity: 'base' }
    )
  );
}
