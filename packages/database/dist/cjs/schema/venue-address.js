"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.venueAddressesRelations = exports.venueAddresses = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const activity_1 = require("./activity");
/**
 * Venue Address table - One-to-one relationship with activities
 * Stores venue address information for event activities
 * Note: Audit fields are not included here as the parent activity already has audit fields
 */
exports.venueAddresses = (0, pg_core_1.pgTable)('venue_addresses', {
    id: (0, pg_core_1.serial)('id').primaryKey().notNull(),
    activityId: (0, pg_core_1.integer)('activity_id')
        .notNull()
        .references(() => activity_1.activities.id, { onDelete: 'cascade' }),
    // Address fields (all nullable)
    venueName: (0, pg_core_1.varchar)('venue_name', { length: 255 }),
    street: (0, pg_core_1.varchar)('street', { length: 255 }),
    city: (0, pg_core_1.varchar)('city', { length: 255 }),
    provinceOrState: (0, pg_core_1.varchar)('province_or_state', { length: 255 }),
    country: (0, pg_core_1.varchar)('country', { length: 255 }),
}, (table) => [
    // Ensure one-to-one relationship
    (0, pg_core_1.unique)('venue_addresses_activity_id_unique').on(table.activityId),
]);
// Relations
exports.venueAddressesRelations = (0, drizzle_orm_1.relations)(exports.venueAddresses, ({ one }) => ({
    activity: one(activity_1.activities, {
        fields: [exports.venueAddresses.activityId],
        references: [activity_1.activities.id],
    }),
}));
