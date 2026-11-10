import {
  normalizeOrganizationFormEntries,
  type OrganizationFormEntry,
} from './activity-form-organization-normalize';

/**
 * Stable identity for deduping catalog ids vs freeform names on the activity form.
 */
export function organizationEntryIdentityKey(
  entry: OrganizationFormEntry
): string | null {
  const id =
    typeof entry.organizationId === 'number' && entry.organizationId > 0
      ? entry.organizationId
      : undefined;
  if (id != null) {
    return `id:${id}`;
  }
  const name =
    typeof entry.organizationName === 'string'
      ? entry.organizationName.trim()
      : '';
  if (name.length > 0) {
    return `name:${name.toLowerCase()}`;
  }
  return null;
}

export type SplitOrganizationFormEntriesResult = {
  lead: OrganizationFormEntry | null;
  joints: OrganizationFormEntry[];
};

export function splitOrganizationFormEntries(
  entries: OrganizationFormEntry[] | undefined | null
): SplitOrganizationFormEntriesResult {
  const list = normalizeOrganizationFormEntries(entries ?? []);
  const lead = list.find((o) => o.isLead === true) ?? null;
  const joints = list.filter((o) => o.isLead !== true);
  return { lead, joints };
}

export function mergeLeadAndJointOrganizations(
  lead: OrganizationFormEntry | null,
  joints: OrganizationFormEntry[]
): OrganizationFormEntry[] {
  const leadKey = lead ? organizationEntryIdentityKey(lead) : null;
  const jointRows = joints
    .map((j) => ({ ...j, isLead: false as const }))
    .filter((j) => {
      const key = organizationEntryIdentityKey(j);
      return key != null && key !== leadKey;
    });

  if (!lead) {
    return normalizeOrganizationFormEntries(jointRows);
  }

  const leadRow: OrganizationFormEntry = { ...lead, isLead: true };
  return normalizeOrganizationFormEntries([leadRow, ...jointRows]);
}
