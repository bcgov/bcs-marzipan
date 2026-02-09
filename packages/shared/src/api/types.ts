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
export type { ActivityResponse } from '../schemas/activity-response.schema';

// Query params types - re-exported from query-params schema
export type { LookupQueryParams } from '../schemas/query-params.schema';

// Lookup types - re-exported from lookup schema
export type {
  LookupItem,
  ExtendedLookupItem,
  CategoryResponse,
  CategoryLookupItem,
  TagResponse,
  TagLookupItem,
  OrganizationResponse,
  OrganizationLookupItem,
  MinistryResponse,
  MinistryLookupItem,
  UserResponse,
  UserLookupItem,
  PitchStatusResponse,
  PitchStatusLookupItem,
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
  ThemeResponse,
  ThemeLookupItem,
  ReportResponse,
} from '../schemas/lookup.schema';
