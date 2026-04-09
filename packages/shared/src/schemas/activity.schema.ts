import { z } from 'zod';

import {
  LOOK_AHEAD_SECTION,
  LOOK_AHEAD_STATUS,
  VISIBILITY,
} from '../constants/constants';
import {
  ACTIVITY_RICH_TEXT_MAX_BYTES,
  isActivityRichTextStorageRefine,
  plainTextFromActivityRichField,
} from '../utils/activity-rich-text';

/**
 * Activity Zod Schemas
 *
 * These schemas are source of truth for and define API request/response contracts.
 * The database schema (Drizzle) is the source of truth for DB types.
 * Compile-time checks in schema-helpers.ts ensure alignment.
 */

// ============================================================================
// Shared Field Schemas
// ============================================================================

/**
 * Base Venue Address Schema - nested object for venue address fields
 * This is the single source of truth for venue address structure.
 * Use with appropriate modifiers (.nullable(), .optional()) as needed.
 */
export const venueAddressSchema = z.object({
  venueName: z.string().nullable().optional(),
  addressLine1: z.string().nullable().optional(),
  addressLine2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  provinceOrState: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
});

/**
 * Venue Address Schema for requests (nullable and optional)
 */
export const venueAddressFieldsSchema = venueAddressSchema
  .nullable()
  .optional();

/**
 * Base venue address object shape: each field is optional and may be `string | null`.
 * Clients may send only the fields they set (e.g. city and country only).
 */
export type VenueAddressBase = z.infer<typeof venueAddressSchema>;

/**
 * Venue Address type inferred from schema
 */
export type VenueAddress = z.infer<typeof venueAddressFieldsSchema>;

/**
 * Preprocess helper for UUID fields that may receive empty strings from forms
 */
const emptyStringToNull = (val: unknown) => (val === '' ? null : val);

const ACTIVITY_RICH_TEXT_INVALID_STORAGE =
  'Must be empty, plain/markdown, or valid Tip Tap document (JSON)';

const activityRichTextStoredStringSchema = z
  .string()
  .max(ACTIVITY_RICH_TEXT_MAX_BYTES)
  .refine(isActivityRichTextStorageRefine, {
    message: ACTIVITY_RICH_TEXT_INVALID_STORAGE,
  });

// ============================================================================
// Database Field Schemas (for request validation)
// ============================================================================

/**
 * Core activity fields schema
 * These fields exist in the database activities table
 */
const activityCoreFieldsSchema = z.object({
  // Required fields
  title: z.string().min(1).max(255),
  summary: activityRichTextStoredStringSchema,
  significance: z.preprocess(
    emptyStringToNull,
    z
      .union([
        z
          .string()
          .max(ACTIVITY_RICH_TEXT_MAX_BYTES)
          .refine(isActivityRichTextStorageRefine, {
            message: ACTIVITY_RICH_TEXT_INVALID_STORAGE,
          }),
        z.null(),
      ])
      .optional()
  ),
  schedulingNotes: z.string().max(500).optional().nullable(),
  strategy: z.string().nullable().optional(),

  // Status IDs (numbers for database; venue optional when activity has no venue)
  // Note: These are numbers in requests (matching database schema) but converted to strings
  // in responses for consistent JSON serialization. See activity-response.schema.ts for details.
  // activityStatusId is optional on create; backend sets it from markAsReviewed + role (new or reviewed).
  dateStatusId: z.number().int().optional(), // Optional: server applies lookup defaults when omitted on create
  timeStatusId: z.number().int().optional(), // Optional: server applies lookup defaults when omitted on create
  venueStatusId: z.number().int().nullable().optional(),
  activityStatusId: z.number().int().optional(),

  // Boolean flags
  isIssue: z.boolean().default(false),
  isAllDay: z.boolean().default(false),
  isConfidential: z.boolean().default(false),

  // Visibility control
  visibility: z.enum(VISIBILITY).default('global'), // 'global' or 'team' - controls base access visibility

  // Optional scheduling fields (YYYY-MM-DD for dates, HH:mm for times)
  startDate: z.string().date().nullable().optional(),
  endDate: z.string().date().nullable().optional(),
  startTime: z.string().time().nullable().optional(),
  endTime: z.string().time().nullable().optional(),
  pitchDate: z.string().date().nullable().optional(), // Date when activity was or will be pitched

  // Optional text fields
  notes: z.string().nullable().optional(), // Maps to legacy Comments
  executiveSummary: z.preprocess(
    emptyStringToNull,
    z
      .union([
        z
          .string()
          .max(ACTIVITY_RICH_TEXT_MAX_BYTES)
          .refine(isActivityRichTextStorageRefine, {
            message: ACTIVITY_RICH_TEXT_INVALID_STORAGE,
          }),
        z.null(),
      ])
      .optional()
  ),
  pitchRequiredStatusId: z.number().int().nullable().optional(), // pending, required, not_required
  translationsRequiredStatusId: z.number().int().nullable().optional(), // pending, required, not_required

  // Optional enum fields
  lookAheadStatus: z.enum(LOOK_AHEAD_STATUS).nullable().optional(),
  lookAheadSection: z.enum(LOOK_AHEAD_SECTION).nullable().optional(),

  // Optional foreign key fields (with empty string preprocessing)
  leadOrgId: z.preprocess(
    emptyStringToNull,
    z.number().int().nullable().optional()
  ),
  leadOrgName: z.string().max(255).nullable().optional(),
  newsReleaseId: z.preprocess(
    emptyStringToNull,
    z.string().uuid().nullable().optional()
  ),
  newsReleaseOriginId: z.number().int().nullable().optional(),
  leadTeamId: z.number().int(), // Required - primary association for which team leads this activity
  leadMinistryId: z.preprocess(
    emptyStringToNull,
    z.number().int().nullable().optional()
  ), // Optional; derived from lead team's ministry

  // Optional lookup ID fields
  newsReleaseDistributionId: z.number().int().nullable().optional(),
  premierRequestedId: z.number().int().nullable().optional(),

  // UI convenience: single comms lead (converted to commsContacts with isLead on submit)
  commsContactLeadId: z.number().int().nullable().optional(),
});

// ============================================================================
// Request Schemas
// ============================================================================

/**
 * Representative schema.
 * Array can mix entries by representativeId (lookup) or representativeName (freeform).
 * Backend uses representativeId when present, else representativeName.
 * Each non-empty array entry must include a positive id or a non-empty name.
 */
const representativeSchema = z
  .object({
    representativeId: z.number().int().optional(),
    representativeName: z.string().max(255).optional(),
  })
  .refine(
    (data) => {
      const hasId =
        data.representativeId !== undefined && data.representativeId > 0;
      const hasName =
        typeof data.representativeName === 'string' &&
        data.representativeName.trim().length > 0;
      return hasId || hasName;
    },
    {
      message:
        'Each representative must have a representativeId or a non-empty representativeName',
    }
  );

/**
 * Event planner schema (one entry per planner).
 * eventPlannerId = lookup table; eventPlannerName = one-off free text.
 * Backend prefers id when present. isLead marks the lead planner (exactly one per activity when non-empty).
 */
const eventPlannerSchema = z.object({
  eventPlannerId: z.number().int().optional(),
  eventPlannerName: z.string().max(255).optional(),
  isLead: z.boolean().default(false),
});

/**
 * Report setting schema
 * Defines whether an activity is omitted from a specific report
 */
const reportSettingSchema = z.preprocess(
  (val) => {
    // Normalize incoming shape: accept `{ id: number }` (older clients)
    // and map it to `{ reportId: number }` so validation passes.
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const v = val as Record<string, unknown>;
      if (v.reportId === undefined && v.id !== undefined) {
        return { ...v, reportId: v.id };
      }
    }
    return val;
  },
  z.object({
    reportId: z.number().int(),
    omitted: z.boolean().default(false),
  })
);

/**
 * Comms contact schema
 * Supports identifying the lead contact via isLead flag
 */
const commsContactSchema = z.object({
  userId: z.number().int(),
  isLead: z.boolean().default(false),
});

/**
 * Junction table ID arrays for request payloads
 * These fields create many-to-many relationships
 */
const junctionTableIdsSchema = z.object({
  categoryIds: z.array(z.number().int()).optional(),
  tagIds: z.array(z.number().int()).optional(),
  commsMaterialIds: z.array(z.number().int()).optional(),
  translationLanguageIds: z.array(z.number().int()).optional(),
  eventPlanners: z.array(eventPlannerSchema).optional(),
  representatives: z.array(representativeSchema).optional(),
  sharedWithTeamIds: z.array(z.number().int()).optional(), // Editor-type teams the activity is shared with
  commsContacts: z.array(commsContactSchema).optional(), // Comms contacts with isLead flag (exactly one must have isLead=true)
  reportSettings: z.array(reportSettingSchema).optional(), // Report settings for the activity
});

const CATEGORY_IDS_MIN_MESSAGE = 'At least one category is required.';

/** Create requests require at least one category ID. */
const createJunctionTableIdsSchema = junctionTableIdsSchema.extend({
  categoryIds: z
    .array(z.number().int())
    .min(1, { message: CATEGORY_IDS_MIN_MESSAGE }),
});

const LEAD_CONTACT_REFINE_MESSAGE = 'A lead contact is required.';
const LEAD_CONTACT_REFINE_PATH = ['commsContacts'] as const;

/** Create: commsContacts must have at least one contact and exactly one lead. */
function createLeadContactRefine(data: {
  commsContacts?: Array<{ userId: number; isLead: boolean }>;
}): boolean {
  const contacts = data.commsContacts ?? [];
  return contacts.length >= 1 && contacts.filter((c) => c.isLead).length === 1;
}

/** Update: when commsContacts is provided and non-empty, exactly one must be lead. */
function updateLeadContactRefine(data: {
  commsContacts?: Array<{ userId: number; isLead: boolean }>;
}): boolean {
  const contacts = data.commsContacts ?? [];
  if (contacts.length === 0) return true;
  return contacts.filter((c) => c.isLead).length === 1;
}

const EVENT_PLANNER_LEAD_REFINE_MESSAGE =
  'When event planners are provided, exactly one must be marked as lead.';
const EVENT_PLANNER_LEAD_REFINE_PATH = ['eventPlanners'] as const;

/** When eventPlanners is provided and non-empty, exactly one must have isLead true. */
function eventPlannerLeadRefine(data: {
  eventPlanners?: Array<{
    eventPlannerId?: number;
    eventPlannerName?: string;
    isLead?: boolean;
  }>;
}): boolean {
  const planners = data.eventPlanners ?? [];
  if (planners.length === 0) return true;
  return planners.filter((p) => p.isLead === true).length === 1;
}

/**
 * Base schema for create (no refinements).
 * Used to build create and update schemas without calling .partial() on a refined schema (Zod v4).
 */
const createBaseSchema = activityCoreFieldsSchema
  .merge(createJunctionTableIdsSchema)
  .extend({
    venueAddress: venueAddressFieldsSchema,
    activityHistoryNotes: z.string().max(1000).optional(),
    /** When true and user is admin/sysAdmin, backend sets initial status to reviewed; otherwise new. Ignored for non-admin. */
    markAsReviewed: z.boolean().optional(),
  });

/**
 * Schema for creating a new activity via HTTP request
 *
 * Includes core activity fields plus junction table ID arrays and venue address.
 * Excludes auto-generated fields (id, displayId, audit fields, rowVersion).
 * Requires at least one Comms contact with exactly one marked as lead.
 */
const SUMMARY_REQUIRED_MESSAGE = 'Summary is required.';

export const createActivityRequestSchema = createBaseSchema
  .refine(createLeadContactRefine, {
    message: LEAD_CONTACT_REFINE_MESSAGE,
    path: [...LEAD_CONTACT_REFINE_PATH],
  })
  .refine(eventPlannerLeadRefine, {
    message: EVENT_PLANNER_LEAD_REFINE_MESSAGE,
    path: [...EVENT_PLANNER_LEAD_REFINE_PATH],
  })
  .refine(
    (data) => plainTextFromActivityRichField(data.summary).trim().length > 0,
    {
      message: SUMMARY_REQUIRED_MESSAGE,
      path: ['summary'],
    }
  );

/**
 * Schema for updating an activity via HTTP request
 *
 * All fields are optional (partial update).
 * ID comes from URL parameter, not request body.
 * When commsContacts is provided and non-empty, enforces the same lead-contact rule as create.
 *
 * Note: XOR validation (leadOrgId/leadOrgName, etc.) is handled by
 * database CHECK constraints, not duplicated here.
 */
export const updateActivityRequestSchema = createBaseSchema
  .partial()
  .refine(updateLeadContactRefine, {
    message: LEAD_CONTACT_REFINE_MESSAGE,
    path: [...LEAD_CONTACT_REFINE_PATH],
  })
  .refine(eventPlannerLeadRefine, {
    message: EVENT_PLANNER_LEAD_REFINE_MESSAGE,
    path: [...EVENT_PLANNER_LEAD_REFINE_PATH],
  });

/**
 * Schema for soft deleting an activity
 * Requires a reason to be provided for audit and admin review purposes
 */
export const softDeleteRequestSchema = z.object({
  reason: z
    .string()
    .min(10, 'Reason must be at least 10 characters')
    .max(1000, 'Reason must not exceed 1000 characters')
    .trim(),
});

/**
 * Schema for requesting delete (comms contacts)
 * Same validation as soft delete: reason required for audit.
 */
export const requestDeleteRequestSchema = z.object({
  reason: z
    .string()
    .min(10, 'Reason must be at least 10 characters')
    .max(1000, 'Reason must not exceed 1000 characters')
    .trim(),
});

/**
 * Schema for restoring an activity from delete_requested or deleted
 */
export const restoreRequestSchema = z.object({
  note: z.string().max(1000).optional(),
});

/**
 * Schema for adding a standalone activity history note
 */
export const addActivityHistoryNoteRequestSchema = z.object({
  note: z
    .string()
    .min(1, 'Note is required')
    .max(1000, 'Note must not exceed 1000 characters')
    .trim(),
});

/**
 * Schema for hard delete (permanent) request body.
 * Reason is optional but recommended for audit; when provided, same validation as soft delete.
 */
export const hardDeleteRequestSchema = z.object({
  reason: z
    .string()
    .min(10, 'Reason must be at least 10 characters')
    .max(1000, 'Reason must not exceed 1000 characters')
    .trim()
    .optional(),
});

/** Request body for hard delete; defaults to {} when body is omitted. */
export const hardDeleteRequestBodySchema = hardDeleteRequestSchema.default({});

// ============================================================================
// TypeScript Types
// ============================================================================

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
export type RequestDeleteRequest = z.infer<typeof requestDeleteRequestSchema>;
export type RestoreRequest = z.infer<typeof restoreRequestSchema>;
export type AddActivityHistoryNoteRequest = z.infer<
  typeof addActivityHistoryNoteRequestSchema
>;
export type HardDeleteRequest = z.infer<typeof hardDeleteRequestSchema>;

/**
 * Form data type for create/edit activity forms.
 * Single source of truth: same as CreateActivityRequest (schema-inferred).
 */
export type ActivityFormData = CreateActivityRequest;
