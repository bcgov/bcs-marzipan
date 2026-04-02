import {
  index,
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

import { activities } from './activity';
import { users } from './user';

export const editLockPendingHandoffStatuses = [
  'pending',
  'processing',
  'completed',
  'cancelled',
] as const;
export type EditLockPendingHandoffStatus =
  (typeof editLockPendingHandoffStatuses)[number];

/**
 * When an admin requests to take the edit lock, a grace period runs before transfer.
 */
export const editLockPendingHandoffs = pgTable(
  'edit_lock_pending_handoffs',
  {
    id: serial('id').primaryKey(),
    activityId: integer('activity_id')
      .notNull()
      .references(() => activities.id, { onDelete: 'cascade' }),
    fromUserId: integer('from_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    toUserId: integer('to_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    graceEndsAt: timestamp('grace_ends_at', { withTimezone: true }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    activityIdIdx: index('edit_lock_pending_handoffs_activity_id_idx').on(
      table.activityId
    ),
    dueIdx: index('edit_lock_pending_handoffs_due_idx').on(table.graceEndsAt),
  })
);
