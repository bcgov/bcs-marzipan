import type { ActivityFormData } from '../schemas/activity.schema';

export type OrganizationFormEntry = NonNullable<
  ActivityFormData['organizations']
>[number];

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * One ministries/organizations row: id XOR name, explicit isLead.
 */
export function normalizeOrganizationFormEntry(
  entry: Record<string, unknown>
): OrganizationFormEntry | null {
  const isLead = entry.isLead === true;
  const id =
    typeof entry.organizationId === 'number' && entry.organizationId > 0
      ? entry.organizationId
      : undefined;

  if (id != null) {
    return { organizationId: id, isLead };
  }

  const name =
    typeof entry.organizationName === 'string'
      ? entry.organizationName.trim()
      : '';
  if (name.length > 0) {
    return { organizationName: name, isLead };
  }

  return null;
}

export function normalizeOrganizationFormEntries(
  entries: unknown
): OrganizationFormEntry[] {
  if (!Array.isArray(entries) || entries.length === 0) return [];
  const out: OrganizationFormEntry[] = [];
  for (const item of entries) {
    if (!isPlainRecord(item)) continue;
    const normalized = normalizeOrganizationFormEntry(item);
    if (normalized) out.push(normalized);
  }
  return out;
}
