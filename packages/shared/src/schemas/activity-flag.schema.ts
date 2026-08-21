import { z } from 'zod';

/**
 * Activity Flag schemas
 *
 * An activity flag marks a team member for follow-up on an activity within a team.
 * Rules:
 *   - Multiple flagged users are allowed per (activity_id, team_id).
 *   - At most one row per (activity_id, team_id, flagged_user_id).
 *   - Any team member with activities.flag permission can set or sync flags for their team.
 *   - Any active team member can remove flags (no flag permission required).
 */

/** Flag as returned in the activity response. */
export const activityFlagResponseSchema = z.object({
  teamId: z.number().int(),
  teamName: z.string(),
  displayTeamId: z.number().int().nullable(),
  displayTeamName: z.string().nullable(),
  flaggedUserId: z.number().int(),
  flaggedUserName: z.string(),
  flaggedById: z.number().int(),
  note: z.string().nullable(),
  /** Hex flag colour set by an admin for this flagged user. Null means use the app default. */
  flaggedUserColour: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ActivityFlagResponse = z.infer<typeof activityFlagResponseSchema>;

/** Request body for PUT /activities/:id/flag — sets (or replaces) the flag for the caller's team. */
export const upsertActivityFlagRequestSchema = z.object({
  /** Team ID scoping this flag (must be one of the caller's teams). */
  teamId: z.number().int(),
  /** User ID of the teammate to flag. */
  flaggedUserId: z.number().int(),
  /** Optional contextual note stored with the flag. */
  note: z.string().max(1000).optional(),
});

export type UpsertActivityFlagRequest = z.infer<
  typeof upsertActivityFlagRequestSchema
>;

/** Request body for PUT /activities/:id/flags — syncs the full flagged-user set for the caller's team. */
export const upsertActivityFlagsRequestSchema = z.object({
  /** Team ID scoping this flag set (must be one of the caller's teams). */
  teamId: z.number().int(),
  /** Full desired flagged-user set for this activity/team (duplicates are rejected). */
  flaggedUserIds: z
    .array(z.number().int())
    .max(1000)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: 'flaggedUserIds must not contain duplicates',
    }),
  /** Optional display team for each flagged user, indexed by userId. When omitted (or when a value is null), consumers should treat this as "use teamId". */
  displayTeamPerFlaggedUser: z
    .record(z.coerce.number(), z.number().int().nullable())
    .optional(),
  /** Optional contextual note stored with flags updated/created in this request. */
  note: z.string().max(1000).optional(),
});

export type UpsertActivityFlagsRequest = z.infer<
  typeof upsertActivityFlagsRequestSchema
>;
