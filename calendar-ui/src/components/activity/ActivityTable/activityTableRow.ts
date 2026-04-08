import type { ActivityResponse } from '@corpcal/shared/api/types';

/**
 * View-model for the activity table. Derived from ActivityResponse
 * with minimal transformations for table display.
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
  commsMaterials: string[];

  // Status column
  activityStatus: string;
  activityStatusId: number;
  lastUpdatedDateTime: string;
  lastUpdatedBy: number;
  createdDateTime: string;
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
 * Map an ActivityResponse (API contract) to an ActivityTableRow (table view-model).
 * This is the single transformation point between the API and the table component.
 */
export function mapActivityResponseToTableRow(
  activity: ActivityResponse
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
    commsMaterials: activity.commsMaterials,

    // Status
    activityStatus: activity.activityStatus,
    activityStatusId: activity.activityStatusId ?? 0,
    lastUpdatedDateTime: activity.lastUpdatedDateTime,
    lastUpdatedBy: activity.lastUpdatedBy,
    createdDateTime: activity.createdDateTime,
  };
}
