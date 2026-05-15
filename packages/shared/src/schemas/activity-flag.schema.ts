import { z } from 'zod';

/**
 * Activity Flag schemas
 *
 * An activity flag assigns one team member to an activity per team.
 * Rules:
 *   - At most one flag per (activity_id, team_id).
 *   - Any team member with activities.flag permission can set or replace the flag.
 *   - Any active team member can remove the flag (no flag permission required).
 */

/** Flag as returned in the activity response. */
export const activityFlagResponseSchema = z.object({
  teamId: z.number().int(),
  teamName: z.string(),
  assigneeId: z.number().int(),
  assigneeName: z.string(),
  assignedById: z.number().int(),
  note: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ActivityFlagResponse = z.infer<typeof activityFlagResponseSchema>;

/** Request body for PUT /activities/:id/flag — sets (or replaces) the flag for the caller's team. */
export const upsertActivityFlagRequestSchema = z.object({
  /** Team ID scoping this flag (must be one of the caller's teams). */
  teamId: z.number().int(),
  /** User ID of the teammate to assign. */
  assigneeId: z.number().int(),
  /** Optional contextual note stored with the flag. */
  note: z.string().max(1000).optional(),
});

export type UpsertActivityFlagRequest = z.infer<
  typeof upsertActivityFlagRequestSchema
>;
