import type { ActivityTableRow } from './activityTableRow';

/** Background applied to fields changed since the last review (admin reviewers only). */
export const LIST_REVIEW_HIGHLIGHT_BG = 'bg-[#FFDDB3]';

export function rowHasChangedPath(
  row: ActivityTableRow,
  path: string
): boolean {
  const changed = row.changedFieldsSinceReview ?? [];
  return changed.some((changedPath: string) => {
    if (changedPath === path) {
      return true;
    }
    return (
      changedPath.startsWith(`${path}.`) || path.startsWith(`${changedPath}.`)
    );
  });
}

export function rowHasAnyChangedPath(
  row: ActivityTableRow,
  paths: readonly string[]
): boolean {
  return paths.some((path) => rowHasChangedPath(row, path));
}

/**
 * Format representative name for badge: ministers show as "Minister <LastName>", others as-is.
 */
export function formatRepresentativeBadgeText(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return name;
  const isMinister = /minister/i.test(trimmed) || /^hon\.?\s/i.test(trimmed);
  if (isMinister) {
    const parts = trimmed.split(/\s+/);
    const lastName = parts[parts.length - 1];
    return lastName ? `Minister ${lastName}` : name;
  }
  return name;
}

/** Sentence case for lookup display values: first letter upper, rest lower. */
export function toSentenceCase(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/** Two-letter initials for an avatar fallback. */
export function getInitialsFromName(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
