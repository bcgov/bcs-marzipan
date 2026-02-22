import type { ActivityFormData, VenueAddress } from '@corpcal/shared/schemas';

/** Top-level form keys plus nested venue address field names (for label lookup). */
type ActivityFieldLabelKey =
  | keyof ActivityFormData
  | keyof NonNullable<VenueAddress>;

const FIELD_LABEL_MAP: Partial<Record<ActivityFieldLabelKey, string>> = {
  title: 'Title',
  categoryIds: 'Category',
  startDate: 'Start date',
  endDate: 'End date',
  startTime: 'Start time',
  endTime: 'End time',
  leadOrgId: 'Lead organization',
  commsContactLeadId: 'Comms contact',
  eventPlannerLeadId: 'Event planner',
  activityStatusId: 'Activity status',
  leadMinistryId: 'Lead ministry',
  venueAddress: 'Venue address',
  street: 'Street address',
  city: 'City',
  provinceOrState: 'Province/state',
  country: 'Country',
};

/**
 * Maps activity form field names to user-friendly labels (e.g. for missing-required-fields display).
 */
export function getActivityFieldLabel(fieldName: string): string {
  return FIELD_LABEL_MAP[fieldName as ActivityFieldLabelKey] ?? fieldName;
}
