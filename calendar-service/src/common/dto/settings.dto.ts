import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  activityCompletionBatchRunResultSchema,
  activityCompletionPreviewSchema,
  activityCompletionSettingsSchema,
  activityInfoIconSettingsSchema,
  activityReminderBatchRunResultSchema,
  activityReminderPreviewSchema,
  activityReminderSettingsSchema,
  createResponseWrapperSchema,
  lookAheadResetBatchRunResultSchema,
  lookAheadResetManualRunBodySchema,
  lookAheadResetRollbackResultSchema,
  lookAheadResetRunPreviewResultSchema,
  lookAheadResetSettingsPatchSchema,
  lookAheadResetSettingsSchema,
  reportCoverContactSettingsSchema,
  reviewExemptFieldKeysSettingsSchema,
} from '@corpcal/shared/schemas';

export class ActivityCompletionSettingsDto extends createZodDto(
  activityCompletionSettingsSchema
) {}

export class ActivityCompletionSettingsResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(activityCompletionSettingsSchema)
) {}

export class ActivityCompletionPreviewResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(activityCompletionPreviewSchema)
) {}

export class ActivityCompletionBatchRunResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(activityCompletionBatchRunResultSchema)
) {}

export class ActivityInfoIconSettingsDto extends createZodDto(
  activityInfoIconSettingsSchema
) {}

export class ActivityInfoIconSettingsResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(activityInfoIconSettingsSchema)
) {}

export class ActivityReminderSettingsDto extends createZodDto(
  activityReminderSettingsSchema
) {}

export class ActivityReminderSettingsResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(activityReminderSettingsSchema)
) {}

export class ActivityReminderPreviewResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(activityReminderPreviewSchema)
) {}

export class ActivityReminderBatchRunResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(activityReminderBatchRunResultSchema)
) {}

export class ReviewExemptFieldKeysSettingsDto extends createZodDto(
  reviewExemptFieldKeysSettingsSchema
) {}

export class ReviewExemptFieldKeysSettingsResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(reviewExemptFieldKeysSettingsSchema)
) {}

export class ReportCoverContactSettingsDto extends createZodDto(
  reportCoverContactSettingsSchema
) {}

export class ReportCoverContactSettingsResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(reportCoverContactSettingsSchema)
) {}

export class LookAheadResetSettingsResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(lookAheadResetSettingsSchema)
) {}

export class LookAheadResetSettingsPatchDto extends createZodDto(
  lookAheadResetSettingsPatchSchema
) {}

export class LookAheadResetRunPreviewResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(lookAheadResetRunPreviewResultSchema)
) {}

export class LookAheadResetManualRunBodyDto extends createZodDto(
  lookAheadResetManualRunBodySchema
) {}

export class LookAheadResetBatchRunResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(lookAheadResetBatchRunResultSchema)
) {}

export class LookAheadResetRollbackResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(lookAheadResetRollbackResultSchema)
) {}

const successOnlySchema = z.object({
  success: z.literal(true),
});

export class SuccessResponseDto extends createZodDto(successOnlySchema) {}
