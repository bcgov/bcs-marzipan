import { createZodDto } from 'nestjs-zod';

import {
  createArrayResponseWrapperSchema,
  createResponseWrapperSchema,
  createTeamBodySchema,
  teamDetailSchema,
  teamHistoryEntrySchema,
  teamListItemSchema,
  updateTeamBodySchema,
} from '@corpcal/shared/schemas';

/**
 * Request DTO for POST /teams - Create a new team.
 */
export class CreateTeamDto extends createZodDto(createTeamBodySchema) {}

/**
 * Request DTO for PATCH /teams/:id - Update an existing team.
 */
export class UpdateTeamDto extends createZodDto(updateTeamBodySchema) {}

/**
 * Response DTO for a single team list item.
 */
export class TeamListItemDto extends createZodDto(teamListItemSchema) {}

/**
 * Response DTO for team detail (GET /teams/:id).
 */
export class TeamDetailDto extends createZodDto(teamDetailSchema) {}

/**
 * Response DTO for a single team history entry.
 */
export class TeamHistoryEntryDto extends createZodDto(teamHistoryEntrySchema) {}

/**
 * Wrapped response: { success: true, data: TeamListItem[] }
 */
export class TeamListResponseWrapperDto extends createZodDto(
  createArrayResponseWrapperSchema(teamListItemSchema)
) {}

/**
 * Wrapped response: { success: true, data: TeamDetail }
 * For GET /teams/:id, data may be null when team is not found.
 */
export class TeamDetailResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(teamDetailSchema)
) {}

/**
 * Wrapped response: { success: true, data: TeamHistoryEntry[] }
 */
export class TeamHistoryResponseWrapperDto extends createZodDto(
  createArrayResponseWrapperSchema(teamHistoryEntrySchema)
) {}
