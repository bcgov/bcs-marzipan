import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

import { permissions } from './rbac';
import { users } from './user';

export const permissionVisibilityAudit = pgTable(
  'permission_visibility_audit',
  {
    id: serial('id').primaryKey(),
    permissionId: integer('permission_id')
      .notNull()
      .references(() => permissions.id),
    changedBy: integer('changed_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    oldValue: boolean('old_value').notNull(),
    newValue: boolean('new_value').notNull(),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  }
);

export type PermissionVisibilityAudit =
  typeof permissionVisibilityAudit.$inferSelect;
export type NewPermissionVisibilityAudit =
  typeof permissionVisibilityAudit.$inferInsert;
