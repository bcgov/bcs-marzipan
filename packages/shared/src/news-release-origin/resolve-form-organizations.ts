import type { OrganizationDetail } from '../schemas/activity-response.schema';
import type { OrganizationJurisdiction } from '../schemas/lookup.schema';

export type OrganizationCatalogRow = {
  id: number;
  name: string;
  displayName?: string;
  abbreviation?: string | null;
  jurisdiction?: OrganizationJurisdiction | null;
  organizationTypeId?: number | null;
};

export type ActivityOrganizationFormEntry = {
  organizationId?: number;
  organizationName?: string;
  isLead?: boolean;
};

export type NewsReleaseOriginInferenceOrg = {
  organizationId?: number | null;
  organizationName?: string | null;
  isLead: boolean;
  jurisdiction?: OrganizationJurisdiction | null;
  organizationTypeId?: number | null;
};

export function resolveOrganizationsForOriginInference(
  formOrgs: readonly ActivityOrganizationFormEntry[],
  catalog: readonly OrganizationCatalogRow[]
): NewsReleaseOriginInferenceOrg[] {
  const byId = new Map(catalog.map((o) => [o.id, o]));
  return formOrgs.map((entry) => {
    const id = entry.organizationId;
    const catalogRow = id != null ? byId.get(id) : undefined;
    return {
      organizationId: id ?? null,
      organizationName: entry.organizationName?.trim() || null,
      isLead: entry.isLead === true,
      jurisdiction:
        (catalogRow?.jurisdiction as OrganizationJurisdiction | undefined) ??
        null,
      organizationTypeId: catalogRow?.organizationTypeId ?? null,
    };
  });
}

export function formOrganizationsToOriginLabelDetails(
  formOrgs: readonly ActivityOrganizationFormEntry[],
  catalog: readonly OrganizationCatalogRow[]
): OrganizationDetail[] {
  const byId = new Map(catalog.map((o) => [o.id, o]));
  return formOrgs.map((entry) => {
    const id = entry.organizationId;
    const catalogRow = id != null ? byId.get(id) : undefined;
    const freeform = entry.organizationName?.trim() ?? '';
    const name =
      catalogRow?.displayName?.trim() ||
      catalogRow?.name?.trim() ||
      freeform ||
      (id != null ? `Organization #${id}` : 'Unknown organization');
    return {
      organizationId: id ?? undefined,
      organizationName: freeform || undefined,
      name,
      abbreviation: catalogRow?.abbreviation ?? null,
      isLead: entry.isLead === true,
      jurisdiction:
        (catalogRow?.jurisdiction as OrganizationJurisdiction | undefined) ??
        null,
      organizationTypeId: catalogRow?.organizationTypeId ?? null,
    };
  });
}
