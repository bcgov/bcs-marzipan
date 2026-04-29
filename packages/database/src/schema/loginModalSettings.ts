import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

import { users } from './user';

export const loginModalSettings = pgTable('login_modal_settings', {
  id: serial('id').primaryKey(),
  isActive: boolean('is_active').notNull().default(false),
  title: varchar('title', { length: 200 }).notNull().default('Notice'),
  content: text('content').notNull(),
  startDateTime: timestamp('start_date_time', { withTimezone: true }),
  endDateTime: timestamp('end_date_time', { withTimezone: true }),
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
