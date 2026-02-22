import { index, integer, pgTable, serial, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

import { users } from './user';

/**
 * Record locks - one row per locked entity (e.g. activity).
 * Used for pessimistic edit locking so only one user can edit at a time.
 */
export const recordLocks = pgTable(
  'record_locks',
  {
    id: serial('id').primaryKey(),
    entityType: varchar('entity_type', { length: 50 }).notNull(),
    entityId: integer('entity_id').notNull(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    username: varchar('username', { length: 100 }).notNull(),
    sessionId: varchar('session_id', { length: 100 }),
    acquiredAt: timestamp('acquired_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    lastRenewedAt: timestamp('last_renewed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueEntity: uniqueIndex('record_locks_entity_type_entity_id_unique').on(
      table.entityType,
      table.entityId
    ),
    expiresAtIdx: index('record_locks_expires_at_idx').on(table.expiresAt),
    userIdIdx: index('record_locks_user_id_idx').on(table.userId),
  })
);

export type RecordLock = typeof recordLocks.$inferSelect;
export type NewRecordLock = typeof recordLocks.$inferInsert;
