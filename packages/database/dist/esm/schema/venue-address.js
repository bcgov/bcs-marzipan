import { pgTable, serial, integer, varchar, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { activities } from './activity';
/**
 * Venue Address table - One-to-one relationship with activities
 * Stores venue address information for event activities
 * Note: Audit fields are not included here as the parent activity already has audit fields
 */
export const venueAddresses = pgTable('venue_addresses', {
    id: serial('id').primaryKey().notNull(),
    activityId: integer('activity_id')
        .notNull()
        .references(() => activities.id, { onDelete: 'cascade' }),
    // Address fields (all nullable)
    venueName: varchar('venue_name', { length: 255 }),
    street: varchar('street', { length: 255 }),
    city: varchar('city', { length: 255 }),
    provinceOrState: varchar('province_or_state', { length: 255 }),
    country: varchar('country', { length: 255 }),
}, (table) => [
    // Ensure one-to-one relationship
    unique('venue_addresses_activity_id_unique').on(table.activityId),
]);
// Relations
export const venueAddressesRelations = relations(venueAddresses, ({ one }) => ({
    activity: one(activities, {
        fields: [venueAddresses.activityId],
        references: [activities.id],
    }),
}));
