import { createZodDto } from 'nestjs-zod';

import {
  bannerSettingsSchema,
  createResponseWrapperSchema,
  recurringLockoutBannerSettingsSchema,
  upsertBannerSettingsRequestSchema,
  upsertRecurringLockoutBannerSettingsRequestSchema,
} from '@corpcal/shared/schemas';

export class UpsertBannerSettingsDto extends createZodDto(
  upsertBannerSettingsRequestSchema
) {}

export class BannerSettingsDto extends createZodDto(bannerSettingsSchema) {}

export class BannerSettingsResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(bannerSettingsSchema)
) {}

export class BannerSettingsNullableResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(bannerSettingsSchema.nullable())
) {}

export class UpsertRecurringLockoutBannerSettingsDto extends createZodDto(
  upsertRecurringLockoutBannerSettingsRequestSchema
) {}

export class RecurringLockoutBannerSettingsDto extends createZodDto(
  recurringLockoutBannerSettingsSchema
) {}

export class RecurringLockoutBannerSettingsResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(recurringLockoutBannerSettingsSchema)
) {}

export class RecurringLockoutBannerSettingsNullableResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(recurringLockoutBannerSettingsSchema.nullable())
) {}
