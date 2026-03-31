import { createZodDto } from 'nestjs-zod';

import {
  createSavedFilterBodySchema,
  duplicateSavedFilterBodySchema,
  savedFilterListResponseSchema,
  savedFilterResponseSchema,
  setMyDefaultSavedFilterBodySchema,
  updateSavedFilterBodySchema,
} from './saved-filter.schema';

export class CreateSavedFilterDto extends createZodDto(
  createSavedFilterBodySchema
) {}

export class UpdateSavedFilterDto extends createZodDto(
  updateSavedFilterBodySchema
) {}

export class DuplicateSavedFilterDto extends createZodDto(
  duplicateSavedFilterBodySchema
) {}

export class SavedFilterResponseDto extends createZodDto(
  savedFilterResponseSchema
) {}

export class SavedFilterListResponseDto extends createZodDto(
  savedFilterListResponseSchema
) {}

export class SetMyDefaultSavedFilterDto extends createZodDto(
  setMyDefaultSavedFilterBodySchema
) {}
