import type { OrganizationDetail } from '../schemas/activity-response.schema';
import { NEWS_RELEASE_ORIGIN_NAMES } from './constants';
import { organizationDetailToken } from './org-token';

export type NewsReleaseOriginOptionLookup = {
  id: number;
  name: string;
  displayName: string;
};

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function leadAndJoints(organizations: readonly OrganizationDetail[]): {
  lead: OrganizationDetail | null;
  joints: OrganizationDetail[];
} {
  const lead = organizations.find((o) => o.isLead) ?? null;
  const joints = organizations.filter((o) => !o.isLead);
  return { lead, joints };
}

/**
 * Legacy-style dynamic label for the origin select (per lookup row + orgs).
 */
export function formatNewsReleaseOriginFormLabel(
  origin: NewsReleaseOriginOptionLookup,
  organizations: readonly OrganizationDetail[]
): string {
  const key = normalizeName(origin.name);
  const { lead, joints } = leadAndJoints(organizations);

  switch (key) {
    case NEWS_RELEASE_ORIGIN_NAMES.tbd:
      return origin.displayName;
    case NEWS_RELEASE_ORIGIN_NAMES.ministryRelease: {
      if (!lead) return origin.displayName;
      return `Ministry ${organizationDetailToken(lead)} release`;
    }
    case NEWS_RELEASE_ORIGIN_NAMES.jointMinistry3rdParty:
    case NEWS_RELEASE_ORIGIN_NAMES.jointMinistryFederal: {
      const leadToken = lead ? organizationDetailToken(lead) : '—';
      const jointTokens = joints.map((j) => organizationDetailToken(j));
      const jointPart = jointTokens.length > 0 ? jointTokens.join(' / ') : '—';
      return `Joint ${leadToken} / ${jointPart} release`;
    }
    case NEWS_RELEASE_ORIGIN_NAMES.thirdParty: {
      if (!lead) return origin.displayName;
      return `${organizationDetailToken(lead)} release`;
    }
    case NEWS_RELEASE_ORIGIN_NAMES.localGovernment:
    case NEWS_RELEASE_ORIGIN_NAMES.federal:
      return origin.displayName;
    default:
      return origin.displayName;
  }
}

export function buildNewsReleaseOriginSelectOptions(
  origins: readonly NewsReleaseOriginOptionLookup[],
  organizations: readonly OrganizationDetail[]
): Array<{ value: string; label: string }> {
  return origins.map((o) => ({
    value: String(o.id),
    label: formatNewsReleaseOriginFormLabel(o, organizations),
  }));
}
