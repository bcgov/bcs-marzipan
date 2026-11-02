import { sql } from 'drizzle-orm';
import {
  integer,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

import { users } from './user';

/**
 * Named groups for activity "Shared with teams" shortcuts (e.g. Social, Resource).
 * Ministries optionally reference one group via ministries.ministry_group_id.
 * There is no is_active flag: retiring a group is done by deleting it (ministries
 * are cleared via ON DELETE SET NULL) or by reassigning ministries first.
 * Display names are unique case-insensitively (see unique index on lower(name)).
 */
export const ministryGroups = pgTable(
  'ministry_groups',
  {
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
  },
  (table) => ({
    nameLowerUnique: uniqueIndex('ministry_groups_name_lower_unique').on(
      sql`lower(${table.name})`
    ),
  })
);
