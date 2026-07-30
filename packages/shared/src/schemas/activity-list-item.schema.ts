import { z } from 'zod';

import {
  activityComputedFieldsSchema,
  activityDbFieldsSchema,
  eventPlannerDetailSchema,
} from './activity-response.schema';

const commsContactSchema = z.object({
  userId: z.number().int(),
  name: z.string(),
  isLead: z.boolean(),
});

/** Discriminator for list/report bulk payloads vs full {@link ActivityResponse}. */
export const ACTIVITY_LIST_ITEM_SHAPE = 'list' as const;

/**
 * Slim read model for activity list and report bulk endpoints.
 * Uses the same property names as {@link ActivityResponse} where fields overlap
 * so report export and filter helpers can consume either shape.
 */
export const activityListItemSchema = z.object({
  /** Set on API list/report payloads; optional in schema for legacy test fixtures. */
  _shape: z.literal(ACTIVITY_LIST_ITEM_SHAPE).optional(),
  id: activityDbFieldsSchema.shape.id,
  displayId: activityDbFieldsSchema.shape.displayId,
  title: activityDbFieldsSchema.shape.title,
  summary: activityDbFieldsSchema.shape.summary,
  executiveSummary: activityDbFieldsSchema.shape.executiveSummary,
  significance: activityDbFieldsSchema.shape.significance,
  strategy: activityDbFieldsSchema.shape.strategy,
  schedulingNotes: activityDbFieldsSchema.shape.schedulingNotes,
  isIssue: activityDbFieldsSchema.shape.isIssue,
  isConfidential: activityDbFieldsSchema.shape.isConfidential,
  category: activityComputedFieldsSchema.shape.category,
  categoryIds: activityComputedFieldsSchema.shape.categoryIds,
  tags: activityComputedFieldsSchema.shape.tags,
  pitchDate: activityDbFieldsSchema.shape.pitchDate,
  pitchRequiredStatus: activityComputedFieldsSchema.shape.pitchRequiredStatus,
  lookAheadStatus: activityDbFieldsSchema.shape.lookAheadStatus,
  lookAheadSection: activityDbFieldsSchema.shape.lookAheadSection,
  isAllDay: activityDbFieldsSchema.shape.isAllDay,
  startDate: activityDbFieldsSchema.shape.startDate,
  endDate: activityDbFieldsSchema.shape.endDate,
  startTime: activityDbFieldsSchema.shape.startTime,
  endTime: activityDbFieldsSchema.shape.endTime,
  dateStatus: activityComputedFieldsSchema.shape.dateStatus,
  timeStatus: activityComputedFieldsSchema.shape.timeStatus,
  venueAddress: activityComputedFieldsSchema.shape.venueAddress,
  premierRequested: activityComputedFieldsSchema.shape.premierRequested,
  representativesAttending:
    activityComputedFieldsSchema.shape.representativesAttending,
  leadOrg: activityComputedFieldsSchema.shape.leadOrg,
  leadOrgId: activityDbFieldsSchema.shape.leadOrgId,
  leadMinistry: activityComputedFieldsSchema.shape.leadMinistry,
  leadMinistryAbbreviation:
    activityComputedFieldsSchema.shape.leadMinistryAbbreviation,
  leadTeamDisplayName: activityComputedFieldsSchema.shape.leadTeamDisplayName,
  leadTeamId: activityDbFieldsSchema.shape.leadTeamId,
  leadMinistryId: activityDbFieldsSchema.shape.leadMinistryId,
  commsContacts: commsContactSchema.array().default([]),
  eventPlanners: activityComputedFieldsSchema.shape.eventPlanners,
  eventPlannerLeadIds: activityComputedFieldsSchema.shape.eventPlannerLeadIds,
  eventPlannerDetails: eventPlannerDetailSchema.array().default([]),
  translationsRequired: activityComputedFieldsSchema.shape.translationsRequired,
  translationsRequiredStatus:
    activityComputedFieldsSchema.shape.translationsRequiredStatus,
  translationsRequiredStatusId:
    activityDbFieldsSchema.shape.translationsRequiredStatusId,
  commsMaterials: activityComputedFieldsSchema.shape.commsMaterials,
  newsReleaseOrigin: activityComputedFieldsSchema.shape.newsReleaseOrigin,
  newsReleaseDistribution:
    activityComputedFieldsSchema.shape.newsReleaseDistribution,
  activityStatus: activityComputedFieldsSchema.shape.activityStatus,
  activityStatusId: activityDbFieldsSchema.shape.activityStatusId,
  lastUpdatedDateTime: activityDbFieldsSchema.shape.lastUpdatedDateTime,
  lastUpdatedBy: activityDbFieldsSchema.shape.lastUpdatedBy,
  createdDateTime: activityDbFieldsSchema.shape.createdDateTime,
  canEdit: activityComputedFieldsSchema.shape.canEdit,
  changedFieldsSinceReview: z.array(z.string()).optional(),
  flags: activityComputedFieldsSchema.shape.flags,
});

export type ActivityListItem = z.infer<typeof activityListItemSchema>;

/** Report section rows use the same slim shape as the activity list. */
export type ReportActivityRow = ActivityListItem;

export function isActivityListItemPayload(
  value: unknown
): value is ActivityListItem {
  if (value === null || typeof value !== 'object') return false;
  const o = value as Record<string, unknown>;
  return (
    o._shape === ACTIVITY_LIST_ITEM_SHAPE &&
    typeof o.id === 'number' &&
    typeof o.title === 'string' &&
    typeof o.isIssue === 'boolean' &&
    typeof o.activityStatusId === 'number'
  );
}

/** Maps a full {@link ActivityResponse} to the list/report read model. */
export function activityResponseToListItem(
  activity: import('./activity-response.schema').ActivityResponse
): ActivityListItem {
  return activityListItemSchema.parse({
    _shape: ACTIVITY_LIST_ITEM_SHAPE,
    id: activity.id,
    displayId: activity.displayId,
    title: activity.title,
    summary: activity.summary,
    executiveSummary: activity.executiveSummary ?? null,
    significance: activity.significance ?? null,
    strategy: activity.strategy ?? null,
    schedulingNotes: activity.schedulingNotes ?? null,
    isIssue: activity.isIssue,
    isConfidential: activity.isConfidential,
    category: activity.category,
    categoryIds: activity.categoryIds ?? [],
    tags: activity.tags,
    pitchDate: activity.pitchDate ?? null,
    pitchRequiredStatus: activity.pitchRequiredStatus ?? null,
    lookAheadStatus: activity.lookAheadStatus ?? null,
    lookAheadSection: activity.lookAheadSection ?? null,
    isAllDay: activity.isAllDay,
    startDate: activity.startDate,
    endDate: activity.endDate,
    startTime: activity.startTime,
    endTime: activity.endTime,
    dateStatus: activity.dateStatus,
    timeStatus: activity.timeStatus,
    venueAddress: activity.venueAddress ?? null,
    premierRequested: activity.premierRequested ?? null,
    representativesAttending: activity.representativesAttending,
    leadOrg: activity.leadOrg,
    leadOrgId: activity.leadOrgId,
    leadMinistry: activity.leadMinistry,
    leadMinistryAbbreviation: activity.leadMinistryAbbreviation ?? null,
    leadTeamDisplayName: activity.leadTeamDisplayName ?? null,
    leadMinistryId: activity.leadMinistryId,
    commsContacts: activity.commsContacts,
    eventPlanners: activity.eventPlanners ?? [],
    eventPlannerLeadIds: activity.eventPlannerLeadIds ?? [],
    eventPlannerDetails: activity.eventPlannerDetails ?? [],
    translationsRequired: activity.translationsRequired ?? [],
    translationsRequiredStatus: activity.translationsRequiredStatus ?? null,
    translationsRequiredStatusId: activity.translationsRequiredStatusId ?? null,
    commsMaterials: activity.commsMaterials,
    newsReleaseOrigin: activity.newsReleaseOrigin ?? null,
    newsReleaseDistribution: activity.newsReleaseDistribution ?? null,
    activityStatus: activity.activityStatus,
    activityStatusId: activity.activityStatusId,
    lastUpdatedDateTime: activity.lastUpdatedDateTime,
    lastUpdatedBy: activity.lastUpdatedBy,
    createdDateTime: activity.createdDateTime,
    canEdit: activity.canEdit,
    changedFieldsSinceReview: activity.changedFieldsSinceReview,
    flags: activity.flags ?? [],
  });
}
