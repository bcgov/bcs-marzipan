import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  serial,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { users } from './user';

/**
 * Organization type lookup (Ministry, Agency, Crown Corporation, etc.).
 */
export const organizationTypes = pgTable('organization_types', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').notNull().defaultRandom().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdDateTime: timestamp('created_date_time', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  lastUpdatedBy: integer('last_updated_by')
    .notNull()
    .references(() => users.id),
});

export const organizationTypesRelations = relations(
  organizationTypes,
  ({ one }) => ({
    createdByUser: one(users, {
      fields: [organizationTypes.createdBy],
      references: [users.id],
      relationName: 'organizationTypeCreatedBy',
    }),
    updatedByUser: one(users, {
      fields: [organizationTypes.lastUpdatedBy],
      references: [users.id],
      relationName: 'organizationTypeUpdatedBy',
    }),
  })
);
