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
export type {
  ActivityListItem,
  ReportActivityRow,
} from '../schemas/activity-list-item.schema';
export type {
  ActivityFlagResponse,
  UpsertActivityFlagRequest,
  UpsertActivityFlagsRequest,
} from '../schemas/activity-flag.schema';
export type {
  BannerSettings,
  RecurringLockoutBannerSettings,
  UpsertRecurringLockoutBannerSettingsBody,
  UpsertBannerSettingsBody,
} from '../schemas/banner.schema';
export type {
  ActivityInfoIconSettings,
  ActivityInfoIconSetting,
} from '../schemas/activity-info-icon-settings.schema';
export type {
  LoginModalSettings,
  UpsertLoginModalSettingsBody,
} from '../schemas/login-modal.schema';

// Query params types - re-exported from query-params schema
export type { LookupQueryParams } from '../schemas/query-params.schema';

// History types - shared across activity, user, and team history
export type {
  HistoryChange,
  ActivityHistoryEntry,
  GlobalActivityHistoryEntry,
  UserHistoryEntry,
  TeamHistoryEntry,
} from '../schemas/history.schema';

// User CRUD API types
export type {
  UserTeam,
  UserListItem,
  UserDetail,
  RoleOption,
  CreateUserBody,
  UpdateUserBody,
  UpdateUserSettingsBody,
  AddUserToTeamBody,
  UpdateUserTeamRoleBody,
  TransferActivitiesBody,
} from '../schemas/user.schema';

// Team CRUD API types
export type {
  TeamListItem,
  TeamMember,
  TeamDetail,
  CommsContactCandidate,
  CreateTeamBody,
  UpdateTeamBody,
} from '../schemas/team.schema';

// Ministry groups (activity "Shared with" shortcuts + group CRUD)
export type {
  ActivityTeamSharingResponse,
  ActivityTeamSharingQuickShare,
  MinistryQuickShareGroupResponse,
  MinistryGroupResponse,
  CreateMinistryGroupRequest,
  UpdateMinistryGroupRequest,
} from '../schemas/ministry-groups.schema';

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
  VenueStatusLookupItem,
  PitchRequiredStatusLookupItem,
  TranslationRequiredStatusLookupItem,
  VenuePresetItem,
} from '../schemas/lookup.schema';

export type {
  ReportDataMeta,
  ReportDataResponse,
  ReportSectionData,
} from './report-data';
