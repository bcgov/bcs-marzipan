import type {
  ActivityFlagResponse,
  ActivityListItem,
  ActivityResponse,
} from '@corpcal/shared/api/types';

/**
 * View-model for the activity table. Mapped from {@link ActivityListItem}
 * (or full {@link ActivityResponse}) with minimal transformations for display.
 *
 * All date/time fields are ISO strings to match the API contract.
 */
export interface ActivityTableRow {
  // Identity
  id: number;
  displayId: string | null;

  // Overview column
  title: string;
  activityCategories: string[];
  pitchDate: string | null;
  pitchRequiredStatus: string | null;
  isConfidential: boolean;
  isIssue: boolean;

  // Summary column
  summary: string;
  /** Executive summary (raw rich-text/string); used for keyword search parity with Reports. */
  executiveSummary: string;
  tags: Array<{ id: number; text: string }>;
  lookAheadStatus: string | null;
  lookAheadSection: string | null;

  // Scheduling column
  allDay: boolean;
  startDate: string | null;
  endDate: string | null;
  dateStatus: string;
  startTime: string | null;
  endTime: string | null;
  timeStatus: string;
  venue: string | null;
  premierRequested: string | null;
  activityRepresentatives: string[];

  // Leads column
  leadOrg: string | null;
  leadMinistry: string | null;
  /** Ministry acronym for table display; falls back to leadMinistry when absent */
  leadMinistryAbbreviation: string | null;
  commsLeadName: string | null;
  commsContactsCount: number;
  /** Event planner display names */
  eventPlanners: string[];
  /** Event planner lookup IDs for client-side filtering */
  eventPlannerLeadIds: number[];
  leadMinistryId: number | null;
  leadOrgId: number | null;
  commsContactLeadUserId: number | null;

  // Materials column
  translationsRequired: string[];
  translationsRequiredStatus: string | null;
  /** Translation required status ID for ID-based filtering (parity with server). */
  translationsRequiredStatusId: number | null;
  commsMaterials: string[];

  // Status column
  activityStatus: string;
  activityStatusId: number;
  /** Dotted field paths changed since last review (admin/system admin reviewers). */
  changedFieldsSinceReview?: string[];
  lastUpdatedDateTime: string;
  lastUpdatedBy: number;
  createdDateTime: string;

  changedFieldsSinceReview?: string[];

  // Flags (team-scoped assignments)
  flags: ActivityFlagResponse[];
}

/**
 * Format a venue address for display.
 * Includes country only when it is not Canada.
 */
function formatVenueAddress(
  venueAddress: ActivityResponse['venueAddress']
): string | null {
  if (!venueAddress) return null;

  const parts: string[] = [];

  if (venueAddress.venueName) parts.push(venueAddress.venueName);
  if (venueAddress.addressLine1) parts.push(venueAddress.addressLine1);
  if (venueAddress.addressLine2) parts.push(venueAddress.addressLine2);
  if (venueAddress.city) parts.push(venueAddress.city);
  if (venueAddress.provinceOrState) parts.push(venueAddress.provinceOrState);

  if (venueAddress.country && venueAddress.country.toLowerCase() !== 'canada') {
    parts.push(venueAddress.country);
  }

  return parts.length > 0 ? parts.join(', ') : null;
}

/**
 * Map an activity list item or full API response to an ActivityTableRow.
 */
export function mapActivityToTableRow(
  activity: ActivityListItem | ActivityResponse
): ActivityTableRow {
  const commsLead = activity.commsContacts.find((c) => c.isLead);

  return {
    id: activity.id,
    displayId: activity.displayId,

    // Overview
    title: activity.title,
    activityCategories: activity.category,
    pitchDate: activity.pitchDate ?? null,
    pitchRequiredStatus: activity.pitchRequiredStatus ?? null,
    isConfidential: activity.isConfidential,
    isIssue: activity.isIssue,

    // Summary
    summary: activity.summary,
    executiveSummary: activity.executiveSummary ?? '',
    tags: activity.tags,
    lookAheadStatus: activity.lookAheadStatus ?? null,
    lookAheadSection: activity.lookAheadSection ?? null,

    // Scheduling
    allDay: activity.isAllDay,
    startDate: activity.startDate,
    endDate: activity.endDate,
    dateStatus: activity.dateStatus ?? '',
    startTime: activity.startTime,
    endTime: activity.endTime,
    timeStatus: activity.timeStatus ?? '',
    venue: formatVenueAddress(activity.venueAddress),
    premierRequested: activity.premierRequested,
    activityRepresentatives: activity.representativesAttending,

    // Leads
    leadOrg: activity.leadOrg,
    leadMinistry: activity.leadMinistry,
    leadMinistryAbbreviation: activity.leadMinistryAbbreviation ?? null,
    commsLeadName: commsLead?.name ?? null,
    commsContactsCount: activity.commsContacts.length,
    eventPlanners: activity.eventPlanners ?? [],
    eventPlannerLeadIds: activity.eventPlannerLeadIds ?? [],
    leadMinistryId: activity.leadMinistryId ?? null,
    leadOrgId: activity.leadOrgId ?? null,
    commsContactLeadUserId: commsLead?.userId ?? null,

    // Materials
    translationsRequired: activity.translationsRequired ?? [],
    translationsRequiredStatus: activity.translationsRequiredStatus ?? null,
    translationsRequiredStatusId: activity.translationsRequiredStatusId ?? null,
    commsMaterials: activity.commsMaterials,

    // Status
    activityStatus: activity.activityStatus,
    activityStatusId: activity.activityStatusId ?? 0,
    changedFieldsSinceReview: activity.changedFieldsSinceReview ?? [],
    lastUpdatedDateTime: activity.lastUpdatedDateTime,
    lastUpdatedBy: activity.lastUpdatedBy,
    createdDateTime: activity.createdDateTime,
    changedFieldsSinceReview:
      'changedFieldsSinceReview' in activity &&
      Array.isArray(activity.changedFieldsSinceReview)
        ? activity.changedFieldsSinceReview.filter(
            (v): v is string => typeof v === 'string'
          )
        : undefined,

    // Flags
    flags: activity.flags ?? [],
  };
}
