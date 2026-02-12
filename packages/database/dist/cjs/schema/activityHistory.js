"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityHistoryRelations = exports.activityHistory = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const activity_1 = require("./activity");
const user_1 = require("./user");
/**
 * ActivityHistory table - Tracks all changes to activities
 * Each entry represents a user action (created, updated, deleted, etc.)
 * with field-level change tracking
 */
exports.activityHistory = (0, pg_core_1.pgTable)('activity_history', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    activityId: (0, pg_core_1.integer)('activity_id')
        .notNull()
        .references(() => activity_1.activities.id),
    userId: (0, pg_core_1.integer)('user_id')
        .notNull()
        .references(() => user_1.users.id),
    actionType: (0, pg_core_1.varchar)('action_type', { length: 50 }).notNull(), // 'created', 'updated', 'deleted', `activity_status_changed`, etc.
    changes: (0, pg_core_1.jsonb)('changes'), // Array of change objects: [{field, oldValue, newValue}]
    notes: (0, pg_core_1.text)('notes'), // Optional user notes
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(),
}, (table) => [
    (0, pg_core_1.index)('activity_history_activity_id_idx').on(table.activityId),
    (0, pg_core_1.index)('activity_history_user_id_idx').on(table.userId),
    (0, pg_core_1.index)('activity_history_timestamp_idx').on(table.timestamp),
    // Composite index for efficient chronological queries per activity
    (0, pg_core_1.index)('activity_history_activity_id_timestamp_idx').on(table.activityId, table.timestamp),
]);
exports.activityHistoryRelations = (0, drizzle_orm_1.relations)(exports.activityHistory, ({ one }) => ({
    activity: one(activity_1.activities, {
        fields: [exports.activityHistory.activityId],
        references: [activity_1.activities.id],
    }),
    user: one(user_1.users, {
        fields: [exports.activityHistory.userId],
        references: [user_1.users.id],
    }),
}));
