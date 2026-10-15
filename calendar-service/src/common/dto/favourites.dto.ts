import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  activityFavouritesDataSchema,
  createResponseWrapperSchema,
} from '@corpcal/shared/schemas';

export class ActivityFavouritesResponseWrapperDto extends createZodDto(
  createResponseWrapperSchema(activityFavouritesDataSchema)
) {}

export class SuccessOnlyResponseDto extends createZodDto(
  z.object({ success: z.literal(true) })
) {}
