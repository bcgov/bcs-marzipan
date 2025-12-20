import type {
  LookupItem,
  CategoryLookupItem,
  TagLookupItem,
  OrganizationLookupItem,
  MinistryLookupItem,
  UserLookupItem,
  PitchStatusLookupItem,
  SchedulingStatusLookupItem,
  ActivityStatusLookupItem,
  CityLookupItem,
  CommsMaterialsLookupItem,
  TranslationLanguageLookupItem,
  GovernmentRepresentativeLookupItem,
} from '../schemas/lookup.schema';

/**
 * Base LookupItemDto
 *
 * Generic DTO for lookup items used in dropdown components.
 * Implements the LookupItem interface for type safety.
 */
export class LookupItemDto implements LookupItem {
  id!: string | number;
  label!: string;
  value!: string | number;

  static from(data: LookupItem): LookupItemDto {
    const dto = new LookupItemDto();
    Object.assign(dto, data);
    return dto;
  }
}

/**
 * CategoryLookupItemDto
 */
export class CategoryLookupItemDto implements CategoryLookupItem {
  id!: string | number;
  label!: string;
  value!: string | number;
  name!: string;
  displayName!: string | null;

  static from(data: CategoryLookupItem): CategoryLookupItemDto {
    const dto = new CategoryLookupItemDto();
    Object.assign(dto, data);
    return dto;
  }
}

/**
 * TagLookupItemDto
 */
export class TagLookupItemDto implements TagLookupItem {
  id!: string | number;
  label!: string;
  value!: string | number;
  key!: string | null;
  displayName!: string | null;

  static from(data: TagLookupItem): TagLookupItemDto {
    const dto = new TagLookupItemDto();
    Object.assign(dto, data);
    return dto;
  }
}

/**
 * OrganizationLookupItemDto
 */
export class OrganizationLookupItemDto implements OrganizationLookupItem {
  id!: string | number;
  label!: string;
  value!: string | number;
  name!: string;
  displayName!: string | null;

  static from(data: OrganizationLookupItem): OrganizationLookupItemDto {
    const dto = new OrganizationLookupItemDto();
    Object.assign(dto, data);
    return dto;
  }
}

/**
 * MinistryLookupItemDto
 */
export class MinistryLookupItemDto implements MinistryLookupItem {
  id!: string | number;
  label!: string;
  value!: string | number;
  displayName!: string | null;
  abbreviation!: string | null;

  static from(data: MinistryLookupItem): MinistryLookupItemDto {
    const dto = new MinistryLookupItemDto();
    Object.assign(dto, data);
    return dto;
  }
}

/**
 * UserLookupItemDto
 */
export class UserLookupItemDto implements UserLookupItem {
  id!: string | number;
  label!: string;
  value!: string | number;
  name!: string;
  email!: string | null;
  username!: string | null;

  static from(data: UserLookupItem): UserLookupItemDto {
    const dto = new UserLookupItemDto();
    Object.assign(dto, data);
    return dto;
  }
}

/**
 * PitchStatusLookupItemDto
 */
export class PitchStatusLookupItemDto implements PitchStatusLookupItem {
  id!: string | number;
  label!: string;
  value!: string | number;
  name!: string;
  displayName!: string | null;

  static from(data: PitchStatusLookupItem): PitchStatusLookupItemDto {
    const dto = new PitchStatusLookupItemDto();
    Object.assign(dto, data);
    return dto;
  }
}

/**
 * SchedulingStatusLookupItemDto
 */
export class SchedulingStatusLookupItemDto implements SchedulingStatusLookupItem {
  id!: string | number;
  label!: string;
  value!: string | number;
  name!: string;
  displayName!: string | null;

  static from(data: SchedulingStatusLookupItem): SchedulingStatusLookupItemDto {
    const dto = new SchedulingStatusLookupItemDto();
    Object.assign(dto, data);
    return dto;
  }
}

/**
 * ActivityStatusLookupItemDto
 */
export class ActivityStatusLookupItemDto implements ActivityStatusLookupItem {
  id!: string | number;
  label!: string;
  value!: string | number;
  name!: string;
  displayName!: string | null;

  static from(data: ActivityStatusLookupItem): ActivityStatusLookupItemDto {
    const dto = new ActivityStatusLookupItemDto();
    Object.assign(dto, data);
    return dto;
  }
}

/**
 * CityLookupItemDto
 */
export class CityLookupItemDto implements CityLookupItem {
  id!: string | number;
  label!: string;
  value!: string | number;
  name!: string;
  displayName!: string | null;
  province!: string | null;

  static from(data: CityLookupItem): CityLookupItemDto {
    const dto = new CityLookupItemDto();
    Object.assign(dto, data);
    return dto;
  }
}

/**
 * CommsMaterialsLookupItemDto
 */
export class CommsMaterialsLookupItemDto implements CommsMaterialsLookupItem {
  id!: string | number;
  label!: string;
  value!: string | number;
  name!: string;
  displayName!: string | null;

  static from(data: CommsMaterialsLookupItem): CommsMaterialsLookupItemDto {
    const dto = new CommsMaterialsLookupItemDto();
    Object.assign(dto, data);
    return dto;
  }
}

/**
 * TranslationLanguageLookupItemDto
 */
export class TranslationLanguageLookupItemDto implements TranslationLanguageLookupItem {
  id!: string | number;
  label!: string;
  value!: string | number;
  name!: string;
  displayName!: string | null;

  static from(
    data: TranslationLanguageLookupItem
  ): TranslationLanguageLookupItemDto {
    const dto = new TranslationLanguageLookupItemDto();
    Object.assign(dto, data);
    return dto;
  }
}

/**
 * GovernmentRepresentativeLookupItemDto
 */
export class GovernmentRepresentativeLookupItemDto implements GovernmentRepresentativeLookupItem {
  id!: string | number;
  label!: string;
  value!: string | number;
  name!: string;
  displayName!: string | null;
  title!: string | null;
  ministryId!: string | null;

  static from(
    data: GovernmentRepresentativeLookupItem
  ): GovernmentRepresentativeLookupItemDto {
    const dto = new GovernmentRepresentativeLookupItemDto();
    Object.assign(dto, data);
    return dto;
  }
}

// Compile-time type checks
// These ensure DTOs match their type definitions
const _lookupItemCheck: LookupItem = {} as LookupItemDto;
const _categoryCheck: CategoryLookupItem = {} as CategoryLookupItemDto;
const _tagCheck: TagLookupItem = {} as TagLookupItemDto;
const _orgCheck: OrganizationLookupItem = {} as OrganizationLookupItemDto;
const _ministryCheck: MinistryLookupItem = {} as MinistryLookupItemDto;
const _userCheck: UserLookupItem = {} as UserLookupItemDto;
const _pitchStatusCheck: PitchStatusLookupItem = {} as PitchStatusLookupItemDto;
const _schedulingStatusCheck: SchedulingStatusLookupItem =
  {} as SchedulingStatusLookupItemDto;
const _activityStatusCheck: ActivityStatusLookupItem =
  {} as ActivityStatusLookupItemDto;
const _cityCheck: CityLookupItem = {} as CityLookupItemDto;
const _commsMaterialsCheck: CommsMaterialsLookupItem =
  {} as CommsMaterialsLookupItemDto;
const _translationCheck: TranslationLanguageLookupItem =
  {} as TranslationLanguageLookupItemDto;
const _govRepCheck: GovernmentRepresentativeLookupItem =
  {} as GovernmentRepresentativeLookupItemDto;

// Silence unused variable warnings
void _lookupItemCheck;
void _categoryCheck;
void _tagCheck;
void _orgCheck;
void _ministryCheck;
void _userCheck;
void _pitchStatusCheck;
void _schedulingStatusCheck;
void _activityStatusCheck;
void _cityCheck;
void _commsMaterialsCheck;
void _translationCheck;
void _govRepCheck;
