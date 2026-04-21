import {
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

import { users } from './user';

/**
 * Named groups for activity "Shared with teams" shortcuts (e.g. Social, Resource).
 * Ministries optionally reference one group via ministries.ministry_group_id.
 */
export const ministryGroups = pgTable('ministry_groups', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
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
