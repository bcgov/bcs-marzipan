import type { ActivityResponse } from '@corpcal/shared/api/types';
import { plainTextFromActivityRichField } from '@corpcal/shared/utils';

/**
 * Report-only keyword filter on API activities.
 * Field set is aligned with the activity list table keyword search (see calendar-ui activity-query-utils).
 */
function formatVenueAddressForSearch(
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

function activityResponseSearchableFieldValues(
  activity: ActivityResponse
): string[] {
  const commsLead = activity.commsContacts.find((c) => c.isLead);
  return [
    activity.title,
    activity.displayId ?? '',
    plainTextFromActivityRichField(activity.summary),
    plainTextFromActivityRichField(activity.executiveSummary ?? ''),
    activity.category.join(' '),
    activity.tags.map((t) => t.text).join(' '),
    activity.lookAheadStatus ?? '',
    activity.lookAheadSection ?? '',
    formatVenueAddressForSearch(activity.venueAddress),
    activity.leadOrg ?? '',
    activity.leadMinistryAbbreviation ?? '',
    activity.leadMinistry ?? '',
    commsLead?.name ?? '',
    (activity.eventPlanners ?? []).join(' '),
    activity.activityStatus,
    activity.representativesAttending.join(' '),
  ];
}

export function filterActivityResponsesBySearchKeyword(
  activities: ActivityResponse[],
  keyword: string | undefined
): ActivityResponse[] {
  const term = (keyword ?? '').trim();
  if (term === '') return activities;
  const lower = term.toLowerCase();
  return activities.filter((a) =>
    activityResponseSearchableFieldValues(a).some((v) =>
      v.toLowerCase().includes(lower)
    )
  );
}
