import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { activities } from './schema/activity';
import { systemUsers } from './schema/user';
import { ministries } from './schema/ministry';
import {
  activityStatuses,
  cities,
  governmentRepresentatives,
  communicationContacts,
  eventPlanners,
  videographers,
  categories,
  themes,
  tags,
} from './schema/lookups';

/**
 * TypeScript types inferred from Drizzle schema tables
 * These types match the database schema exactly.
 *
 * IMPORTANT: These types are for INTERNAL USE ONLY (backend database operations).
 * They should NOT be exposed directly via API endpoints.
 *
 * For API responses:
 * - Backend: Use DTOs from @corpcal/shared/dto (e.g., ActivityResponseDto)
 * - Frontend: Use API types from @corpcal/shared/api/types (e.g., ActivityResponse)
 *
 * Note: API response schemas are derived from the database schema via Zod,
 * but the database types themselves remain internal-only.
 */

// Activity types
export type Activity = InferSelectModel<typeof activities>;
export type NewActivity = InferInsertModel<typeof activities>;

// User types
export type SystemUser = InferSelectModel<typeof systemUsers>;
export type NewSystemUser = InferInsertModel<typeof systemUsers>;

// Ministry types
export type Ministry = InferSelectModel<typeof ministries>;
export type NewMinistry = InferInsertModel<typeof ministries>;

// Lookup types
export type ActivityStatus = InferSelectModel<typeof activityStatuses>;
export type NewActivityStatus = InferInsertModel<typeof activityStatuses>;

export type City = InferSelectModel<typeof cities>;
export type NewCity = InferInsertModel<typeof cities>;

export type GovernmentRepresentative = InferSelectModel<
  typeof governmentRepresentatives
>;
export type NewGovernmentRepresentative = InferInsertModel<
  typeof governmentRepresentatives
>;

export type CommunicationContact = InferSelectModel<
  typeof communicationContacts
>;
export type NewCommunicationContact = InferInsertModel<
  typeof communicationContacts
>;

export type EventPlanner = InferSelectModel<typeof eventPlanners>;
export type NewEventPlanner = InferInsertModel<typeof eventPlanners>;

export type Videographer = InferSelectModel<typeof videographers>;
export type NewVideographer = InferInsertModel<typeof videographers>;

export type Category = InferSelectModel<typeof categories>;
export type NewCategory = InferInsertModel<typeof categories>;

export type Theme = InferSelectModel<typeof themes>;
export type NewTheme = InferInsertModel<typeof themes>;

export type Tag = InferSelectModel<typeof tags>;
export type NewTag = InferInsertModel<typeof tags>;
