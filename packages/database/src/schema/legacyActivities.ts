import { relations, sql } from 'drizzle-orm';
import {
  boolean,
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

import { activities } from './activity';

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

    sourceSystem: varchar('source_system', { length: 64 })
      .notNull()
      .default('legacy'),
    sourceTable: varchar('source_table', { length: 64 })
      .notNull()
      .default('activity'),
    sourceRecordId: varchar('source_record_id', { length: 128 }).notNull(),
    externalReference: varchar('external_reference', { length: 128 }),

    matchedActivityId: integer('matched_activity_id').references(
      () => activities.id
    ),

    title: varchar('title', { length: 255 }),
    summary: text('summary'),
    startDate: date('start_date'),
    endDate: date('end_date'),
    statusName: varchar('status_name', { length: 100 }),
    lookAheadStatus: varchar('look_ahead_status', { length: 64 }),
    leadOrgName: varchar('lead_org_name', { length: 255 }),
    ministryName: varchar('ministry_name', { length: 255 }),
    locationName: varchar('location_name', { length: 255 }),
    searchableText: text('searchable_text').notNull(),

    rawRecord: jsonb('raw_record').notNull(),

    importedAt: timestamp('imported_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastReviewedAt: timestamp('last_reviewed_at', { withTimezone: true }),
    isArchived: boolean('is_archived').notNull().default(false),
  },
  (table) => [
    uniqueIndex('legacy_activities_source_unique').on(
      table.sourceSystem,
      table.sourceTable,
      table.sourceRecordId
    ),
    index('idx_legacy_activities_title_trgm').using(
      'gin',
      sql`lower(${table.title}) gin_trgm_ops`
    ),
    index('idx_legacy_activities_searchable_text_trgm').using(
      'gin',
      sql`lower(${table.searchableText}) gin_trgm_ops`
    ),
    index('idx_legacy_activities_start_date').on(table.startDate),
    index('idx_legacy_activities_status_name').on(table.statusName),
  ]
);

export const legacyActivitiesRelations = relations(
  legacyActivities,
  ({ one }) => ({
    matchedActivity: one(activities, {
      fields: [legacyActivities.matchedActivityId],
      references: [activities.id],
      relationName: 'legacyMatchedActivity',
    }),
  })
);
