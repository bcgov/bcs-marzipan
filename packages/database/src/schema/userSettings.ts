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
 * UserSettings table - Stores per-user configurable settings.
 * One row per user (unique on user_id). Created on first save.
 */
export const userSettings = pgTable('user_settings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  /**
   * Hex colour (e.g. #FF5733) for the flag icon shown when an activity is
   * assigned to this user. Null means use the application default.
   * Only settable for admin / sys-admin users via the Edit User modal.
   */
  flagColour: varchar('flag_colour', { length: 7 }),
  /**
   * Whether the user is allowed to sign in directly using local credentials.
   * Null/false means direct login is disabled.
   * Only settable by administrators.
   */
  directLoginEnabled: boolean('direct_login_enabled').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));
