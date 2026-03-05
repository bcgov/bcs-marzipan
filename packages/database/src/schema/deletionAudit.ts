import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

import { users } from './user';

/**
 * Audit log for permanent (hard) activity deletions.
 * Stores activity_id without FK to activities so the record remains after the activity row is deleted.
 */
export const deletionAudit = pgTable('deletion_audit', {
  id: serial('id').primaryKey(),
  activityId: integer('activity_id').notNull(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  reason: text('reason'),
  deletedAt: timestamp('deleted_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
