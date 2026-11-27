import { relations, sql } from 'drizzle-orm';
import {
  date,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

import { activityStatuses } from './lookups';

/**
 * Legacy activity flat table.
 *
 * This table intentionally stores a minimal, search-friendly projection for
 * historical records while preserving the original source payload in raw_record.
 * It avoids forcing legacy-only fields into the normalized activity schema.
 */
export const legacyActivities = pgTable(
  'legacy_activities',
  {
    id: serial('id').primaryKey(),

    displayId: varchar('display_id', { length: 128 }).notNull(),
    externalReference: varchar('external_reference', { length: 128 }),

    title: varchar('title', { length: 255 }),
    summary: text('summary'),
    startDate: date('start_date'),
    endDate: date('end_date'),
    activityStatusId: integer('activity_status_id')
      .notNull()
      .references(() => activityStatuses.id),
    lookAheadStatus: varchar('look_ahead_status', { length: 64 }),
    leadOrgName: varchar('lead_org_name', { length: 255 }),
    ministryName: varchar('ministry_name', { length: 255 }),
    locationName: varchar('location_name', { length: 255 }),
    searchableText: text('searchable_text').notNull(),

    rawRecord: jsonb('raw_record').notNull(),

    createdDateTime: timestamp('created_date_time', { withTimezone: true }),
    importedAt: timestamp('imported_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastReviewedAt: timestamp('last_reviewed_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('legacy_activities_display_id_unique').on(table.displayId),
    index('idx_legacy_activities_title_trgm').using(
      'gin',
      sql`lower(${table.title}) gin_trgm_ops`
    ),
    index('idx_legacy_activities_searchable_text_trgm').using(
      'gin',
      sql`lower(${table.searchableText}) gin_trgm_ops`
    ),
    index('idx_legacy_activities_start_date').on(table.startDate),
    index('idx_legacy_activities_status_id').on(table.activityStatusId),
  ]
);

export const legacyActivitiesRelations = relations(
  legacyActivities,
  ({ one }) => ({
    activityStatus: one(activityStatuses, {
      fields: [legacyActivities.activityStatusId],
      references: [activityStatuses.id],
    }),
  })
);
