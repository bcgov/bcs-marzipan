import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { normalizedLookupName } from './lookup-name-index';
import { organizationTypes } from './organization-types';
import { users } from './user';

/** Jurisdiction for organizations (separate from organization_types category). */
export const ORGANIZATION_JURISDICTIONS = [
  'bcgov',
  'federal',
  'provincial',
  'local_government',
  'other',
] as const;

export type OrganizationJurisdiction =
  (typeof ORGANIZATION_JURISDICTIONS)[number];

/** Seed id for organization_types.name = 'ministry'. */
export const ORGANIZATION_TYPE_MINISTRY_ID = 1;

/**
 * Organizations — unified catalog for ministries and other public bodies.
 * Ministry-specific data lives on `ministries` (1:1, shared id).
 */
export const organizations = pgTable(
  'organizations',
  {
    id: serial('id').primaryKey(),
    uuid: uuid('uuid').notNull().defaultRandom().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    displayName: varchar('display_name', { length: 255 }).notNull(),
    /** Short code for grid tokens (required for ministry orgs in app). */
    abbreviation: varchar('abbreviation', { length: 8 }),
    organizationTypeId: integer('organization_type_id').references(
      () => organizationTypes.id
    ),
    /** bcgov | federal | provincial | local_government | other */
    jurisdiction: varchar('jurisdiction', { length: 50 }),
    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    description: text('description'),

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
  },
  (table) => ({
    normalizedNameUnique: uniqueIndex(
      'organizations_normalized_name_unique'
    ).on(normalizedLookupName(table.name)),
  })
);

export const organizationsRelations = relations(organizations, ({ one }) => ({
  organizationType: one(organizationTypes, {
    fields: [organizations.organizationTypeId],
    references: [organizationTypes.id],
  }),
  createdByUser: one(users, {
    fields: [organizations.createdBy],
    references: [users.id],
    relationName: 'organizationCreatedBy',
  }),
  updatedByUser: one(users, {
    fields: [organizations.lastUpdatedBy],
    references: [users.id],
    relationName: 'organizationUpdatedBy',
  }),
}));
