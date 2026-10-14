import { toast } from 'sonner';

import { TOAST_DURATION_MS } from '@/lib/toast-durations';

export type EntityToastVariant = 'success' | 'error' | 'info' | 'warning';

export function resolveUserDisplayName(user: {
  adDisplayName?: string | null;
  adUsername?: string | null;
  displayName?: string | null;
  idirUsername?: string | null;
  id?: number;
}): string {
  return (
    user.adDisplayName?.trim() ||
    user.displayName?.trim() ||
    user.adUsername?.trim() ||
    user.idirUsername?.trim() ||
    (user.id != null ? `User ${user.id}` : 'User')
  );
}

export function resolveTeamDisplayName(team: {
  displayName?: string | null;
  name?: string | null;
  abbreviation?: string | null;
  id?: number;
}): string {
  const label = formatTeamLabel(team);
  const abbrev = team.abbreviation?.trim();
  return abbrev ? `${label} (${abbrev})` : label;
}

export function formatTeamLabel(team: {
  displayName?: string | null;
  name?: string | null;
  id?: number;
}): string {
  return (
    team.displayName?.trim() ||
    team.name?.trim() ||
    (team.id != null ? `Team ${team.id}` : 'Team')
  );
}

/** e.g. "GCPE, Planning, and 2 others" */
export function formatJoinedNames(names: string[], maxShown = 3): string {
  const items = names.map((n) => n.trim()).filter(Boolean);
  if (items.length === 0) return '';
  if (items.length <= maxShown) return items.join(', ');
  const shown = items.slice(0, maxShown - 1);
  const remaining = items.length - shown.length;
  return `${shown.join(', ')}, and ${remaining} other${remaining === 1 ? '' : 's'}`;
}

export function formatUserCreatedDescription(
  displayLabel: string,
  teamLabels: string[]
): string {
  if (teamLabels.length === 0) return displayLabel;
  return `${displayLabel} · Added to ${formatJoinedNames(teamLabels)}`;
}

export function formatUserUpdatedDescription(
  userName: string,
  addedTeamLabels: string[] = []
): string {
  if (addedTeamLabels.length === 0) return userName;
  return `${userName} · Added to ${formatJoinedNames(addedTeamLabels)}`;
}

export function formatMemberAddedDescription(
  memberNames: string[],
  teamName: string
): string {
  const team = teamName.trim() || 'team';
  if (memberNames.length === 0) {
    return `Added to ${team}`;
  }
  if (memberNames.length === 1) {
    return `${memberNames[0]} added to ${team}`;
  }
  return `${formatJoinedNames(memberNames)} added to ${team}`;
}

export function formatMemberRemovedDescription(
  memberName: string,
  teamName: string
): string {
  return `${memberName} removed from ${teamName.trim() || 'team'}`;
}

export function formatRemovedFromTeamDescription(
  userName: string,
  teamName: string
): string {
  return `${userName} removed from ${teamName.trim() || 'team'}`;
}

export function showEntityToast(
  variant: EntityToastVariant,
  title: string,
  options?: { description?: string; id?: string }
): void {
  const duration =
    variant === 'error' || variant === 'warning'
      ? TOAST_DURATION_MS.error
      : variant === 'info'
        ? TOAST_DURATION_MS.info
        : TOAST_DURATION_MS.success;

  toast[variant](title, {
    description: options?.description,
    duration,
    id: options?.id,
  });
}
