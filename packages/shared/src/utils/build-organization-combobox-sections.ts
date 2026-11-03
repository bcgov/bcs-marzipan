/** Org rows without a type sort under this bucket (always last among sections). */
export const ORGANIZATION_COMBOBOX_OTHER_TYPE_SORT_ORDER =
  Number.MAX_SAFE_INTEGER;

export const ORGANIZATION_COMBOBOX_OTHER_HEADING = 'Other';

export type OrganizationComboboxSourceOption = {
  value: number;
  label: string;
  organizationTypeId?: number | null;
  organizationTypeDisplayName?: string | null;
  organizationTypeSortOrder?: number | null;
};

export type OrganizationComboboxSection = {
  id: string;
  heading: string;
  options: Array<{ value: string; label: string }>;
};

function compareLabels(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: 'base' });
}

/**
 * Activity form org picker: group by organization type, order sections by admin
 * type sort_order, order orgs alphabetically within each section.
 */
export function buildOrganizationComboboxSections(
  organizations: readonly OrganizationComboboxSourceOption[]
): OrganizationComboboxSection[] {
  type Bucket = {
    id: string;
    heading: string;
    typeSortOrder: number;
    options: OrganizationComboboxSourceOption[];
  };

  const buckets = new Map<string, Bucket>();

  for (const org of organizations) {
    const typeId = org.organizationTypeId ?? null;
    const isOther = typeId == null;
    const bucketId = isOther ? 'type-other' : `type-${typeId}`;
    const heading =
      org.organizationTypeDisplayName?.trim() ||
      (isOther ? ORGANIZATION_COMBOBOX_OTHER_HEADING : 'Unknown');
    const typeSortOrder = isOther
      ? ORGANIZATION_COMBOBOX_OTHER_TYPE_SORT_ORDER
      : (org.organizationTypeSortOrder ?? 0);

    const existing = buckets.get(bucketId);
    if (existing) {
      existing.options.push(org);
    } else {
      buckets.set(bucketId, {
        id: bucketId,
        heading,
        typeSortOrder,
        options: [org],
      });
    }
  }

  const sortedBuckets = [...buckets.values()].sort((a, b) => {
    if (a.typeSortOrder !== b.typeSortOrder) {
      return a.typeSortOrder - b.typeSortOrder;
    }
    return compareLabels(a.heading, b.heading);
  });

  return sortedBuckets.map((bucket) => ({
    id: bucket.id,
    heading: bucket.heading,
    options: [...bucket.options]
      .sort((a, b) => compareLabels(a.label, b.label))
      .map((o) => ({ value: String(o.value), label: o.label })),
  }));
}
