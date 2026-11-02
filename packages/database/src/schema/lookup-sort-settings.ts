import { integer, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';

import { users } from './user';

/** Published list sort mode for admin-reorderable lookup types (URL segment = lookup_key). */
export const lookupSortSettings = pgTable('lookup_sort_settings', {
  lookupKey: varchar('lookup_key', { length: 64 }).primaryKey(),
  sortMode: varchar('sort_mode', { length: 32 }).notNull().default('manual'),
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  lastUpdatedBy: integer('last_updated_by')
    .notNull()
    .references(() => users.id),
});

export type LookupSortSetting = typeof lookupSortSettings.$inferSelect;
