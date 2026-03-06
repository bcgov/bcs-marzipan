/**
 * API Response Types
 * These types represent the API contract, decoupled from the database schema.
 *
 * IMPORTANT: These types are inferred from Zod schemas (single source of truth).
 * Do not manually define these types - always use the inferred types from schemas.
 *
 * Dates are ISO strings (string | null) for JSON serialization.
 * Frontend should import from '@corpcal/shared/api/types' or '@corpcal/shared/api'.
 */

// Re-export types from Zod schemas (single source of truth)
export type { ActivityResponse } from '../schemas/activity-response.schema';

// Query params types - re-exported from query-params schema
export type { LookupQueryParams } from '../schemas/query-params.schema';

// History types - shared across activity, user, and team history
export type {
  HistoryChange,
  ActivityHistoryEntry,
  UserHistoryEntry,
  TeamHistoryEntry,
} from '../schemas/history.schema';

// User CRUD API types
export type {
  UserTeam,
  UserListItem,
  UserDetail,
  RoleOption,
  UpdateUserBody,
  AddUserToTeamBody,
  UpdateUserTeamRoleBody,
  TransferActivitiesBody,
} from '../schemas/user.schema';

// Team CRUD API types
export type {
  TeamListItem,
  TeamMember,
  TeamDetail,
  CreateTeamBody,
  UpdateTeamBody,
} from '../schemas/team.schema';

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
  DateStatusLookupItem,
  TimeStatusLookupItem,
  PitchRequiredStatusLookupItem,
  TranslationRequiredStatusLookupItem,
  VenueQuickPickItem,
} from '../schemas/lookup.schema';
