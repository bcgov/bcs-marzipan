import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  addUserToTeamBodySchema,
  createArrayResponseWrapperSchema,
  createResponseWrapperSchema,
  createUserBodySchema,
  removeUserFromTeamBodySchema,
  transferActivitiesBodySchema,
  transferActivitiesResponseSchema,
  updateUserBodySchema,
  updateUserSettingsBodySchema,
  updateUserTeamRoleBodySchema,
  userDetailSchema,
  userHistoryEntrySchema,
  userListItemSchema,
} from '@corpcal/shared/schemas';

/**
 * Request DTO for POST /users - Create a new user (admin).
 */
export class CreateUserDto extends createZodDto(createUserBodySchema) {}

/**
 * Request DTO for PATCH /users/:id - Update user role, active status, or notes.
 */
export class UpdateUserDto extends createZodDto(updateUserBodySchema) {}

/**
 * Request DTO for PATCH /users/:id/settings - Update per-user settings (flag colour, etc.)
 */
export class UpdateUserSettingsDto extends createZodDto(
  updateUserSettingsBodySchema
) {}

/**
 * Request DTO for POST /users/:id/teams - Add user to team.
 */
export class AddUserToTeamDto extends createZodDto(addUserToTeamBodySchema) {}

/**
 * Request DTO for PATCH /users/:id/teams/:teamId - Update user role in team.
 */
export class UpdateUserTeamRoleDto extends createZodDto(
  updateUserTeamRoleBodySchema
) {}

/**
 * Request DTO for POST /users/:id/transfer-activities - Transfer activities.
 */
export class TransferActivitiesDto extends createZodDto(
  transferActivitiesBodySchema
) {}

/**
 * Request DTO for DELETE /users/:id/teams/:teamId - Remove user from team.
 * Optional body; see `removeUserFromTeamBodySchema` for defaulting behavior.
 */
export class RemoveUserFromTeamDto extends createZodDto(
  removeUserFromTeamBodySchema
) {}

/**
 * Response DTO for a single user list item.
 */
export class UserListItemDto extends createZodDto(userListItemSchema) {}

/**
 * Response DTO for user detail (GET /users/:id).
 */
export class UserDetailDto extends createZodDto(userDetailSchema) {}

/**
 * Response DTO for a single user history entry.
 */
export class UserHistoryEntryDto extends createZodDto(userHistoryEntrySchema) {}

/**
 * Response DTO for GET /users/:id/transfer-activities result.
 */
export class TransferActivitiesResponseDto extends createZodDto(
  transferActivitiesResponseSchema
) {}

/**
 * Schema for one activity option in GET /users/:id/activities response.
 */
const userActivityOptionSchema = z.object({
  id: z.number().int(),
  label: z.string(),
  value: z.number().int(),
  isLead: z.boolean(),
});

/**
 * Schema for one count item in GET /users/activity-counts response.
 */
const userActivityCountSchema = z.object({
  userId: z.number().int(),
  activityCount: z.number().int().nonnegative(),
});

/**
 * Wrapped response: { success: true, data: UserListItem[] }
 */
export class UserListResponseWrapperDto extends createZodDto(
  createArrayResponseWrapperSchema(userListItemSchema)
) {}

/**
 * Wrapped response: { success: true, data: UserDetail }
 * For GET /users/:id, data may be null when user is not found.
 */
export class UserDetailResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(userDetailSchema)
) {}

/**
 * Wrapped response: { success: true, data: UserHistoryEntry[] }
 */
export class UserHistoryResponseWrapperDto extends createZodDto(
  createArrayResponseWrapperSchema(userHistoryEntrySchema)
) {}

/**
 * Wrapped response: { success: true, data: { id, label, value }[] }
 * For GET /users/:id/activities.
 */
export class UserActivitiesResponseWrapperDto extends createZodDto(
  createArrayResponseWrapperSchema(userActivityOptionSchema)
) {}

/**
 * Wrapped response: { success: true, data: { userId, activityCount }[] }
 * For GET /users/activity-counts.
 */
export class UserActivityCountsResponseWrapperDto extends createZodDto(
  createArrayResponseWrapperSchema(userActivityCountSchema)
) {}
