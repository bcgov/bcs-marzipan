const FIELD_LABEL_MAP: Record<string, string> = {
  title: 'Title',
  categoryIds: 'Category',
  startDate: 'Start Date',
  endDate: 'End Date',
  startTime: 'Start Time',
  endTime: 'End Time',
  leadOrgId: 'Lead Organization',
  commsContactLeadId: 'Comms Contact',
  eventPlannerLeadId: 'Event Planner',
  activityStatusId: 'Activity Status',
  leadMinistryId: 'Lead Ministry',
  venueAddress: 'Venue Address',
  street: 'Street Address',
  city: 'City',
  provinceOrState: 'Province/State',
  country: 'Country',
};

/**
 * Maps activity form field names to user-friendly labels (e.g. for missing-required-fields display).
 */
export function getActivityFieldLabel(fieldName: string): string {
  return FIELD_LABEL_MAP[fieldName] ?? fieldName;
}
