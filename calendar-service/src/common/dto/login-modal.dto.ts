import { createZodDto } from 'nestjs-zod';

import {
  createResponseWrapperSchema,
  loginModalSettingsSchema,
  upsertLoginModalSettingsRequestSchema,
} from '@corpcal/shared/schemas';

export class UpsertLoginModalSettingsDto extends createZodDto(
  upsertLoginModalSettingsRequestSchema
) {}

export class LoginModalSettingsDto extends createZodDto(
  loginModalSettingsSchema
) {}

export class LoginModalSettingsResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(loginModalSettingsSchema)
) {}

export class LoginModalSettingsNullableResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(loginModalSettingsSchema.nullable())
) {}
