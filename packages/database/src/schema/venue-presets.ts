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
 * Venue Presets table - Admin-defined named venues for the activity form.
 * All active rows appear in the Venue Name combobox dropdown.
 * Rows with `is_pinned = true` are displayed as quick-select badges beneath
 * the input, ordered by `pinned_sort_order`.
 * Address fields align with `venue_addresses` (including optional `address_line2`).
 */
export const venuePresets = pgTable('venue_presets', {
  id: serial('id').primaryKey().notNull(),
  venueName: varchar('venue_name', { length: 255 }).notNull(),
  addressLine1: varchar('address_line1', { length: 255 }),
  addressLine2: varchar('address_line2', { length: 255 }),
  city: varchar('city', { length: 255 }),
  provinceOrState: varchar('province_or_state', { length: 255 }),
  country: varchar('country', { length: 255 }),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  isPinned: boolean('is_pinned').notNull().default(false),
  pinnedSortOrder: integer('pinned_sort_order').notNull().default(0),
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

export const venuePresetsRelations = relations(venuePresets, ({ one }) => ({
  createdByUser: one(users, {
    fields: [venuePresets.createdBy],
    references: [users.id],
    relationName: 'venuePresetsCreatedBy',
  }),
  lastUpdatedByUser: one(users, {
    fields: [venuePresets.lastUpdatedBy],
    references: [users.id],
    relationName: 'venuePresetsLastUpdatedBy',
  }),
}));
