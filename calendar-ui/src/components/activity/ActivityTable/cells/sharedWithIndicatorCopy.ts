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

export function sharedWithTooltipLines(
  teamNames: string[],
  visibility: string | null | undefined,
  leadTeamDisplayName: string | null | undefined
): string[] {
  const lines = [
    sharedWithVisibilityLine(visibility, leadTeamDisplayName),
    sharedWithTeamsLine(teamNames),
  ];
  if (teamNames.length > 1) {
    lines.push(...teamNames);
  }
  return lines;
}

export function sharedWithAriaLabel(
  teamNames: string[],
  visibility: string | null | undefined,
  leadTeamDisplayName: string | null | undefined
): string {
  const visibilityLine = sharedWithVisibilityLine(
    visibility,
    leadTeamDisplayName
  );
  if (teamNames.length === 0) {
    return `${visibilityLine}. Not shared.`;
  }
  if (teamNames.length === 1) {
    return `${visibilityLine}. Shared with ${teamNames[0]}.`;
  }
  return `${visibilityLine}. Shared with ${teamNames.length} teams: ${teamNames.join(', ')}.`;
}

/** Hide the numeric share badge when the overview actions row is too narrow. */
export const GRID_A_SHARE_COUNT_BADGE_MIN_ROW_WIDTH_PX = 64;
