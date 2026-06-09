import type { ActivityListItem } from '../schemas/activity-list-item.schema';
import type { ActivityResponse } from '../schemas/activity-response.schema';
import { plainTextFromActivityRichField } from '../utils/activity-rich-text';

/**
 * Normalized text fields used for activity keyword search.
 * Both the Reports server search and the Activity List client search map their
 * source records into this shape so the searchable field set is identical.
 */
export interface ActivitySearchableInput {
  title: string;
  displayId: string | null;
  /** Summary, already converted to plain text (rich-text JSON resolved). */
  summaryPlainText: string;
  /** Executive summary, already converted to plain text. */
  executiveSummaryPlainText: string;
  categoryNames: string[];
  tagTexts: string[];
  lookAheadStatus: string | null;
  lookAheadSection: string | null;
  /** Formatted venue address string. */
  venueText: string;
  leadOrg: string | null;
  leadMinistryAbbreviation: string | null;
  leadMinistry: string | null;
  commsLeadName: string | null;
  eventPlanners: string[];
  activityStatus: string;
  representatives: string[];
}

/**
 * Formats a venue address into a single search string.
 * Country is included only when it is not Canada (default).
 */
export function formatVenueAddressForSearch(
  venueAddress: ActivityResponse['venueAddress']
): string {
  if (!venueAddress) return '';
  const parts: string[] = [];
  if (venueAddress.venueName) parts.push(venueAddress.venueName);
  if (venueAddress.addressLine1) parts.push(venueAddress.addressLine1);
  if (venueAddress.addressLine2) parts.push(venueAddress.addressLine2);
  if (venueAddress.city) parts.push(venueAddress.city);
  if (venueAddress.provinceOrState) parts.push(venueAddress.provinceOrState);
  if (venueAddress.country && venueAddress.country.toLowerCase() !== 'canada') {
    parts.push(venueAddress.country);
  }
  return parts.join(', ');
}

/** The single ordered list of searchable text values for an activity. */
export function getActivitySearchableTexts(
  input: ActivitySearchableInput
): string[] {
  return [
    input.title,
    input.displayId ?? '',
    input.summaryPlainText,
    input.executiveSummaryPlainText,
    input.categoryNames.join(' '),
    input.tagTexts.join(' '),
    input.lookAheadStatus ?? '',
    input.lookAheadSection ?? '',
    input.venueText,
    input.leadOrg ?? '',
    input.leadMinistryAbbreviation ?? '',
    input.leadMinistry ?? '',
    input.commsLeadName ?? '',
    input.eventPlanners.join(' '),
    input.activityStatus,
    input.representatives.join(' '),
  ];
}

/**
 * True when `keyword` (trimmed, case-insensitive) appears in any searchable
 * field. An empty/whitespace keyword always matches.
 */
export function activityMatchesSearchKeyword(
  input: ActivitySearchableInput,
  keyword: string | undefined
): boolean {
  const term = (keyword ?? '').trim().toLowerCase();
  if (term === '') return true;
  return getActivitySearchableTexts(input).some((v) =>
    v.toLowerCase().includes(term)
  );
}

/** Activity list/report row or full response — fields needed for keyword search. */
export type ActivitySearchableSource = ActivityListItem | ActivityResponse;

/** Maps an activity list/report row or full response to the shared searchable input. */
export function activityResponseToSearchableInput(
  activity: ActivitySearchableSource
): ActivitySearchableInput {
  const commsLead = activity.commsContacts.find((c) => c.isLead);
  return {
    title: activity.title,
    displayId: activity.displayId,
    summaryPlainText: plainTextFromActivityRichField(activity.summary),
    executiveSummaryPlainText: plainTextFromActivityRichField(
      activity.executiveSummary ?? ''
    ),
    categoryNames: activity.category,
    tagTexts: activity.tags.map((t) => t.text),
    lookAheadStatus: activity.lookAheadStatus ?? null,
    lookAheadSection: activity.lookAheadSection ?? null,
    venueText: formatVenueAddressForSearch(activity.venueAddress),
    leadOrg: activity.leadOrg,
    leadMinistryAbbreviation: activity.leadMinistryAbbreviation ?? null,
    leadMinistry: activity.leadMinistry,
    commsLeadName: commsLead?.name ?? null,
    eventPlanners: activity.eventPlanners ?? [],
    activityStatus: activity.activityStatus,
    representatives: activity.representativesAttending,
  };
}
