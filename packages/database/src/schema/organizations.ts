import {
  pgTable,
  uuid,
  integer,
  boolean,
  varchar,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { ministries } from './ministry';

/**
 * Organizations table - Organizations (superset of ministries)
 * Includes BC government ministries, federal ministries, crown corporations, and other organizations
 * BC government ministries link to the ministries table via ministryId
 */
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }),
  organizationType: varchar('organization_type', { length: 50 }), // 'bcgov', 'provincial', 'federal', 'other'
  ministryId: uuid('ministry_id'), // FK to ministries (nullable - only for BC gov ministries)
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  description: text('description'),
  timestamp: timestamp('timestamp', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const organizationsRelations = relations(organizations, ({ one }) => ({
  ministry: one(ministries, {
    fields: [organizations.ministryId],
    references: [ministries.id],
  }),
  // Reverse relations will be defined in junction tables
}));
