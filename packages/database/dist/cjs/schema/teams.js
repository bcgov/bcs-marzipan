"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teamsRelations = exports.teams = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const user_1 = require("./user");
const relations_1 = require("./relations");
const ministry_1 = require("./ministry");
/**
 * Teams table - Groups of system users
 * TODO: placeholder - This is a placeholder table for team-based access control.
 * Represents a group of users that can be used for category access control.
 * Full implementation pending.
 */
exports.teams = (0, pg_core_1.pgTable)('teams', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    displayName: (0, pg_core_1.varchar)('display_name', { length: 255 }),
    description: (0, pg_core_1.text)('description'),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
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
// Relations for Teams
// TODO: placeholder - Add teamSystemUsers junction table when teams are fully implemented
exports.teamsRelations = (0, drizzle_orm_1.relations)(exports.teams, ({ one, many }) => ({
    creator: one(user_1.users, {
        fields: [exports.teams.createdBy],
        references: [user_1.users.id],
        relationName: 'teamCreator',
    }),
    updater: one(user_1.users, {
        fields: [exports.teams.lastUpdatedBy],
        references: [user_1.users.id],
        relationName: 'teamUpdater',
    }),
    teamCategories: many(relations_1.teamCategories),
    podSharedWithTeams: many(ministry_1.podSharedWithTeams, {
        relationName: 'teamPodSharedWithTeams',
    }),
}));
