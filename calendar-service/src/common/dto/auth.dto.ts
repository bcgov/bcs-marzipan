import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** GET /auth/local/config */
const localAuthConfigSchema = z.object({
  enabled: z.boolean(),
  mockEnabled: z.boolean(),
});

export class LocalAuthConfigResponseDto extends createZodDto(
  localAuthConfigSchema
) {}
