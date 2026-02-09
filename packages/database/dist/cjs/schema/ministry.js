"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.podSharedWithTeamsRelations = exports.podMinistriesRelations = exports.podsRelations = exports.podSharedWithTeams = exports.podMinistries = exports.pods = exports.ministriesRelations = exports.ministries = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const user_1 = require("./user");
const activity_1 = require("./activity");
const relations_1 = require("./relations");
const lookups_1 = require("./lookups");
const teams_1 = require("./teams");
/**
 * Ministry table - Government departments
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Ministry.cs
 * TODO: Consider ministry API for future.
 * TODO: This is a blend of ministries and groups. Use as basis for future group table.
 */
exports.ministries = (0, pg_core_1.pgTable)('ministries', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull(),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    displayName: (0, pg_core_1.varchar)('display_name', { length: 255 }).notNull(),
    abbreviation: (0, pg_core_1.varchar)('abbreviation', { length: 10 }).notNull(),
    // Minister information
    ministerName: (0, pg_core_1.varchar)('minister_name', { length: 255 }),
    // Contacts
    contactUserId: (0, pg_core_1.integer)('contact_user_id').references(() => user_1.users.id), // FK to User
    secondContactUserId: (0, pg_core_1.integer)('second_contact_user_id').references(() => user_1.users.id), // FK to User
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true })
        .notNull()
        .defaultNow(),
    createdBy: (0, pg_core_1.integer)('created_by')
        .notNull()
        .references(() => user_1.users.id),
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(),
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by')
        .notNull()
        .references(() => user_1.users.id),
});
exports.ministriesRelations = (0, drizzle_orm_1.relations)(exports.ministries, ({ one, many }) => ({
    contactUser: one(user_1.users, {
        fields: [exports.ministries.contactUserId],
        references: [user_1.users.id],
        relationName: 'contactUser',
    }),
    secondContactUser: one(user_1.users, {
        fields: [exports.ministries.secondContactUserId],
        references: [user_1.users.id],
        relationName: 'secondContactUser',
    }),
    children: many(exports.ministries, { relationName: 'parent' }),
    activities: many(activity_1.activities),
    ministryUsers: many(relations_1.ministryUsers),
    governmentRepresentatives: many(lookups_1.governmentRepresentatives),
    podMinistries: many(exports.podMinistries, { relationName: 'ministryPodMinistries' }),
}));
/**
 * Pods table - Collections of ministries defined by users
 * Admins and editors can create pods with global, team-scoped, or private visibility.
 * Users access pods through their team memberships.
 */
exports.pods = (0, pg_core_1.pgTable)('pods', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 200 }).notNull(),
    description: (0, pg_core_1.varchar)('description', { length: 500 }),
    visibility: (0, pg_core_1.varchar)('visibility', { length: 50 })
        .notNull()
        .default('private'), // 'global', 'team', 'private'
    createdBy: (0, pg_core_1.integer)('created_by')
        .notNull()
        .references(() => user_1.users.id),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    createdDateTime: (0, pg_core_1.timestamp)('created_date_time', { withTimezone: true })
        .notNull()
        .defaultNow(),
    lastUpdatedDateTime: (0, pg_core_1.timestamp)('last_updated_date_time', {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(),
    lastUpdatedBy: (0, pg_core_1.integer)('last_updated_by')
        .notNull()
        .references(() => user_1.users.id),
});
/**
 * PodMinistries junction table - Many-to-many relationship between Pods and Ministries
 * Defines which ministries are included in a pod
 */
exports.podMinistries = (0, pg_core_1.pgTable)('pod_ministries', {
    podId: (0, pg_core_1.integer)('pod_id')
        .notNull()
        .references(() => exports.pods.id),
    ministryId: (0, pg_core_1.uuid)('ministry_id')
        .notNull()
        .references(() => exports.ministries.id),
    isPrimary: (0, pg_core_1.boolean)('is_primary').notNull().default(false),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(),
}, (table) => [(0, pg_core_1.primaryKey)({ columns: [table.podId, table.ministryId] })]);
/**
 * PodSharedWithTeams junction table - Many-to-many relationship between Pods and Teams
 * Defines which teams can access a pod (used when visibility is 'team')
 */
exports.podSharedWithTeams = (0, pg_core_1.pgTable)('pod_shared_with_teams', {
    podId: (0, pg_core_1.integer)('pod_id')
        .notNull()
        .references(() => exports.pods.id),
    teamId: (0, pg_core_1.integer)('team_id')
        .notNull()
        .references(() => teams_1.teams.id),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(),
}, (table) => [(0, pg_core_1.primaryKey)({ columns: [table.podId, table.teamId] })]);
// Relations for Pods
exports.podsRelations = (0, drizzle_orm_1.relations)(exports.pods, ({ one, many }) => ({
    creator: one(user_1.users, {
        fields: [exports.pods.createdBy],
        references: [user_1.users.id],
        relationName: 'podCreator',
    }),
    updater: one(user_1.users, {
        fields: [exports.pods.lastUpdatedBy],
        references: [user_1.users.id],
        relationName: 'podUpdater',
    }),
    ministries: many(exports.podMinistries),
    sharedWithTeams: many(exports.podSharedWithTeams),
}));
// Relations for PodMinistries
exports.podMinistriesRelations = (0, drizzle_orm_1.relations)(exports.podMinistries, ({ one }) => ({
    pod: one(exports.pods, {
        fields: [exports.podMinistries.podId],
        references: [exports.pods.id],
    }),
    ministry: one(exports.ministries, {
        fields: [exports.podMinistries.ministryId],
        references: [exports.ministries.id],
    }),
}));
// Relations for PodSharedWithTeams
exports.podSharedWithTeamsRelations = (0, drizzle_orm_1.relations)(exports.podSharedWithTeams, ({ one }) => ({
    pod: one(exports.pods, {
        fields: [exports.podSharedWithTeams.podId],
        references: [exports.pods.id],
    }),
    team: one(teams_1.teams, {
        fields: [exports.podSharedWithTeams.teamId],
        references: [teams_1.teams.id],
    }),
}));
