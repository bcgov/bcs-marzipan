import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  varchar,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';

import { users } from './user';

/**
 * Roles table - System and custom roles for RBAC
 * System roles (Viewer, Editor, Advanced Viewer, Advanced Editor, Admin, System Admin) cannot be deleted.
 * Admins can add custom roles with granular permission assignments.
 * createdBy/updatedBy are nullable to handle system roles created via migrations.
 */
export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  isSystem: boolean('is_system').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: integer('created_by').references((): AnyPgColumn => users.id, {
    onDelete: 'set null',
  }),
  updatedBy: integer('updated_by').references((): AnyPgColumn => users.id, {
    onDelete: 'set null',
  }),
});

/**
 * Permissions table - Catalog of all granular permissions
 * Key format supports multiple patterns:
 *   - resource.action (e.g., activities.create, reports.export)
 *   - resource.scope.action (e.g., activities.budget.edit, activities.filter.dateRange.view)
 * The key is the source of truth. Resource, scope, and action are denormalized fields
 * for query convenience and may be null for non-standard key formats.
 * createdBy/updatedBy are nullable to handle permissions created via migrations/seeds.
 */
export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 200 }).notNull().unique(),
  displayName: varchar('display_name', { length: 200 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  subcategory: varchar('subcategory', { length: 100 }),
  description: text('description'),
  resource: varchar('resource', { length: 100 }), // Optional: extracted from key for querying
  action: varchar('action', { length: 50 }), // Optional: extracted from key for querying
  scope: varchar('scope', { length: 100 }), // Optional: scope/context (e.g. field, filter, report, etc.)
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: integer('created_by').references((): AnyPgColumn => users.id, {
    onDelete: 'set null',
  }),
  updatedBy: integer('updated_by').references((): AnyPgColumn => users.id, {
    onDelete: 'set null',
  }),
});

/**
 * RolePermissions junction table - Maps which permissions are active for each role
 * createdBy/updatedBy are nullable to handle mappings created via migrations/seeds.
 */
export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: integer('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: integer('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: integer('created_by').references((): AnyPgColumn => users.id, {
      onDelete: 'set null',
    }),
    updatedBy: integer('updated_by').references((): AnyPgColumn => users.id, {
      onDelete: 'set null',
    }),
  },
  (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })]
);

export const rolesRelations = relations(roles, ({ one, many }) => ({
  rolePermissions: many(rolePermissions),
  creator: one(users, {
    fields: [roles.createdBy],
    references: [users.id],
    relationName: 'roleCreator',
  }),
  updater: one(users, {
    fields: [roles.updatedBy],
    references: [users.id],
    relationName: 'roleUpdater',
  }),
}));

export const permissionsRelations = relations(permissions, ({ one, many }) => ({
  rolePermissions: many(rolePermissions),
  creator: one(users, {
    fields: [permissions.createdBy],
    references: [users.id],
    relationName: 'permissionCreator',
  }),
  updater: one(users, {
    fields: [permissions.updatedBy],
    references: [users.id],
    relationName: 'permissionUpdater',
  }),
}));

export const rolePermissionsRelations = relations(
  rolePermissions,
  ({ one }) => ({
    role: one(roles, {
      fields: [rolePermissions.roleId],
      references: [roles.id],
    }),
    permission: one(permissions, {
      fields: [rolePermissions.permissionId],
      references: [permissions.id],
    }),
    creator: one(users, {
      fields: [rolePermissions.createdBy],
      references: [users.id],
      relationName: 'rolePermissionCreator',
    }),
    updater: one(users, {
      fields: [rolePermissions.updatedBy],
      references: [users.id],
      relationName: 'rolePermissionUpdater',
    }),
  })
);
