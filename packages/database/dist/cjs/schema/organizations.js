"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.organizationsRelations = exports.organizations = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const ministry_1 = require("./ministry");
const user_1 = require("./user");
/**
 * Organizations table - Organizations (superset of ministries)
 * Includes BC government ministries, federal ministries, crown corporations, and other organizations
 * BC government ministries link to the ministries table via ministryId
 */
exports.organizations = (0, pg_core_1.pgTable)('organizations', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    displayName: (0, pg_core_1.varchar)('display_name', { length: 255 }),
    organizationType: (0, pg_core_1.varchar)('organization_type', { length: 50 }), // 'bcgov', 'provincial', 'federal', 'other'
    ministryId: (0, pg_core_1.uuid)('ministry_id').references(() => ministry_1.ministries.id), // FK to ministries (nullable - only for BC gov ministries)
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    description: (0, pg_core_1.text)('description'),
    // Audit fields
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true })
        .notNull()
        .defaultNow(),
    createdBy: (0, pg_core_1.integer)('created_by')
        .notNull()
        .references(() => user_1.users.id), // FK to User
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(),
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by')
        .notNull()
        .references(() => user_1.users.id), // FK to User
});
exports.organizationsRelations = (0, drizzle_orm_1.relations)(exports.organizations, ({ one }) => ({
    ministry: one(ministry_1.ministries, {
        fields: [exports.organizations.ministryId],
        references: [ministry_1.ministries.id],
    }),
    createdByUser: one(user_1.users, {
        fields: [exports.organizations.createdBy],
        references: [user_1.users.id],
        relationName: 'organizationCreatedBy',
    }),
    updatedByUser: one(user_1.users, {
        fields: [exports.organizations.lastUpdatedBy],
        references: [user_1.users.id],
        relationName: 'organizationUpdatedBy',
    }),
    // Reverse relations will be defined in junction tables
}));
