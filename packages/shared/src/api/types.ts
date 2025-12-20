/**
 * API Response Types
 * These types represent the API contract, decoupled from the database schema.
 *
 * IMPORTANT: These types are inferred from Zod schemas (single source of truth).
 * Do not manually define these types - always use the inferred types from schemas.
 *
 * Dates are ISO strings (string | null) for JSON serialization.
 * Frontend should import from '@bcs-marzipan/shared/api/types' or '@bcs-marzipan/shared/api'.
 */

// Re-export types from Zod schemas (single source of truth)
export type {
  ActivityResponse,
  PaginatedActivityResponse,
} from '../schemas/activity-response.schema';

// Lookup types - re-exported from lookup schema
export type {
  LookupItem,
  ExtendedLookupItem,
  LookupQueryParams,
  CategoryResponse,
  CategoryLookupItem,
  TagResponse,
  TagLookupItem,
  OrganizationResponse,
  OrganizationLookupItem,
  MinistryResponse,
  MinistryLookupItem,
  SystemUserResponse,
  UserLookupItem,
  PitchStatusResponse,
  PitchStatusLookupItem,
  SchedulingStatusResponse,
  SchedulingStatusLookupItem,
  ActivityStatusResponse,
  ActivityStatusLookupItem,
  CityResponse,
  CityLookupItem,
  CommsMaterialsResponse,
  CommsMaterialsLookupItem,
  TranslationLanguageResponse,
  TranslationLanguageLookupItem,
  GovernmentRepresentativeResponse,
  GovernmentRepresentativeLookupItem,
} from '../schemas/lookup.schema';

/**
 * Paginated Response Type
 * Generic type for paginated API responses.
 * Use this for other endpoints that return paginated data.
 */
export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
