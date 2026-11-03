/** Max length for lead org token in activity grid (uppercased). */
export const ACTIVITY_LEAD_ORG_GRID_TOKEN_MAX = 8;

export type ActivityOrganizationDisplayInput = {
  abbreviation?: string | null;
  displayName?: string | null;
  name?: string | null;
  isLead: boolean;
};

function truncateGridToken(
  value: string,
  max = ACTIVITY_LEAD_ORG_GRID_TOKEN_MAX
): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
}

/** Display token for one org row (grid lead chip source). */
export function formatActivityOrganizationToken(
  input: Pick<
    ActivityOrganizationDisplayInput,
    'abbreviation' | 'displayName' | 'name'
  >
): string {
  const abbreviation = input.abbreviation?.trim();
  if (abbreviation) {
    return truncateGridToken(abbreviation.toUpperCase());
  }
  const label = (input.displayName ?? input.name ?? '').trim();
  if (label) return truncateGridToken(label.toUpperCase());
  return '';
}

/**
 * Compact grid string: lead token + "+n joint" when n > 0 non-lead rows.
 */
export function formatActivityOrganizationsGridSummary(
  rows: ActivityOrganizationDisplayInput[]
): string | null {
  if (rows.length === 0) return null;
  const lead = rows.find((r) => r.isLead) ?? rows[0];
  const leadToken = formatActivityOrganizationToken(lead);
  const jointCount = rows.filter((r) => !r.isLead).length;
  if (!leadToken && jointCount === 0) return null;
  if (jointCount <= 0) return leadToken || null;
  const base = leadToken || 'ORG';
  return `${base} +${jointCount} joint`;
}
