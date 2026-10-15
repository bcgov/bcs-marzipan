import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { createResponseWrapperSchema } from '@corpcal/shared/schemas';

/** GET /auth/local/config — `data` payload */
const localAuthConfigSchema = z.object({
  enabled: z.boolean(),
  mockEnabled: z.boolean(),
});

export class LocalAuthConfigResponseDto extends createZodDto(
  localAuthConfigSchema
) {}

export class LocalAuthConfigResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(localAuthConfigSchema)
) {}

/** GET /auth/azure/config — `data` payload */
const azureAuthConfigSchema = z.object({
  enabled: z.boolean(),
});

export class AzureAuthConfigResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(azureAuthConfigSchema)
) {}
