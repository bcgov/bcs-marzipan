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

export const bannerSettings = pgTable('banner_settings', {
  id: serial('id').primaryKey(),
  isActive: boolean('is_active').notNull().default(false),
  content: text('content').notNull(),
  backgroundColor: varchar('background_color', { length: 20 })
    .notNull()
    .default('#E6A635'),
  textColor: varchar('text_color', { length: 20 }).notNull().default('#000000'),
  isDismissible: boolean('is_dismissible').notNull().default(true),
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
