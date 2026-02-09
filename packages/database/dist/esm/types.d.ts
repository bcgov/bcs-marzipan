import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { activities } from './schema/activity';
import { activityHistory } from './schema/activityHistory';
import { users } from './schema/user';
import { ministries } from './schema/ministry';
import { activityStatuses, cities, governmentRepresentatives, commsContacts, categories, themes, tags, pitchStatuses, dateStatuses, timeStatuses, venueStatuses } from './schema/lookups';
import { organizations } from './schema/organizations';
/**
 * TypeScript types inferred from Drizzle schema tables
 * These types match the database schema exactly.
 *
 * IMPORTANT: These types are for INTERNAL USE ONLY (backend database operations).
 * They should NOT be exposed directly via API endpoints.
 *
 * For API responses:
 * - Backend/Frontend: Use ActivityResponse from @corpcal/shared/schemas
 *
 * API response schemas are defined with Zod in @corpcal/shared/schemas
 * with compile-time assertions ensuring alignment with these database types.
 */
export type Activity = InferSelectModel<typeof activities>;
export type NewActivity = InferInsertModel<typeof activities>;
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type Ministry = InferSelectModel<typeof ministries>;
export type NewMinistry = InferInsertModel<typeof ministries>;
export type ActivityStatus = InferSelectModel<typeof activityStatuses>;
export type NewActivityStatus = InferInsertModel<typeof activityStatuses>;
export type City = InferSelectModel<typeof cities>;
export type NewCity = InferInsertModel<typeof cities>;
export type GovernmentRepresentative = InferSelectModel<typeof governmentRepresentatives>;
export type NewGovernmentRepresentative = InferInsertModel<typeof governmentRepresentatives>;
export type CommsContact = InferSelectModel<typeof commsContacts>;
export type NewCommsContact = InferInsertModel<typeof commsContacts>;
export type Category = InferSelectModel<typeof categories>;
export type NewCategory = InferInsertModel<typeof categories>;
export type Theme = InferSelectModel<typeof themes>;
export type NewTheme = InferInsertModel<typeof themes>;
export type Tag = InferSelectModel<typeof tags>;
export type NewTag = InferInsertModel<typeof tags>;
export type PitchStatus = InferSelectModel<typeof pitchStatuses>;
export type NewPitchStatus = InferInsertModel<typeof pitchStatuses>;
export type DateStatus = InferSelectModel<typeof dateStatuses>;
export type NewDateStatus = InferInsertModel<typeof dateStatuses>;
export type TimeStatus = InferSelectModel<typeof timeStatuses>;
export type NewTimeStatus = InferInsertModel<typeof timeStatuses>;
export type VenueStatus = InferSelectModel<typeof venueStatuses>;
export type NewVenueStatus = InferInsertModel<typeof venueStatuses>;
export type Organization = InferSelectModel<typeof organizations>;
export type NewOrganization = InferInsertModel<typeof organizations>;
export type ActivityHistory = InferSelectModel<typeof activityHistory>;
export type NewActivityHistory = InferInsertModel<typeof activityHistory>;
//# sourceMappingURL=types.d.ts.map