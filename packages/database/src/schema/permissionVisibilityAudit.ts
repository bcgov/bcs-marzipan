import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const permissionVisibilityAudit = pgTable(
  'permission_visibility_audit',
  {
    id: serial('id').primaryKey(),
    permissionId: integer('permission_id').notNull(),
    changedBy: integer('changed_by'),
    oldValue: integer('old_value').notNull(),
    newValue: integer('new_value').notNull(),
    note: text('note'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  }
);

export type PermissionVisibilityAudit = typeof permissionVisibilityAudit;
