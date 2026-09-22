export function isTeamRestrictedVisibility(
  visibility: string | null | undefined
): boolean {
  return visibility === 'team';
}

export function formatSharedWithCountBadge(count: number): string {
  if (count > 99) return '99+';
  return String(count);
}

export function sharedWithVisibilityLine(
  visibility: string | null | undefined,
  leadTeamDisplayName: string | null | undefined
): string {
  if (isTeamRestrictedVisibility(visibility)) {
    return leadTeamDisplayName
      ? `Restricted to ${leadTeamDisplayName}`
      : 'Restricted access';
  }
  return 'Visible to all calendar users';
}

export function sharedWithTeamsLine(teamNames: string[]): string {
  if (teamNames.length === 0) return 'Not shared';
  if (teamNames.length === 1) return `Shared with ${teamNames[0]}`;
  return `Shared with ${teamNames.length} teams`;
}

/** Popover header title (team count, not individual names). */
export function sharedWithPopoverTitle(shareCount: number): string {
  if (shareCount === 0) return 'Not shared';
  if (shareCount === 1) return 'Shared with 1 team';
  return `Shared with ${shareCount} teams`;
}

/** Matches ActivitySharingSection visibility helper copy (with trailing period). */
export function sharedWithFormVisibilityDescription(
  visibility: string | null | undefined,
  leadTeamDisplayName: string | null | undefined
): string {
  if (isTeamRestrictedVisibility(visibility)) {
    if (leadTeamDisplayName) {
      return `This activity is visible only to ${leadTeamDisplayName}, shares, and exec.`;
    }
    return 'This activity is visible only to the lead team, shares, and exec.';
  }
  return 'This activity is visible to all calendar users.';
}

export function sharedWithAriaLabel(
  teamNames: string[],
  visibility: string | null | undefined,
  leadTeamDisplayName: string | null | undefined
): string {
  const visibilityLine = sharedWithFormVisibilityDescription(
    visibility,
    leadTeamDisplayName
  );
  const title = sharedWithPopoverTitle(teamNames.length);
  return `${visibilityLine} ${title}. Open sharing details.`;
}

/** Hide the numeric share badge when the overview actions row is too narrow. */
export const GRID_A_SHARE_COUNT_BADGE_MIN_ROW_WIDTH_PX = 64;
