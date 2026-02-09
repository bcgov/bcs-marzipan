import { pgTable, uuid, integer, boolean, varchar, text, timestamp, } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { ministries } from './ministry';
import { users } from './user';
/**
 * Organizations table - Organizations (superset of ministries)
 * Includes BC government ministries, federal ministries, crown corporations, and other organizations
 * BC government ministries link to the ministries table via ministryId
 */
export const organizations = pgTable('organizations', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    displayName: varchar('display_name', { length: 255 }),
    organizationType: varchar('organization_type', { length: 50 }), // 'bcgov', 'provincial', 'federal', 'other'
    ministryId: uuid('ministry_id').references(() => ministries.id), // FK to ministries (nullable - only for BC gov ministries)
    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    description: text('description'),
    // Audit fields
    createdDateTime: timestamp('created_date_time', { withTimezone: true })
        .notNull()
        .defaultNow(),
    createdBy: integer('created_by')
        .notNull()
        .references(() => users.id), // FK to User
    lastUpdatedDateTime: timestamp('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(),
    lastUpdatedBy: integer('last_updated_by')
        .notNull()
        .references(() => users.id), // FK to User
});
export const organizationsRelations = relations(organizations, ({ one }) => ({
    ministry: one(ministries, {
        fields: [organizations.ministryId],
        references: [ministries.id],
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
    // Reverse relations will be defined in junction tables
}));
