import { NEWS_RELEASE_ORIGIN_IDS } from './constants';
import type { NewsReleaseOriginInferenceOrg } from './resolve-form-organizations';

/** Matches `organization_types` seed id for ministry (see database schema). */
const ORGANIZATION_TYPE_MINISTRY_ID = 1;

function leadOrg(
  orgs: readonly NewsReleaseOriginInferenceOrg[]
): NewsReleaseOriginInferenceOrg | null {
  return orgs.find((o) => o.isLead) ?? null;
}

function jointOrgs(
  orgs: readonly NewsReleaseOriginInferenceOrg[]
): NewsReleaseOriginInferenceOrg[] {
  return orgs.filter((o) => !o.isLead);
}

function isFreeformLead(lead: NewsReleaseOriginInferenceOrg): boolean {
  return (
    lead.organizationId == null &&
    (lead.organizationName?.trim().length ?? 0) > 0
  );
}

function isFederalOrg(org: NewsReleaseOriginInferenceOrg): boolean {
  return org.jurisdiction === 'federal';
}

function isLocalGovernmentLead(lead: NewsReleaseOriginInferenceOrg): boolean {
  return lead.jurisdiction === 'local_government';
}

function isBcgovMinistryLead(lead: NewsReleaseOriginInferenceOrg): boolean {
  return (
    lead.jurisdiction === 'bcgov' &&
    lead.organizationTypeId === ORGANIZATION_TYPE_MINISTRY_ID
  );
}

/**
 * Suggests `newsReleaseOriginId` from activity organizations (client-only; not applied on server save).
 */
export function inferNewsReleaseOriginId(
  organizations: readonly NewsReleaseOriginInferenceOrg[]
): number {
  const lead = leadOrg(organizations);
  const joints = jointOrgs(organizations);

  if (!lead) {
    return NEWS_RELEASE_ORIGIN_IDS.tbd;
  }

  if (joints.length > 0) {
    const federalInvolved =
      isFederalOrg(lead) || joints.some((j) => isFederalOrg(j));
    if (federalInvolved) {
      return NEWS_RELEASE_ORIGIN_IDS.jointMinistryFederal;
    }
    return NEWS_RELEASE_ORIGIN_IDS.jointMinistry3rdParty;
  }

  if (isFreeformLead(lead)) {
    return NEWS_RELEASE_ORIGIN_IDS.thirdParty;
  }

  if (isFederalOrg(lead)) {
    return NEWS_RELEASE_ORIGIN_IDS.federal;
  }

  if (isLocalGovernmentLead(lead)) {
    return NEWS_RELEASE_ORIGIN_IDS.localGovernment;
  }

  if (isBcgovMinistryLead(lead)) {
    return NEWS_RELEASE_ORIGIN_IDS.ministryRelease;
  }

  if (lead.jurisdiction === 'bcgov') {
    return NEWS_RELEASE_ORIGIN_IDS.thirdParty;
  }

  return NEWS_RELEASE_ORIGIN_IDS.thirdParty;
}
