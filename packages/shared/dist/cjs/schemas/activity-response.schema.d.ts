import { z } from 'zod';
/**
 * Layer 1: Database Fields Schema
 *
 * These fields come directly from the database activities table.
 * Types are transformed for API consumption:
 * - Date/time fields -> ISO strings
 * - rowVersion is omitted (internal field)
 *
 * ID Type Strategy:
 * - Serial IDs (auto-increment): Use z.number().int() - matches database type
 * - UUID IDs: Use z.string().uuid() - matches database type
 *
 * This provides true end-to-end type safety with no conversion required.
 * Serial IDs remain numbers throughout the stack (database -> API -> frontend -> API -> database).
 *
 * Fields here must exist in the database Activity type.
 * See validate-types.ts for compile-time verification.
 */
export declare const activityDbFieldsSchema: z.ZodObject<{
    id: z.ZodNumber;
    displayId: z.ZodNullable<z.ZodString>;
    isIssue: z.ZodBoolean;
    isConfidential: z.ZodBoolean;
    title: z.ZodString;
    summary: z.ZodString;
    significance: z.ZodString;
    leadOrgId: z.ZodNullable<z.ZodString>;
    leadOrgName: z.ZodNullable<z.ZodString>;
    isAllDay: z.ZodBoolean;
    startDate: z.ZodNullable<z.ZodString>;
    endDate: z.ZodNullable<z.ZodString>;
    dateStatusId: z.ZodNumber;
    startTime: z.ZodNullable<z.ZodString>;
    endTime: z.ZodNullable<z.ZodString>;
    timeStatusId: z.ZodNumber;
    schedulingNotes: z.ZodNullable<z.ZodString>;
    newsReleaseOriginId: z.ZodNullable<z.ZodNumber>;
    newsReleaseId: z.ZodNullable<z.ZodString>;
    newsReleaseDistributionId: z.ZodNullable<z.ZodNumber>;
    eventPlannerLeadId: z.ZodNullable<z.ZodNumber>;
    eventPlannerLeadName: z.ZodNullable<z.ZodString>;
    executiveSummary: z.ZodNullable<z.ZodString>;
    lookAheadStatus: z.ZodNullable<z.ZodEnum<{
        none: "none";
        new: "new";
        changed: "changed";
    }>>;
    lookAheadSection: z.ZodNullable<z.ZodEnum<{
        events: "events";
        issues: "issues";
        news: "news";
        awareness: "awareness";
    }>>;
    notes: z.ZodNullable<z.ZodString>;
    pitchDate: z.ZodNullable<z.ZodString>;
    pitchRequired: z.ZodNullable<z.ZodBoolean>;
    premierRequestedId: z.ZodNullable<z.ZodNumber>;
    visibility: z.ZodEnum<{
        global: "global";
        team: "team";
    }>;
    leadMinistryId: z.ZodString;
    activityStatusId: z.ZodNumber;
    createdBy: z.ZodNumber;
    lastUpdatedBy: z.ZodNumber;
    createdDateTime: z.ZodString;
    lastUpdatedDateTime: z.ZodString;
}, z.core.$strip>;
/**
 * Layer 2: Computed Fields Schema
 *
 * These fields are computed from joins and lookups - they don't exist
 * directly in the database activities table.
 * They are populated by the service layer during response mapping.
 *
 * IMPORTANT: Display names/values from lookups.
 * Forms submit IDs for database storage.
 * UI components should display these name fields.
 */
export declare const activityComputedFieldsSchema: z.ZodObject<{
    category: z.ZodDefault<z.ZodArray<z.ZodString>>;
    tags: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        text: z.ZodString;
    }, z.core.$strip>>>;
    commsMaterials: z.ZodDefault<z.ZodArray<z.ZodString>>;
    translationsRequired: z.ZodDefault<z.ZodArray<z.ZodString>>;
    representativesAttending: z.ZodDefault<z.ZodArray<z.ZodObject<{
        representative: z.ZodString;
    }, z.core.$strip>>>;
    sharedWith: z.ZodDefault<z.ZodArray<z.ZodString>>;
    commsContacts: z.ZodDefault<z.ZodArray<z.ZodObject<{
        userId: z.ZodNumber;
        name: z.ZodString;
        isLead: z.ZodBoolean;
    }, z.core.$strip>>>;
    leadOrg: z.ZodNullable<z.ZodString>;
    eventLead: z.ZodNullable<z.ZodString>;
    dateStatus: z.ZodString;
    timeStatus: z.ZodString;
    activityStatus: z.ZodString;
    newsReleaseOrigin: z.ZodNullable<z.ZodString>;
    newsReleaseDistribution: z.ZodNullable<z.ZodString>;
    premierRequested: z.ZodNullable<z.ZodString>;
    venueAddress: z.ZodNullable<z.ZodObject<{
        venueName: z.ZodNullable<z.ZodString>;
        street: z.ZodNullable<z.ZodString>;
        city: z.ZodNullable<z.ZodString>;
        provinceOrState: z.ZodNullable<z.ZodString>;
        country: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>>;
    reportSettings: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        name: z.ZodString;
        displayName: z.ZodString;
        omitted: z.ZodBoolean;
    }, z.core.$strip>>>;
}, z.core.$strip>;
/**
 * Activity Response Schema
 *
 * The complete API response schema, merging database fields with computed fields.
 * This is the single source of truth for the ActivityResponse type.
 */
export declare const activityResponseSchema: z.ZodObject<{
    id: z.ZodNumber;
    displayId: z.ZodNullable<z.ZodString>;
    isIssue: z.ZodBoolean;
    isConfidential: z.ZodBoolean;
    title: z.ZodString;
    summary: z.ZodString;
    significance: z.ZodString;
    leadOrgId: z.ZodNullable<z.ZodString>;
    leadOrgName: z.ZodNullable<z.ZodString>;
    isAllDay: z.ZodBoolean;
    startDate: z.ZodNullable<z.ZodString>;
    endDate: z.ZodNullable<z.ZodString>;
    dateStatusId: z.ZodNumber;
    startTime: z.ZodNullable<z.ZodString>;
    endTime: z.ZodNullable<z.ZodString>;
    timeStatusId: z.ZodNumber;
    schedulingNotes: z.ZodNullable<z.ZodString>;
    newsReleaseOriginId: z.ZodNullable<z.ZodNumber>;
    newsReleaseId: z.ZodNullable<z.ZodString>;
    newsReleaseDistributionId: z.ZodNullable<z.ZodNumber>;
    eventPlannerLeadId: z.ZodNullable<z.ZodNumber>;
    eventPlannerLeadName: z.ZodNullable<z.ZodString>;
    executiveSummary: z.ZodNullable<z.ZodString>;
    lookAheadStatus: z.ZodNullable<z.ZodEnum<{
        none: "none";
        new: "new";
        changed: "changed";
    }>>;
    lookAheadSection: z.ZodNullable<z.ZodEnum<{
        events: "events";
        issues: "issues";
        news: "news";
        awareness: "awareness";
    }>>;
    notes: z.ZodNullable<z.ZodString>;
    pitchDate: z.ZodNullable<z.ZodString>;
    pitchRequired: z.ZodNullable<z.ZodBoolean>;
    premierRequestedId: z.ZodNullable<z.ZodNumber>;
    visibility: z.ZodEnum<{
        global: "global";
        team: "team";
    }>;
    leadMinistryId: z.ZodString;
    activityStatusId: z.ZodNumber;
    createdBy: z.ZodNumber;
    lastUpdatedBy: z.ZodNumber;
    createdDateTime: z.ZodString;
    lastUpdatedDateTime: z.ZodString;
    category: z.ZodDefault<z.ZodArray<z.ZodString>>;
    tags: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        text: z.ZodString;
    }, z.core.$strip>>>;
    commsMaterials: z.ZodDefault<z.ZodArray<z.ZodString>>;
    translationsRequired: z.ZodDefault<z.ZodArray<z.ZodString>>;
    representativesAttending: z.ZodDefault<z.ZodArray<z.ZodObject<{
        representative: z.ZodString;
    }, z.core.$strip>>>;
    sharedWith: z.ZodDefault<z.ZodArray<z.ZodString>>;
    commsContacts: z.ZodDefault<z.ZodArray<z.ZodObject<{
        userId: z.ZodNumber;
        name: z.ZodString;
        isLead: z.ZodBoolean;
    }, z.core.$strip>>>;
    leadOrg: z.ZodNullable<z.ZodString>;
    eventLead: z.ZodNullable<z.ZodString>;
    dateStatus: z.ZodString;
    timeStatus: z.ZodString;
    activityStatus: z.ZodString;
    newsReleaseOrigin: z.ZodNullable<z.ZodString>;
    newsReleaseDistribution: z.ZodNullable<z.ZodString>;
    premierRequested: z.ZodNullable<z.ZodString>;
    venueAddress: z.ZodNullable<z.ZodObject<{
        venueName: z.ZodNullable<z.ZodString>;
        street: z.ZodNullable<z.ZodString>;
        city: z.ZodNullable<z.ZodString>;
        provinceOrState: z.ZodNullable<z.ZodString>;
        country: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>>;
    reportSettings: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        name: z.ZodString;
        displayName: z.ZodString;
        omitted: z.ZodBoolean;
    }, z.core.$strip>>>;
}, z.core.$strip>;
/**
 * TypeScript types inferred from Zod schemas
 * These are the single source of truth for API response types
 */
export type ActivityResponse = z.infer<typeof activityResponseSchema>;
export type ActivityDbFields = z.infer<typeof activityDbFieldsSchema>;
export type ActivityComputedFields = z.infer<typeof activityComputedFieldsSchema>;
//# sourceMappingURL=activity-response.schema.d.ts.map