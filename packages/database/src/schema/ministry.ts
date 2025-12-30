import {
  pgTable,
  uuid,
  integer,
  boolean,
  varchar,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { systemUsers } from './user';
import { activities } from './activity';

/**
 * Ministry table - Government departments
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Ministry.cs
 * TODO: Consider ministry API for future.
 * TODO: This is a blend of ministries and groups. Use as basis for future group table.
 */
export const ministries = pgTable('ministries', {
  id: uuid('id').primaryKey().defaultRandom(),
  sortOrder: integer('sort_order').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  abbreviation: varchar('abbreviation', { length: 10 }).notNull(),

  // Minister information
  ministerName: varchar('minister_name', { length: 255 }),

  // Contacts
  contactUserId: integer('contact_user_id').references(() => systemUsers.id), // FK to SystemUser
  secondContactUserId: integer('second_contact_user_id').references(
    () => systemUsers.id
  ), // FK to SystemUser

  createdDateTime: timestamp('created_date_time', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => systemUsers.id),
  lastUpdatedDateTime: timestamp('last_updated_date_time', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  lastUpdatedBy: integer('last_updated_by')
    .notNull()
    .references(() => systemUsers.id),
});

export const ministriesRelations = relations(ministries, ({ one, many }) => ({
  contactUser: one(systemUsers, {
    fields: [ministries.contactUserId],
    references: [systemUsers.id],
    relationName: 'contactUser',
  }),
  secondContactUser: one(systemUsers, {
    fields: [ministries.secondContactUserId],
    references: [systemUsers.id],
    relationName: 'secondContactUser',
  }),
  children: many(ministries, { relationName: 'parent' }),
  activities: many(activities),
  // Keep string references for junction tables that don't exist yet
  // TODO: Replace with actual table objects once junction tables are defined
  // @ts-expect-error - Junction table not yet defined
  activitySharedWiths: many('activitySharedWiths'),
  // @ts-expect-error - Junction table not yet defined
  systemUserMinistries: many('systemUserMinistries'),
  // @ts-expect-error - Import would cause circular dependency
  governmentRepresentatives: many('governmentRepresentatives'),
}));
