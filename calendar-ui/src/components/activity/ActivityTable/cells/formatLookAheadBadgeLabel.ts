import type { LookAheadSectionRow } from '@corpcal/shared/reports/look-ahead';
import { getLookAheadStatusLabel } from '@/constants/form-options';
import { getLookAheadSectionLabelFromRows } from '@/hooks/useLookAheadSectionRows';

/**
 * Build the look-ahead badge label shown in the activity list.
 *
 * Format is `LA <section> (<status>)`, e.g. "LA Events (New)". Activities with
 * no section fall back to `LA <status>`. Returns null when there is no
 * look-ahead status to show.
 */
export function formatLookAheadBadgeLabel(
  status: string | null,
  section: string | null,
  sectionRows: ReadonlyArray<LookAheadSectionRow>
): string | null {
  if (!status || status === 'none') return null;

  const statusLabel = getLookAheadStatusLabel(status);
  if (!section) return `LA ${statusLabel}`;

  const sectionLabel = getLookAheadSectionLabelFromRows(sectionRows, section);
  if (!sectionLabel) return `LA ${statusLabel}`;

  return `LA ${sectionLabel} (${statusLabel})`;
}
