import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  pgTable,
  primaryKey,
  timestamp,
} from 'drizzle-orm/pg-core';

import { activities } from './activity';
import { users } from './user';

/**
 * UserActivityFavourites table - Per-user list of favourited activities.
 * A composite primary key on (userId, activityId) enforces uniqueness.
 */
export const userActivityFavourites = pgTable(
  'user_activity_favourites',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    activityId: integer('activity_id')
      .notNull()
      .references(() => activities.id, { onDelete: 'cascade' }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.activityId] }),
    index('uaf_user_id_idx').on(table.userId),
    index('uaf_activity_id_idx').on(table.activityId),
  ]
);

export const userActivityFavouritesRelations = relations(
  userActivityFavourites,
  ({ one }) => ({
    user: one(users, {
      fields: [userActivityFavourites.userId],
      references: [users.id],
    }),
    activity: one(activities, {
      fields: [userActivityFavourites.activityId],
      references: [activities.id],
    }),
  })
);
