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
 */
export const ministries = pgTable('ministries', {
  id: uuid('id').primaryKey().defaultRandom(),
  sortOrder: integer('sort_order').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  displayName: varchar('display_name', { length: 255 }),
  abbreviation: varchar('abbreviation', { length: 50 }),

  // Minister information
  ministerName: varchar('minister_name', { length: 255 }),

  // Contacts
  contactUserId: integer('contact_user_id'), // FK to SystemUser
  secondContactUserId: integer('second_contact_user_id'), // FK to SystemUser

  // Parent ministry (hierarchical structure)
  parentId: uuid('parent_id'), // FK to Ministry (self-reference) (TODO: Consider removing)

  // End of Day (EOD) fields
  eodLastRunUserId: integer('eod_last_run_user_id'), // FK to SystemUser (TODO: Consider removing)

  timestamp: timestamp('timestamp', { withTimezone: true })
    .notNull()
    .defaultNow(),
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
  eodLastRunUser: one(systemUsers, {
    fields: [ministries.eodLastRunUserId],
    references: [systemUsers.id],
    relationName: 'eodLastRunUser',
  }),
  parent: one(ministries, {
    fields: [ministries.parentId],
    references: [ministries.id],
    relationName: 'parent',
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
