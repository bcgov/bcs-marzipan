import { createZodDto } from 'nestjs-zod';

import {
  createArrayResponseWrapperSchema,
  createResponseWrapperSchema,
  lookAheadDataResponseSchema,
  reportDataResponseSchema,
  reportResponseSchema,
} from '@corpcal/shared/schemas';

export class ReportListResponseWrapperDto extends createZodDto(
  createArrayResponseWrapperSchema(reportResponseSchema)
) {}

export class ReportDetailResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(reportResponseSchema.nullable())
) {}

export class ReportDataResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(reportDataResponseSchema)
) {}

export class LookAheadDataResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(lookAheadDataResponseSchema)
) {}
