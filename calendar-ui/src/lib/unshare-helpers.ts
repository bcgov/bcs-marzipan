import { PERMISSIONS, SYSTEM_ROLES } from '@corpcal/shared';
import type { PermissionKey } from '@corpcal/shared/auth';

export type UnshareTeamOption = {
  id: number;
  name: string;
};

export type UnshareTeamLookup = {
  id: number;
  name: string;
  displayName?: string | null;
};

export type UnshareActivityContext = {
  sharedWithTeamIds?: number[];
  visibility?: string | null;
};

/** Whether the user may remove `teamId` from an activity's Shared With list. */
export function canUserUnshareTeam(
  userTeamIds: number[],
  teamId: number,
  hasUnshareAll: boolean,
  isAdminOrSysAdmin: boolean
): boolean {
  if (isAdminOrSysAdmin || hasUnshareAll) return true;
  return userTeamIds.includes(teamId);
}

function teamLabel(team: UnshareTeamLookup): string {
  return team.displayName?.trim() || team.name;
}

/** Teams the user may remove from one activity's Shared With list. */
export function getUnshareableTeamsForActivity(
  activity: UnshareActivityContext,
  teamLookups: UnshareTeamLookup[],
  userTeamIds: number[],
  hasUnshare: boolean,
  hasUnshareAll: boolean,
  isAdminOrSysAdmin: boolean
): UnshareTeamOption[] {
  if (!hasUnshare && !hasUnshareAll) return [];

  const sharedIds = activity.sharedWithTeamIds ?? [];
  const eligibleIds = sharedIds.filter((teamId) =>
    canUserUnshareTeam(userTeamIds, teamId, hasUnshareAll, isAdminOrSysAdmin)
  );

  return teamLookups
    .filter((team) => eligibleIds.includes(team.id))
    .map((team) => ({ id: team.id, name: teamLabel(team) }));
}

/** Teams the user may remove across a bulk selection (at least one activity shares each). */
export function getUnshareableTeamsForBulk(
  activities: UnshareActivityContext[],
  teamLookups: UnshareTeamLookup[],
  userTeamIds: number[],
  hasUnshare: boolean,
  hasUnshareAll: boolean,
  isAdminOrSysAdmin: boolean
): UnshareTeamOption[] {
  if (!hasUnshare && !hasUnshareAll) return [];
  if (activities.length === 0) return [];

  const candidateIds = new Set<number>();
  for (const activity of activities) {
    for (const teamId of activity.sharedWithTeamIds ?? []) {
      if (
        canUserUnshareTeam(
          userTeamIds,
          teamId,
          hasUnshareAll,
          isAdminOrSysAdmin
        )
      ) {
        candidateIds.add(teamId);
      }
    }
  }

  return teamLookups
    .filter((team) => candidateIds.has(team.id))
    .map((team) => ({ id: team.id, name: teamLabel(team) }));
}

/** How many selected activities currently include `teamId` in Shared With. */
export function countActivitiesSharedWithTeam(
  activities: UnshareActivityContext[],
  teamId: number
): number {
  return activities.filter((activity) =>
    (activity.sharedWithTeamIds ?? []).includes(teamId)
  ).length;
}

export function getUnshareVisibilityMessage(
  visibility: string | null | undefined
): string {
  if (visibility === 'team') {
    return 'Your team will no longer see this activity.';
  }
  return 'The activity will be removed from the Shared with tab but remain visible under All activities.';
}

export function getBulkUnshareVisibilityMessage(
  activities: UnshareActivityContext[]
): string {
  const hasTeamRestricted = activities.some((a) => a.visibility === 'team');
  const hasGlobal = activities.some((a) => a.visibility !== 'team');

  if (hasTeamRestricted && hasGlobal) {
    return 'Team-restricted activities will no longer be visible to the selected team. Global activities will be removed from Shared with but remain under All activities.';
  }
  if (hasTeamRestricted) {
    return 'These activities will no longer be visible to the selected team.';
  }
  return 'Activities will be removed from the Shared with tab but remain visible under All activities.';
}

export function resolveUnsharePermissions(
  hasPermission: (key: PermissionKey) => boolean,
  roleName?: string | null
): {
  hasUnshare: boolean;
  hasUnshareAll: boolean;
  isAdminOrSysAdmin: boolean;
} {
  const isAdminOrSysAdmin =
    roleName === SYSTEM_ROLES.ADMIN || roleName === SYSTEM_ROLES.SYSTEM_ADMIN;
  return {
    hasUnshare: hasPermission(PERMISSIONS.ACTIVITIES.UNSHARE),
    hasUnshareAll: hasPermission(PERMISSIONS.ACTIVITIES.UNSHARE_ALL),
    isAdminOrSysAdmin,
  };
}
