import { createZodDto } from 'nestjs-zod';

import {
  activityHistoryEntrySchema,
  createArrayResponseWrapperSchema,
  createResponseWrapperSchema,
  globalActivityHistoryPageSchema,
} from '@corpcal/shared/schemas';

/**
 * Wrapped response: { success: true, data: ActivityHistoryEntry[] }
 * For GET /activities/:id/history.
 */
export class ActivityHistoryResponseWrapperDto extends createZodDto(
  createArrayResponseWrapperSchema(activityHistoryEntrySchema)
) {}

/**
 * Wrapped response: { success: true, data: ActivityHistoryEntry }
 * For POST /activities/:id/history/notes.
 */
export class ActivityHistoryEntryResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(activityHistoryEntrySchema)
) {}

/**
 * Wrapped response: { success: true, data: GlobalActivityHistoryPage }
 * For GET /activities/global-history.
 */
export class GlobalActivityHistoryPageResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(globalActivityHistoryPageSchema)
) {}
