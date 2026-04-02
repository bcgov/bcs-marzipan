import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

/** Global application settings (key-value). */
export const applicationSettings = pgTable('application_settings', {
  key: varchar('key', { length: 100 }).primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ApplicationSetting = typeof applicationSettings.$inferSelect;
