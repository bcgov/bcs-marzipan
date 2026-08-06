import { z } from 'zod';

/**
 * User API Schemas
 *
 * Zod schemas for the users CRUD API contract.
 * These are separate from the lookup schemas (UserResponse / UserLookupItem)
 * which serve the lookup dropdown endpoints.
 *
 * Timestamps are ISO strings for JSON serialization.
 * See history.schema.ts for UserHistoryEntry.
 */

// ============================================
// Team role constant
// ============================================

export const TEAM_ROLES = ['owner', 'member'] as const;

export const USER_DISPLAY_NAME_MAX_LENGTH = 255;
export const USER_NOTES_MAX_LENGTH = 1000;
export const USER_JOB_TITLE_MAX_LENGTH = 255;
export const USER_PHONE_MAX_LENGTH = 50;

// ============================================
// Response Schemas
// ============================================

/**
 * User's team membership as returned by the API.
 */
export const userTeamSchema = z.object({
  teamId: z.number().int(),
  teamName: z.string(),
  role: z.string(),
});

export type UserTeam = z.infer<typeof userTeamSchema>;

/**
 * User list item returned by GET /users.
 */
export const userListItemSchema = z.object({
  id: z.number().int(),
  adUsername: z.string().nullable(),
  adDisplayName: z.string().nullable(),
  adEmail: z.string().nullable(),
  roleId: z.number().int(),
  roleName: z.string(),
  isActive: z.boolean(),
  teams: z.array(userTeamSchema),
  lastUpdatedDateTime: z.string().nullable().optional(),
});

export type UserListItem = z.infer<typeof userListItemSchema>;

/**
 * User detail returned by GET /users/:id.
 * Extends UserListItem with additional fields.
 */
export const userDetailSchema = userListItemSchema.extend({
  notes: z.string().nullable(),
  flagColour: z.string().nullable(),
  directLoginEnabled: z.boolean().optional(),
  /** Active Directory job title (if available) */
  jobTitle: z.string().nullable().optional(),
  /** Contact phone number (if available) */
  phone: z.string().nullable().optional(),
  /** ISO timestamp for the user's last successful login */
  lastLoginDateTime: z.string().nullable().optional(),
});

export type UserDetail = z.infer<typeof userDetailSchema>;

/**
 * Role option returned by GET /lookups/roles (used in user management).
 */
export const roleOptionSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  description: z.string().nullable(),
});

export type RoleOption = z.infer<typeof roleOptionSchema>;

// ============================================
// Request Body Schemas
// ============================================

/**
 * POST /users - Create a new user (admin). Email is required for Azure AD match on first sign-in.
 */
export const createUserBodySchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  roleId: z.number().int(),
  displayName: z.string().trim().max(USER_DISPLAY_NAME_MAX_LENGTH).optional(),
  adJobTitle: z
    .string()
    .trim()
    .max(USER_JOB_TITLE_MAX_LENGTH)
    .nullable()
    .optional(),
  adPhone: z.string().trim().max(USER_PHONE_MAX_LENGTH).nullable().optional(),
  teams: z
    .array(
      z.object({
        teamId: z.number().int(),
        role: z.enum(TEAM_ROLES),
      })
    )
    .optional(),
});

export type CreateUserBody = z.infer<typeof createUserBodySchema>;

/**
 * PATCH /users/:id - Update a user's role, active status, or notes.
 */
export const updateUserBodySchema = z.object({
  roleId: z.number().int().optional(),
  isActive: z.boolean().optional(),
  notes: z.string().max(USER_NOTES_MAX_LENGTH).nullable().optional(),
  /**
   * Profile fields. Editing these is restricted to admins / sys-admins
   * (enforced server-side in the users controller).
   */
  displayName: z
    .string()
    .trim()
    .max(USER_DISPLAY_NAME_MAX_LENGTH)
    .nullable()
    .optional(),
  email: z
    .string()
    .trim()
    .email('Invalid email format')
    .max(255)
    .nullable()
    .optional(),
  phone: z.string().trim().max(50).nullable().optional(),
  jobTitle: z.string().trim().max(255).nullable().optional(),
});

export type UpdateUserBody = z.infer<typeof updateUserBodySchema>;

/**
 * PATCH /users/:id/settings - Update per-user configurable settings.
 */
export const updateUserSettingsBodySchema = z.object({
  flagColour: z
    .string()
    .regex(
      /^#[0-9a-fA-F]{6}$/,
      'Must be a valid 6-digit hex colour (e.g. #FF0000)'
    )
    .nullable(),
  /**
   * Allow admins to enable or disable direct (email+password) login for a user.
   */
  directLoginEnabled: z.boolean().optional(),
});

export type UpdateUserSettingsBody = z.infer<
  typeof updateUserSettingsBodySchema
>;

/**
 * POST /users/:userId/teams - Add a user to a team.
 */
export const addUserToTeamBodySchema = z.object({
  teamId: z.number().int(),
  role: z.enum(TEAM_ROLES),
  notes: z.string().max(USER_NOTES_MAX_LENGTH).optional(),
});

export type AddUserToTeamBody = z.infer<typeof addUserToTeamBodySchema>;

/**
 * PATCH /users/:userId/teams/:teamId - Update a user's role within a team.
 */
export const updateUserTeamRoleBodySchema = z.object({
  role: z.enum(TEAM_ROLES),
  notes: z.string().max(USER_NOTES_MAX_LENGTH).optional(),
});

export type UpdateUserTeamRoleBody = z.infer<
  typeof updateUserTeamRoleBodySchema
>;

/**
 * POST /users/:sourceUserId/transfer-activities - Transfer activities between users.
 *
 * Scope: activities where the source user has an active comms contact row AND
 * `activities.leadTeamId === fromTeamId`. Lead comms are always transferred for
 * every activity in scope/selected; `includeNonLead` controls whether non-lead
 * (contact) comms move with them. When `toTeamId` differs from `fromTeamId`,
 * each affected activity's lead team (and derived ministry/displayId) moves too.
 */
export const transferActivitiesBodySchema = z.object({
  targetUserId: z.number().int(),
  fromTeamId: z.number().int(),
  /** Defaults to `fromTeamId` (same-team transfer) when omitted. */
  toTeamId: z.number().int().optional(),
  /** Omit to operate on every scoped activity for `fromTeamId`. */
  activityIds: z.array(z.number().int()).optional(),
  /** When false, non-lead comms are left in place (or dropped if they become ineligible after a cross-team move). */
  includeNonLead: z.boolean(),
  notes: z.string().max(USER_NOTES_MAX_LENGTH).optional(),
});

export type TransferActivitiesBody = z.infer<
  typeof transferActivitiesBodySchema
>;

/**
 * DELETE /users/:id/teams/:teamId - Remove a user from a team.
 *
 * Optional body: when the user has comms contact rows scoped to this team
 * (`leadTeamId === teamId`), `targetUserId` must be provided to transfer them;
 * the server rejects the removal otherwise. When there are no scoped comms
 * rows, the body may be omitted entirely (silent removal). Regardless of
 * comms, all `activity_flags` for `(assigneeId = user, teamId)` are deleted.
 */
export const removeUserFromTeamBodySchema = z.preprocess(
  (value) => value ?? {},
  z.object({
    targetUserId: z.number().int().optional(),
    /** Defaults to the team being removed when omitted. */
    toTeamId: z.number().int().optional(),
    includeNonLead: z.boolean().optional().default(false),
    notes: z.string().max(USER_NOTES_MAX_LENGTH).optional(),
  })
);

export type RemoveUserFromTeamBody = z.infer<
  typeof removeUserFromTeamBodySchema
>;

// ============================================
// Response Schemas (non-standard shape)
// ============================================

/**
 * POST /users/:id/transfer-activities - Response body.
 */
export const transferActivitiesResponseSchema = z.object({
  success: z.literal(true),
  transferredCount: z.number().int(),
});

export type TransferActivitiesResponse = z.infer<
  typeof transferActivitiesResponseSchema
>;
