import { z } from 'zod';

import { teamListItemSchema } from './team.schema';

/** One shortcut group returned to the activity form (ministry membership derived from ministries.ministry_group_id). */
export const ministryQuickShareGroupResponseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  sortOrder: z.number().int(),
  ministryIds: z.array(z.number().int()),
});

export type MinistryQuickShareGroupResponse = z.infer<
  typeof ministryQuickShareGroupResponseSchema
>;

/** Groups for GET /lookups/activity-team-sharing (no set — single global list). */
export const activityTeamSharingQuickShareSchema = z.object({
  groups: z.array(ministryQuickShareGroupResponseSchema),
});

export type ActivityTeamSharingQuickShare = z.infer<
  typeof activityTeamSharingQuickShareSchema
>;

export const activityTeamSharingResponseSchema = z.object({
  teams: z.array(teamListItemSchema),
  quickShare: activityTeamSharingQuickShareSchema.nullable(),
});

export type ActivityTeamSharingResponse = z.infer<
  typeof activityTeamSharingResponseSchema
>;

/** Ministry group row for admin / lookups list */
export const ministryGroupResponseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  sortOrder: z.number().int(),
});

export type MinistryGroupResponse = z.infer<typeof ministryGroupResponseSchema>;

export const createMinistryGroupRequestSchema = z.object({
  name: z.string().min(1).max(200),
  sortOrder: z.number().int(),
});

export type CreateMinistryGroupRequest = z.infer<
  typeof createMinistryGroupRequestSchema
>;

export const updateMinistryGroupRequestSchema =
  createMinistryGroupRequestSchema.partial();

export type UpdateMinistryGroupRequest = z.infer<
  typeof updateMinistryGroupRequestSchema
>;
