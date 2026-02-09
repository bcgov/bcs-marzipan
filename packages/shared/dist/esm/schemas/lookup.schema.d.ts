import { z } from 'zod';
/**
 * Lookup Response Schemas
 *
 * These schemas use pure Zod to define API response types for lookup tables.
 * Each lookup type has its own schema for full type safety while also
 * providing a common LookupItem interface for generic dropdown components.
 *
 * Fields are defined explicitly to match the database schema with API-appropriate
 * types. See validate-types.ts for compile-time verification that fields align
 * with database types.
 */
/**
 * Generic lookup item schema for dropdown components
 * All lookup endpoints return data in this format for UI consistency
 *
 * Note: For serial IDs (auto-increment), id and value are numbers.
 * For UUID IDs (organizations, ministries), these are strings.
 */
export declare const lookupItemSchema: z.ZodObject<{
    id: z.ZodNumber;
    label: z.ZodString;
    value: z.ZodNumber;
}, z.core.$strip>;
/**
 * Extended lookup item with optional additional fields
 * Used when lookups need extra metadata beyond the basic dropdown format
 */
export declare const extendedLookupItemSchema: z.ZodObject<{
    id: z.ZodNumber;
    label: z.ZodString;
    value: z.ZodNumber;
    name: z.ZodOptional<z.ZodString>;
    displayName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
/**
 * Category Response Schema
 * Fields from the categories table exposed via API
 */
export declare const categoryResponseSchema: z.ZodObject<{
    id: z.ZodNumber;
    name: z.ZodString;
    displayName: z.ZodNullable<z.ZodString>;
    sortOrder: z.ZodNumber;
    isActive: z.ZodBoolean;
    description: z.ZodNullable<z.ZodString>;
    allowsPitch: z.ZodBoolean;
    visibility: z.ZodEnum<{
        global: "global";
        team: "team";
    }>;
}, z.core.$strip>;
export declare const categoryLookupItemSchema: z.ZodObject<{
    id: z.ZodNumber;
    label: z.ZodString;
    value: z.ZodNumber;
    name: z.ZodString;
    displayName: z.ZodNullable<z.ZodString>;
    sortOrder: z.ZodNumber;
    isActive: z.ZodBoolean;
    allowsPitch: z.ZodBoolean;
}, z.core.$strip>;
/**
 * Tag Response Schema
 * Fields from the tags table exposed via API
 * Tags renamed from keywords table. All tags are currently global (visibility='global').
 * Team visibility is a future feature flag.
 */
export declare const tagResponseSchema: z.ZodObject<{
    id: z.ZodNumber;
    name: z.ZodString;
    displayName: z.ZodNullable<z.ZodString>;
    sortOrder: z.ZodNumber;
    visibility: z.ZodEnum<{
        global: "global";
        team: "team";
    }>;
    isActive: z.ZodBoolean;
    description: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export declare const tagLookupItemSchema: z.ZodObject<{
    id: z.ZodNumber;
    label: z.ZodString;
    value: z.ZodNumber;
    name: z.ZodString;
    displayName: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
/**
 * Organization Response Schema
 * Fields from the organizations table exposed via API
 */
export declare const organizationResponseSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    displayName: z.ZodNullable<z.ZodString>;
    organizationType: z.ZodNullable<z.ZodString>;
    ministryId: z.ZodNullable<z.ZodString>;
    isActive: z.ZodBoolean;
    sortOrder: z.ZodNumber;
    description: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export declare const organizationLookupItemSchema: z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    value: z.ZodString;
    name: z.ZodString;
    displayName: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
/**
 * Ministry Response Schema
 * Fields from the ministries table exposed via API
 */
export declare const ministryResponseSchema: z.ZodObject<{
    id: z.ZodString;
    displayName: z.ZodNullable<z.ZodString>;
    abbreviation: z.ZodNullable<z.ZodString>;
    sortOrder: z.ZodNumber;
    isActive: z.ZodBoolean;
    ministerName: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export declare const ministryLookupItemSchema: z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    value: z.ZodString;
    displayName: z.ZodNullable<z.ZodString>;
    abbreviation: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
/**
 * User Response Schema
 * Fields from the users table exposed via API
 */
export declare const userResponseSchema: z.ZodObject<{
    id: z.ZodNumber;
    adUsername: z.ZodNullable<z.ZodString>;
    adDisplayName: z.ZodNullable<z.ZodString>;
    adEmail: z.ZodNullable<z.ZodString>;
    isActive: z.ZodBoolean;
    role: z.ZodString;
}, z.core.$strip>;
export declare const userLookupItemSchema: z.ZodObject<{
    id: z.ZodNumber;
    label: z.ZodString;
    value: z.ZodNumber;
    name: z.ZodString;
    email: z.ZodNullable<z.ZodString>;
    username: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
/**
 * Pitch Status Response Schema
 * Fields from the pitch_statuses table exposed via API
 */
export declare const pitchStatusResponseSchema: z.ZodObject<{
    id: z.ZodNumber;
    name: z.ZodString;
    displayName: z.ZodNullable<z.ZodString>;
    sortOrder: z.ZodNumber;
    isActive: z.ZodBoolean;
    description: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export declare const pitchStatusLookupItemSchema: z.ZodObject<{
    id: z.ZodNumber;
    label: z.ZodString;
    value: z.ZodNumber;
    name: z.ZodString;
    displayName: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
/**
 * Activity Status Response Schema
 * Fields from the activity_statuses table exposed via API
 */
export declare const activityStatusResponseSchema: z.ZodObject<{
    id: z.ZodNumber;
    name: z.ZodString;
    displayName: z.ZodNullable<z.ZodString>;
    sortOrder: z.ZodNumber;
    isActive: z.ZodBoolean;
    description: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export declare const activityStatusLookupItemSchema: z.ZodObject<{
    id: z.ZodNumber;
    label: z.ZodString;
    value: z.ZodNumber;
    name: z.ZodString;
    displayName: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
/**
 * Date Status Response Schema
 * Fields from the date_statuses table exposed via API
 */
export declare const dateStatusResponseSchema: z.ZodObject<{
    id: z.ZodNumber;
    name: z.ZodString;
    displayName: z.ZodNullable<z.ZodString>;
    sortOrder: z.ZodNumber;
    isActive: z.ZodBoolean;
    description: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export declare const dateStatusLookupItemSchema: z.ZodObject<{
    id: z.ZodNumber;
    label: z.ZodString;
    value: z.ZodNumber;
    name: z.ZodString;
    displayName: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
/**
 * Time Status Response Schema
 * Fields from the time_statuses table exposed via API
 */
export declare const timeStatusResponseSchema: z.ZodObject<{
    id: z.ZodNumber;
    name: z.ZodString;
    displayName: z.ZodNullable<z.ZodString>;
    sortOrder: z.ZodNumber;
    isActive: z.ZodBoolean;
    description: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export declare const timeStatusLookupItemSchema: z.ZodObject<{
    id: z.ZodNumber;
    label: z.ZodString;
    value: z.ZodNumber;
    name: z.ZodString;
    displayName: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
/**
 * Venue Status Response Schema
 * Fields from the venue_statuses table exposed via API
 */
export declare const venueStatusResponseSchema: z.ZodObject<{
    id: z.ZodNumber;
    name: z.ZodString;
    displayName: z.ZodNullable<z.ZodString>;
    sortOrder: z.ZodNumber;
    isActive: z.ZodBoolean;
    description: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export declare const venueStatusLookupItemSchema: z.ZodObject<{
    id: z.ZodNumber;
    label: z.ZodString;
    value: z.ZodNumber;
    name: z.ZodString;
    displayName: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
/**
 * City Response Schema
 * Fields from the cities table exposed via API
 */
export declare const cityResponseSchema: z.ZodObject<{
    id: z.ZodNumber;
    name: z.ZodString;
    displayName: z.ZodNullable<z.ZodString>;
    sortOrder: z.ZodNumber;
    isActive: z.ZodBoolean;
    province: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export declare const cityLookupItemSchema: z.ZodObject<{
    id: z.ZodNumber;
    label: z.ZodString;
    value: z.ZodNumber;
    name: z.ZodString;
    displayName: z.ZodNullable<z.ZodString>;
    province: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
/**
 * Comms Materials Response Schema
 * Fields from the comms_materials table exposed via API
 */
export declare const commsMaterialsResponseSchema: z.ZodObject<{
    id: z.ZodNumber;
    name: z.ZodString;
    displayName: z.ZodNullable<z.ZodString>;
    sortOrder: z.ZodNumber;
    isActive: z.ZodBoolean;
    description: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export declare const commsMaterialsLookupItemSchema: z.ZodObject<{
    id: z.ZodNumber;
    label: z.ZodString;
    value: z.ZodNumber;
    name: z.ZodString;
    displayName: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
/**
 * Translation Language Response Schema
 * Fields from the translated_languages table exposed via API
 */
export declare const translationLanguageResponseSchema: z.ZodObject<{
    id: z.ZodNumber;
    name: z.ZodString;
    displayName: z.ZodNullable<z.ZodString>;
    sortOrder: z.ZodNumber;
    isActive: z.ZodBoolean;
    description: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export declare const translationLanguageLookupItemSchema: z.ZodObject<{
    id: z.ZodNumber;
    label: z.ZodString;
    value: z.ZodNumber;
    name: z.ZodString;
    displayName: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
/**
 * Government Representative Response Schema
 * Fields from the government_representatives table exposed via API
 */
export declare const governmentRepresentativeResponseSchema: z.ZodObject<{
    id: z.ZodNumber;
    name: z.ZodString;
    displayName: z.ZodNullable<z.ZodString>;
    sortOrder: z.ZodNumber;
    isActive: z.ZodBoolean;
    title: z.ZodNullable<z.ZodString>;
    email: z.ZodNullable<z.ZodString>;
    ministryId: z.ZodNullable<z.ZodString>;
    representativeType: z.ZodNullable<z.ZodEnum<{
        premier: "premier";
        minister: "minister";
        cabinet_member: "cabinet_member";
        mla: "mla";
        other: "other";
    }>>;
}, z.core.$strip>;
export declare const governmentRepresentativeLookupItemSchema: z.ZodObject<{
    id: z.ZodNumber;
    label: z.ZodString;
    value: z.ZodNumber;
    name: z.ZodString;
    displayName: z.ZodNullable<z.ZodString>;
    title: z.ZodNullable<z.ZodString>;
    ministryId: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
/**
 * Report Response Schema
 * Fields from the reports table exposed via API
 */
export declare const reportResponseSchema: z.ZodObject<{
    id: z.ZodNumber;
    name: z.ZodString;
    displayName: z.ZodString;
    sortOrder: z.ZodNumber;
    isActive: z.ZodBoolean;
    visibility: z.ZodEnum<{
        global: "global";
        team: "team";
    }>;
    config: z.ZodNullable<z.ZodObject<{
        fields: z.ZodArray<z.ZodString>;
        globalFilter: z.ZodOptional<z.ZodObject<{
            status: z.ZodOptional<z.ZodArray<z.ZodString>>;
            category: z.ZodOptional<z.ZodArray<z.ZodString>>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
            dateRange: z.ZodOptional<z.ZodObject<{
                start: z.ZodString;
                end: z.ZodString;
            }, z.core.$strip>>;
            lookAheadSection: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        sections: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            order: z.ZodNumber;
            filter: z.ZodOptional<z.ZodObject<{
                status: z.ZodOptional<z.ZodArray<z.ZodString>>;
                category: z.ZodOptional<z.ZodArray<z.ZodString>>;
                tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
                dateRange: z.ZodOptional<z.ZodObject<{
                    start: z.ZodString;
                    end: z.ZodString;
                }, z.core.$strip>>;
                lookAheadSection: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    description: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
/**
 * Theme Response Schema
 * Fields from the themes table exposed via API
 */
export declare const themeResponseSchema: z.ZodObject<{
    id: z.ZodString;
    key: z.ZodNullable<z.ZodString>;
    name: z.ZodString;
    displayName: z.ZodNullable<z.ZodString>;
    sortOrder: z.ZodNumber;
    isActive: z.ZodBoolean;
}, z.core.$strip>;
export declare const themeLookupItemSchema: z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    value: z.ZodString;
    key: z.ZodNullable<z.ZodString>;
    displayName: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export type LookupItem = z.infer<typeof lookupItemSchema>;
export type ExtendedLookupItem = z.infer<typeof extendedLookupItemSchema>;
export type CategoryResponse = z.infer<typeof categoryResponseSchema>;
export type CategoryLookupItem = z.infer<typeof categoryLookupItemSchema>;
export type TagResponse = z.infer<typeof tagResponseSchema>;
export type TagLookupItem = z.infer<typeof tagLookupItemSchema>;
export type OrganizationResponse = z.infer<typeof organizationResponseSchema>;
export type OrganizationLookupItem = z.infer<typeof organizationLookupItemSchema>;
export type MinistryResponse = z.infer<typeof ministryResponseSchema>;
export type MinistryLookupItem = z.infer<typeof ministryLookupItemSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
export type UserLookupItem = z.infer<typeof userLookupItemSchema>;
export type PitchStatusResponse = z.infer<typeof pitchStatusResponseSchema>;
export type PitchStatusLookupItem = z.infer<typeof pitchStatusLookupItemSchema>;
export type ActivityStatusResponse = z.infer<typeof activityStatusResponseSchema>;
export type ActivityStatusLookupItem = z.infer<typeof activityStatusLookupItemSchema>;
export type DateStatusResponse = z.infer<typeof dateStatusResponseSchema>;
export type DateStatusLookupItem = z.infer<typeof dateStatusLookupItemSchema>;
export type TimeStatusResponse = z.infer<typeof timeStatusResponseSchema>;
export type TimeStatusLookupItem = z.infer<typeof timeStatusLookupItemSchema>;
export type VenueStatusResponse = z.infer<typeof venueStatusResponseSchema>;
export type VenueStatusLookupItem = z.infer<typeof venueStatusLookupItemSchema>;
export type CityResponse = z.infer<typeof cityResponseSchema>;
export type CityLookupItem = z.infer<typeof cityLookupItemSchema>;
export type CommsMaterialsResponse = z.infer<typeof commsMaterialsResponseSchema>;
export type CommsMaterialsLookupItem = z.infer<typeof commsMaterialsLookupItemSchema>;
export type TranslationLanguageResponse = z.infer<typeof translationLanguageResponseSchema>;
export type TranslationLanguageLookupItem = z.infer<typeof translationLanguageLookupItemSchema>;
export type GovernmentRepresentativeResponse = z.infer<typeof governmentRepresentativeResponseSchema>;
export type GovernmentRepresentativeLookupItem = z.infer<typeof governmentRepresentativeLookupItemSchema>;
export type ThemeResponse = z.infer<typeof themeResponseSchema>;
export type ThemeLookupItem = z.infer<typeof themeLookupItemSchema>;
export type ReportResponse = z.infer<typeof reportResponseSchema>;
/**
 * Create Category Request Schema
 * Fields required for creating a new category
 */
export declare const createCategoryRequestSchema: z.ZodObject<{
    name: z.ZodString;
    displayName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    sortOrder: z.ZodNumber;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    visibility: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        global: "global";
        team: "team";
    }>>>;
    allowsPitch: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
/**
 * Update Category Request Schema
 * All fields optional for partial updates
 */
export declare const updateCategoryRequestSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    displayName: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodOptional<z.ZodDefault<z.ZodBoolean>>>;
    visibility: z.ZodOptional<z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        global: "global";
        team: "team";
    }>>>>;
    allowsPitch: z.ZodOptional<z.ZodOptional<z.ZodDefault<z.ZodBoolean>>>;
    description: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
}, z.core.$strip>;
/**
 * Create Tag Request Schema
 */
export declare const createTagRequestSchema: z.ZodObject<{
    name: z.ZodString;
    displayName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    sortOrder: z.ZodNumber;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    visibility: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        global: "global";
        team: "team";
    }>>>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
/**
 * Update Tag Request Schema
 */
export declare const updateTagRequestSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    displayName: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodOptional<z.ZodDefault<z.ZodBoolean>>>;
    visibility: z.ZodOptional<z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        global: "global";
        team: "team";
    }>>>>;
    description: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
}, z.core.$strip>;
/**
 * Create City Request Schema
 */
export declare const createCityRequestSchema: z.ZodObject<{
    name: z.ZodString;
    displayName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    province: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    sortOrder: z.ZodNumber;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, z.core.$strip>;
/**
 * Update City Request Schema
 */
export declare const updateCityRequestSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    displayName: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    province: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodOptional<z.ZodDefault<z.ZodBoolean>>>;
}, z.core.$strip>;
/**
 * Create Ministry Request Schema
 */
export declare const createMinistryRequestSchema: z.ZodObject<{
    displayName: z.ZodString;
    abbreviation: z.ZodString;
    ministerName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    sortOrder: z.ZodNumber;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, z.core.$strip>;
/**
 * Update Ministry Request Schema
 */
export declare const updateMinistryRequestSchema: z.ZodObject<{
    displayName: z.ZodOptional<z.ZodString>;
    abbreviation: z.ZodOptional<z.ZodString>;
    ministerName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
/**
 * Create Comms Material Request Schema
 */
export declare const createCommsMaterialRequestSchema: z.ZodObject<{
    name: z.ZodString;
    displayName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    sortOrder: z.ZodNumber;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
/**
 * Update Comms Material Request Schema
 */
export declare const updateCommsMaterialRequestSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    displayName: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodOptional<z.ZodDefault<z.ZodBoolean>>>;
    description: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
}, z.core.$strip>;
/**
 * Create Government Representative Request Schema
 */
export declare const createGovernmentRepresentativeRequestSchema: z.ZodObject<{
    name: z.ZodString;
    displayName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    sortOrder: z.ZodNumber;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    ministryId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    representativeType: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        premier: "premier";
        minister: "minister";
        cabinet_member: "cabinet_member";
        mla: "mla";
        other: "other";
    }>>>;
}, z.core.$strip>;
/**
 * Update Government Representative Request Schema
 */
export declare const updateGovernmentRepresentativeRequestSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    displayName: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    title: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodOptional<z.ZodDefault<z.ZodBoolean>>>;
    ministryId: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    representativeType: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        premier: "premier";
        minister: "minister";
        cabinet_member: "cabinet_member";
        mla: "mla";
        other: "other";
    }>>>>;
}, z.core.$strip>;
/**
 * Create Theme Request Schema
 */
export declare const createThemeRequestSchema: z.ZodObject<{
    key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    name: z.ZodString;
    displayName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    sortOrder: z.ZodNumber;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, z.core.$strip>;
/**
 * Update Theme Request Schema
 */
export declare const updateThemeRequestSchema: z.ZodObject<{
    key: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    name: z.ZodOptional<z.ZodString>;
    displayName: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodOptional<z.ZodDefault<z.ZodBoolean>>>;
}, z.core.$strip>;
/**
 * Create Activity Status Request Schema
 */
export declare const createActivityStatusRequestSchema: z.ZodObject<{
    name: z.ZodString;
    displayName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    sortOrder: z.ZodNumber;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
/**
 * Update Activity Status Request Schema
 */
export declare const updateActivityStatusRequestSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    displayName: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodOptional<z.ZodDefault<z.ZodBoolean>>>;
    description: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
}, z.core.$strip>;
export type CreateCategoryRequest = z.infer<typeof createCategoryRequestSchema>;
export type UpdateCategoryRequest = z.infer<typeof updateCategoryRequestSchema>;
export type CreateTagRequest = z.infer<typeof createTagRequestSchema>;
export type UpdateTagRequest = z.infer<typeof updateTagRequestSchema>;
export type CreateCityRequest = z.infer<typeof createCityRequestSchema>;
export type UpdateCityRequest = z.infer<typeof updateCityRequestSchema>;
export type CreateMinistryRequest = z.infer<typeof createMinistryRequestSchema>;
export type UpdateMinistryRequest = z.infer<typeof updateMinistryRequestSchema>;
export type CreateCommsMaterialRequest = z.infer<typeof createCommsMaterialRequestSchema>;
export type UpdateCommsMaterialRequest = z.infer<typeof updateCommsMaterialRequestSchema>;
export type CreateGovernmentRepresentativeRequest = z.infer<typeof createGovernmentRepresentativeRequestSchema>;
export type UpdateGovernmentRepresentativeRequest = z.infer<typeof updateGovernmentRepresentativeRequestSchema>;
export type CreateThemeRequest = z.infer<typeof createThemeRequestSchema>;
export type UpdateThemeRequest = z.infer<typeof updateThemeRequestSchema>;
export type CreateActivityStatusRequest = z.infer<typeof createActivityStatusRequestSchema>;
export type UpdateActivityStatusRequest = z.infer<typeof updateActivityStatusRequestSchema>;
//# sourceMappingURL=lookup.schema.d.ts.map