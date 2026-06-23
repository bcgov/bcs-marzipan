import { relations } from 'drizzle-orm';
import {
  integer,
  jsonb,
  pgTable,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

import { users } from './user';

export type LookAheadResetSnapshotEntry = {
  activityId: number;
  lookAheadStatus: string | null;
};

/** Singleton row (id = 1) storing pre-clear Look Ahead statuses for one-step rollback. */
export const lookAheadResetSnapshots = pgTable('look_ahead_reset_snapshots', {
  id: integer('id').primaryKey().default(1),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  actorUserId: integer('actor_user_id')
    .notNull()
    .references(() => users.id),
  trigger: varchar('trigger', { length: 20 }).notNull(),
  updatedCount: integer('updated_count').notNull(),
  entries: jsonb('entries').$type<LookAheadResetSnapshotEntry[]>().notNull(),
});

export const lookAheadResetSnapshotsRelations = relations(
  lookAheadResetSnapshots,
  ({ one }) => ({
    actor: one(users, {
      fields: [lookAheadResetSnapshots.actorUserId],
      references: [users.id],
    }),
  })
);
