import { relations, sql } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

import { activities } from './activity';
import { users } from './user';

/**
 * ActivityHistory table - Tracks all changes to activities
 * Each entry represents a user action (created, updated, deleted, etc.)
 * with field-level change tracking
 */
export const activityHistory = pgTable(
  'activity_history',
  {
    id: serial('id').primaryKey(),
    activityId: integer('activity_id')
      .notNull()
      .references(() => activities.id),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    actionType: varchar('action_type', { length: 50 }).notNull(), // 'created', 'updated', 'deleted', `activity_status_changed`, etc.
    changes: jsonb('changes'), // Array of change objects: [{field, oldValue, newValue}]
    notes: text('notes'), // Optional user notes
    timestamp: timestamp('timestamp', { withTimezone: true })
      .notNull()
      .defaultNow(),
    activityTitle: text('activity_title'),
    activityDisplayId: text('activity_display_id'),
    actorDisplayName: text('actor_display_name'),
    actorUsername: text('actor_username'),
    categoryTagsText: text('category_tags_text'),
  },
  (table) => [
    index('activity_history_activity_id_idx').on(table.activityId),
    index('activity_history_user_id_idx').on(table.userId),
    index('activity_history_timestamp_idx').on(table.timestamp),
    // Composite index for efficient chronological queries per activity
    index('activity_history_activity_id_timestamp_idx').on(
      table.activityId,
      table.timestamp
    ),
    // Composite index for keyset pagination (ORDER BY timestamp DESC, id DESC)
    index('idx_activity_history_ts_id').on(table.timestamp, table.id),
    // Trigram index for ILIKE search on notes
    index('idx_activity_history_notes_trgm').using(
      'gin',
      sql`lower(${table.notes}) gin_trgm_ops`
    ),
  ]
);

export const activityHistoryRelations = relations(
  activityHistory,
  ({ one }) => ({
    activity: one(activities, {
      fields: [activityHistory.activityId],
      references: [activities.id],
    }),
    user: one(users, {
      fields: [activityHistory.userId],
      references: [users.id],
    }),
  })
);
