import type { CommsMaterialReleaseSummary } from './comms-material-release';

export const LOOK_AHEAD_RELEASE_TYPES_MAX_VISIBLE = 2;

function dedupeByReleaseTypeId(
  rows: readonly CommsMaterialReleaseSummary[]
): CommsMaterialReleaseSummary[] {
  const byId = new Map<number, CommsMaterialReleaseSummary>();
  for (const row of rows) {
    const existing = byId.get(row.releaseTypeId);
    if (!existing || row.reportSortOrder < existing.reportSortOrder) {
      byId.set(row.releaseTypeId, row);
    }
  }
  return [...byId.values()].sort((a, b) => {
    if (a.reportSortOrder !== b.reportSortOrder) {
      return a.reportSortOrder - b.reportSortOrder;
    }
    return a.reportAbbrev.localeCompare(b.reportAbbrev);
  });
}

/**
 * Formats release type abbrevs for Look Ahead: up to 2 visible, then "+N".
 */
export function formatLookAheadReleaseTypesLine(
  releases: readonly CommsMaterialReleaseSummary[] | null | undefined,
  maxVisible: number = LOOK_AHEAD_RELEASE_TYPES_MAX_VISIBLE
): string {
  if (!releases || releases.length === 0) return '';

  const sorted = dedupeByReleaseTypeId(releases).filter((r) =>
    r.reportAbbrev.trim()
  );
  if (sorted.length === 0) return '';

  const abbrevs = sorted.map((r) => r.reportAbbrev.trim());
  if (abbrevs.length <= maxVisible) {
    return abbrevs.join(', ');
  }

  const visible = abbrevs.slice(0, maxVisible);
  const extra = abbrevs.length - maxVisible;
  return `${visible.join(', ')} +${extra}`;
}
