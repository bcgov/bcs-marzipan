import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

import { users } from './user';

/**
 * Venue Quick Picks table - Admin-configurable quick-pick venues for the activity form.
 * Stores 2-4 fixed venue options (e.g. BC Legislature, Vancouver Convention Centre)
 * that appear as tags under the Venue address input. No legacy mapping.
 */
export const venueQuickPicks = pgTable('venue_quick_picks', {
  id: serial('id').primaryKey().notNull(),
  venueName: varchar('venue_name', { length: 255 }).notNull(),
  street: varchar('street', { length: 255 }),
  city: varchar('city', { length: 255 }),
  provinceOrState: varchar('province_or_state', { length: 255 }),
  country: varchar('country', { length: 255 }),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdDateTime: timestamp('created_date_time', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  lastUpdatedBy: integer('last_updated_by')
    .notNull()
    .references(() => users.id),
});

export const venueQuickPicksRelations = relations(
  venueQuickPicks,
  ({ one }) => ({
    createdByUser: one(users, {
      fields: [venueQuickPicks.createdBy],
      references: [users.id],
      relationName: 'venueQuickPicksCreatedBy',
    }),
    lastUpdatedByUser: one(users, {
      fields: [venueQuickPicks.lastUpdatedBy],
      references: [users.id],
      relationName: 'venueQuickPicksLastUpdatedBy',
    }),
  })
);
