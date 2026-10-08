import { REVIEW_HIGHLIGHT_BG } from '@/lib/review-highlight';

import type { ActivityTableRow } from './activityTableRow';

/** Background applied to fields changed since the last review (review permission). */
export const LIST_REVIEW_HIGHLIGHT_BG = REVIEW_HIGHLIGHT_BG;

function pathsMatchFieldChange(changedPath: string, formPath: string): boolean {
  if (changedPath === formPath) {
    return true;
  }
  return (
    changedPath.startsWith(`${formPath}.`) ||
    formPath.startsWith(`${changedPath}.`)
  );
}

/** Whether any review-diff path matches a form/RHF field path (prefix-aware). */
export function pathsIncludeFieldChange(
  changedPaths: readonly string[] | ReadonlySet<string> | undefined,
  formPath: string
): boolean {
  if (changedPaths == null) {
    return false;
  }
  const pathList: readonly string[] = Array.isArray(changedPaths)
    ? changedPaths
    : Array.from(changedPaths);
  return pathList.some((changedPath) =>
    pathsMatchFieldChange(changedPath, formPath)
  );
}

export function rowHasChangedPath(
  row: ActivityTableRow,
  path: string
): boolean {
  return pathsIncludeFieldChange(row.changedFieldsSinceReview, path);
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
