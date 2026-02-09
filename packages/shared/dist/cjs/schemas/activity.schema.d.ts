import { z } from 'zod';
/**
 * Activity Zod Schemas
 *
 * These schemas are source of truth for and define API request/response contracts.
 * The database schema (Drizzle) is the source of truth for DB types.
 * Compile-time checks in schema-helpers.ts ensure alignment.
 */
/**
 * Base Venue Address Schema - nested object for venue address fields
 * This is the single source of truth for venue address structure.
 * Use with appropriate modifiers (.nullable(), .optional()) as needed.
 */
export declare const venueAddressSchema: z.ZodObject<{
    venueName: z.ZodNullable<z.ZodString>;
    street: z.ZodNullable<z.ZodString>;
    city: z.ZodNullable<z.ZodString>;
    provinceOrState: z.ZodNullable<z.ZodString>;
    country: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
/**
 * Venue Address Schema for requests (nullable and optional)
 */
export declare const venueAddressFieldsSchema: z.ZodOptional<z.ZodNullable<z.ZodObject<{
    venueName: z.ZodNullable<z.ZodString>;
    street: z.ZodNullable<z.ZodString>;
    city: z.ZodNullable<z.ZodString>;
    provinceOrState: z.ZodNullable<z.ZodString>;
    country: z.ZodNullable<z.ZodString>;
}, z.core.$strip>>>;
/**
 * Venue Address type inferred from schema
 */
export type VenueAddress = z.infer<typeof venueAddressFieldsSchema>;
/**
 * Schema for creating a new activity via HTTP request
 *
 * Includes core activity fields plus junction table ID arrays and venue address.
 * Excludes auto-generated fields (id, displayId, audit fields, rowVersion).
 */
export declare const createActivityRequestSchema: z.ZodObject<{
    title: z.ZodString;
    summary: z.ZodString;
    significance: z.ZodString;
    schedulingNotes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    dateStatusId: z.ZodNumber;
    timeStatusId: z.ZodNumber;
    activityStatusId: z.ZodNumber;
    isIssue: z.ZodDefault<z.ZodBoolean>;
    isAllDay: z.ZodDefault<z.ZodBoolean>;
    isConfidential: z.ZodDefault<z.ZodBoolean>;
    visibility: z.ZodDefault<z.ZodEnum<{
        global: "global";
        team: "team";
    }>>;
    startDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    endDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    startTime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    endTime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    pitchDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    executiveSummary: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    pitchRequired: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    lookAheadStatus: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        none: "none";
        new: "new";
        changed: "changed";
    }>>>;
    lookAheadSection: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        events: "events";
        issues: "issues";
        news: "news";
        awareness: "awareness";
    }>>>;
    leadOrgId: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    leadOrgName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    newsReleaseId: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    newsReleaseOriginId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    leadMinistryId: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodString>;
    eventPlannerLeadId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    eventPlannerLeadName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    newsReleaseDistributionId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    premierRequestedId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    categoryIds: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
    tagIds: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
    commsMaterialIds: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
    translationLanguageIds: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
    representatives: z.ZodOptional<z.ZodArray<z.ZodObject<{
        representativeId: z.ZodOptional<z.ZodNumber>;
        representativeName: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    sharedWithTeamIds: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
    commsContacts: z.ZodOptional<z.ZodArray<z.ZodObject<{
        userId: z.ZodNumber;
        isLead: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>>;
    reportSettings: z.ZodOptional<z.ZodArray<z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodObject<{
        reportId: z.ZodNumber;
        omitted: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>>>;
    venueAddress: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        venueName: z.ZodNullable<z.ZodString>;
        street: z.ZodNullable<z.ZodString>;
        city: z.ZodNullable<z.ZodString>;
        provinceOrState: z.ZodNullable<z.ZodString>;
        country: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
/**
 * Schema for updating an activity via HTTP request
 *
 * All fields are optional (partial update).
 * ID comes from URL parameter, not request body.
 *
 * Note: XOR validation (leadOrgId/leadOrgName, etc.) is handled by
 * database CHECK constraints, not duplicated here.
 */
export declare const updateActivityRequestSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    summary: z.ZodOptional<z.ZodString>;
    significance: z.ZodOptional<z.ZodString>;
    schedulingNotes: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    dateStatusId: z.ZodOptional<z.ZodNumber>;
    timeStatusId: z.ZodOptional<z.ZodNumber>;
    activityStatusId: z.ZodOptional<z.ZodNumber>;
    isIssue: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    isAllDay: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    isConfidential: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    visibility: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        global: "global";
        team: "team";
    }>>>;
    startDate: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    endDate: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    startTime: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    endTime: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    pitchDate: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    executiveSummary: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    pitchRequired: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodBoolean>>>;
    lookAheadStatus: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        none: "none";
        new: "new";
        changed: "changed";
    }>>>>;
    lookAheadSection: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        events: "events";
        issues: "issues";
        news: "news";
        awareness: "awareness";
    }>>>>;
    leadOrgId: z.ZodOptional<z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodNullable<z.ZodString>>>>;
    leadOrgName: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    newsReleaseId: z.ZodOptional<z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodNullable<z.ZodString>>>>;
    newsReleaseOriginId: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
    leadMinistryId: z.ZodOptional<z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodString>>;
    eventPlannerLeadId: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
    eventPlannerLeadName: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    newsReleaseDistributionId: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
    premierRequestedId: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
    categoryIds: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodNumber>>>;
    tagIds: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodNumber>>>;
    commsMaterialIds: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodNumber>>>;
    translationLanguageIds: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodNumber>>>;
    representatives: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        representativeId: z.ZodOptional<z.ZodNumber>;
        representativeName: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>>;
    sharedWithTeamIds: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodNumber>>>;
    commsContacts: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        userId: z.ZodNumber;
        isLead: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>>>;
    reportSettings: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodObject<{
        reportId: z.ZodNumber;
        omitted: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>>>>;
    venueAddress: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodObject<{
        venueName: z.ZodNullable<z.ZodString>;
        street: z.ZodNullable<z.ZodString>;
        city: z.ZodNullable<z.ZodString>;
        provinceOrState: z.ZodNullable<z.ZodString>;
        country: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>>>>;
}, z.core.$strip>;
/**
 * Schema for soft deleting an activity
 * Requires a reason to be provided for audit and admin review purposes
 */
export declare const softDeleteRequestSchema: z.ZodObject<{
    reason: z.ZodString;
}, z.core.$strip>;
/**
 * TypeScript types inferred from Zod schemas
 *
 * These are the single source of truth for API request types.
 * For API response types, use ActivityResponse from activity-response.schema.ts.
 * For database types, use Activity from @corpcal/database/types.
 */
export type CreateActivityRequest = z.infer<typeof createActivityRequestSchema>;
export type UpdateActivityRequest = z.infer<typeof updateActivityRequestSchema>;
export type SoftDeleteRequest = z.infer<typeof softDeleteRequestSchema>;
//# sourceMappingURL=activity.schema.d.ts.map