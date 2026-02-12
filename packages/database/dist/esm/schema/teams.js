import { pgTable, serial, varchar, integer, boolean, text, timestamp, } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './user';
import { teamCategories } from './relations';
import { podSharedWithTeams } from './ministry';
/**
 * Teams table - Groups of system users
 * TODO: placeholder - This is a placeholder table for team-based access control.
 * Represents a group of users that can be used for category access control.
 * Full implementation pending.
 */
export const teams = pgTable('teams', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    displayName: varchar('display_name', { length: 255 }),
    description: text('description'),
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
// Relations for Teams
// TODO: placeholder - Add teamSystemUsers junction table when teams are fully implemented
export const teamsRelations = relations(teams, ({ one, many }) => ({
    creator: one(users, {
        fields: [teams.createdBy],
        references: [users.id],
        relationName: 'teamCreator',
    }),
    updater: one(users, {
        fields: [teams.lastUpdatedBy],
        references: [users.id],
        relationName: 'teamUpdater',
    }),
    teamCategories: many(teamCategories),
    podSharedWithTeams: many(podSharedWithTeams, {
        relationName: 'teamPodSharedWithTeams',
    }),
}));
