import { z } from 'zod';

/**
 * Team API Schemas
 *
 * Zod schemas for the teams CRUD API contract.
 * Timestamps are ISO strings for JSON serialization.
 * See history.schema.ts for TeamHistoryEntry.
 */

// ============================================
// Response Schemas
// ============================================

/**
 * Team list item returned by GET /teams.
 */
export const teamListItemSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  displayName: z.string().nullable(),
  description: z.string().nullable(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  roleId: z.number().int().nullable(),
  memberCount: z.number().int(),
  ministryCount: z.number().int(),
});

export type TeamListItem = z.infer<typeof teamListItemSchema>;

/**
 * Team ministry membership.
 * ministryId matches ministries.id (serial integer); consistent with other lookup IDs in the API.
 */
export const teamMinistrySchema = z.object({
  ministryId: z.number().int(),
  ministryName: z.string(),
});

export type TeamMinistry = z.infer<typeof teamMinistrySchema>;

/**
 * Team member.
 */
export const teamMemberSchema = z.object({
  userId: z.number().int(),
  userName: z.string(),
  role: z.string(),
});

export type TeamMember = z.infer<typeof teamMemberSchema>;

/**
 * Team detail returned by GET /teams/:id.
 * Extends TeamListItem with ministries and members.
 */
export const teamDetailSchema = teamListItemSchema.extend({
  ministries: z.array(teamMinistrySchema),
  members: z.array(teamMemberSchema),
});

export type TeamDetail = z.infer<typeof teamDetailSchema>;

// ============================================
// Request Body Schemas
// ============================================

/**
 * POST /teams - Create a new team.
 */
export const createTeamBodySchema = z.object({
  name: z.string().min(1).max(255),
  displayName: z.string().max(255).optional(),
  description: z.string().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  roleId: z.number().int().nullable().optional(),
  ministryIds: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export type CreateTeamBody = z.infer<typeof createTeamBodySchema>;

/**
 * PATCH /teams/:id - Update an existing team.
 */
export const updateTeamBodySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  displayName: z.string().max(255).optional(),
  description: z.string().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  roleId: z.number().int().nullable().optional(),
  ministryIds: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export type UpdateTeamBody = z.infer<typeof updateTeamBodySchema>;
