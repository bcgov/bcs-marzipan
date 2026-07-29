import type { Visibility } from '../constants/constants';

export interface LookupTeamScope {
  visibility: Visibility | 'global' | 'team';
  teamIds?: number[];
}

/**
 * Whether a lookup item can be newly selected on an activity form.
 * Global items are always selectable; team-scoped items require overlap
 * with the user's team memberships.
 */
export function isLookupSelectable(
  lookup: LookupTeamScope,
  userTeamIds: number[] | undefined
): boolean {
  if (lookup.visibility !== 'team') {
    return true;
  }
  const allowedTeamIds = lookup.teamIds ?? [];
  if (allowedTeamIds.length === 0) {
    return false;
  }
  const userTeams = userTeamIds ?? [];
  if (userTeams.length === 0) {
    return false;
  }
  const userTeamSet = new Set(userTeams);
  return allowedTeamIds.some((id) => userTeamSet.has(id));
}

/**
 * Returns submitted lookup IDs allowed on create/update: selectable IDs plus
 * grandfathered IDs already on the activity.
 */
export function filterAllowedLookupIds(
  submittedIds: number[],
  existingIds: number[] | undefined,
  userTeamIds: number[] | undefined,
  lookupsById: Map<number, LookupTeamScope>
): number[] {
  const existingSet = new Set(existingIds ?? []);
  return submittedIds.filter((id) => {
    if (existingSet.has(id)) {
      return true;
    }
    const lookup = lookupsById.get(id);
    if (!lookup) {
      return false;
    }
    return isLookupSelectable(lookup, userTeamIds);
  });
}

/**
 * IDs in submittedIds that are not allowed (for error messages).
 */
export function getForbiddenLookupIds(
  submittedIds: number[],
  existingIds: number[] | undefined,
  userTeamIds: number[] | undefined,
  lookupsById: Map<number, LookupTeamScope>
): number[] {
  const allowed = new Set(
    filterAllowedLookupIds(submittedIds, existingIds, userTeamIds, lookupsById)
  );
  return submittedIds.filter((id) => !allowed.has(id));
}
