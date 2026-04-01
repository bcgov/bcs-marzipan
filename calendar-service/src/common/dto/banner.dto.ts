import { createZodDto } from 'nestjs-zod';

import {
  bannerSettingsSchema,
  createResponseWrapperSchema,
  upsertBannerSettingsRequestSchema,
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
