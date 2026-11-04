type OrganizationDiffRow = {
  isLead?: boolean;
  organizationId?: number;
  organizationName?: string;
};

function compareOrganizationDiffRows(
  a: OrganizationDiffRow,
  b: OrganizationDiffRow
): number {
  const leadA = a.isLead === true ? 0 : 1;
  const leadB = b.isLead === true ? 0 : 1;
  if (leadA !== leadB) return leadA - leadB;

  const idA =
    typeof a.organizationId === 'number' && a.organizationId > 0
      ? a.organizationId
      : Number.MAX_SAFE_INTEGER;
  const idB =
    typeof b.organizationId === 'number' && b.organizationId > 0
      ? b.organizationId
      : Number.MAX_SAFE_INTEGER;
  if (idA !== idB) return idA - idB;

  const nameA = (a.organizationName ?? '').trim();
  const nameB = (b.organizationName ?? '').trim();
  return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
}

/** Stable order for review diff: lead first, then catalog id, then freeform name. */
export function sortOrganizationEntriesForDiff(
  arr: unknown
): OrganizationDiffRow[] {
  if (!Array.isArray(arr)) return [];
  const rows: OrganizationDiffRow[] = [];
  for (const item of arr) {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) {
      continue;
    }
    rows.push(item as OrganizationDiffRow);
  }
  return rows.slice().sort(compareOrganizationDiffRows);
}
