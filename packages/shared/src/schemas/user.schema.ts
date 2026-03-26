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
  displayName: z.string().trim().optional(),
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
  notes: z.string().nullable().optional(),
});

export type UpdateUserBody = z.infer<typeof updateUserBodySchema>;

/**
 * POST /users/:userId/teams - Add a user to a team.
 */
export const addUserToTeamBodySchema = z.object({
  teamId: z.number().int(),
  role: z.enum(TEAM_ROLES),
  notes: z.string().optional(),
});

export type AddUserToTeamBody = z.infer<typeof addUserToTeamBodySchema>;

/**
 * PATCH /users/:userId/teams/:teamId - Update a user's role within a team.
 */
export const updateUserTeamRoleBodySchema = z.object({
  role: z.enum(TEAM_ROLES),
  notes: z.string().optional(),
});

export type UpdateUserTeamRoleBody = z.infer<
  typeof updateUserTeamRoleBodySchema
>;

/**
 * POST /users/:sourceUserId/transfer-activities - Transfer activities between users.
 */
export const transferActivitiesBodySchema = z.object({
  targetUserId: z.number().int(),
  activityIds: z.array(z.number().int()).optional(),
  transferCommsLead: z.boolean(),
  transferCommsContact: z.boolean(),
  notes: z.string().optional(),
});

export type TransferActivitiesBody = z.infer<
  typeof transferActivitiesBodySchema
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
