import type { OrganizationDetail } from '../schemas/activity-response.schema';

const ORG_DISPLAY_TRUNCATE = 24;

export function truncateOrgDisplayName(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= ORG_DISPLAY_TRUNCATE) return trimmed;
  return `${trimmed.slice(0, ORG_DISPLAY_TRUNCATE - 1)}…`;
}

/** Lead/joint token for origin form labels: abbreviation, else truncated display name. */
export function organizationDetailToken(org: OrganizationDetail): string {
  const abbr = org.abbreviation?.trim();
  if (abbr && abbr.length > 0) return abbr;
  return truncateOrgDisplayName(org.name);
}
