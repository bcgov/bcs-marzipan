import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

import { users } from './user';

/**
 * Shared notification event payload. One row per domain event.
 */
export const notificationEvents = pgTable(
  'notification_events',
  {
    id: serial('id').primaryKey(),
    eventType: varchar('event_type', { length: 120 }).notNull(),
    entityType: varchar('entity_type', { length: 80 }).notNull(),
    entityId: integer('entity_id').notNull(),
    changeType: varchar('change_type', { length: 80 }).notNull(),
    summary: text('summary').notNull(),
    details: jsonb('details'),
    actorUserId: integer('actor_user_id')
      .notNull()
      .references(() => users.id),
    actorUsername: varchar('actor_username', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_notification_events_created_at').on(table.createdAt),
    index('idx_notification_events_entity').on(
      table.entityType,
      table.entityId
    ),
  ]
);

/**
 * Per-user inbox state for each notification event.
 */
export const notificationRecipients = pgTable(
  'notification_recipients',
  {
    id: serial('id').primaryKey(),
    eventId: integer('event_id')
      .notNull()
      .references(() => notificationEvents.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 20 }).notNull().default('unread'),
    readAt: timestamp('read_at', { withTimezone: true }),
    dismissedAt: timestamp('dismissed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_notification_recipients_event_user').on(
      table.eventId,
      table.userId
    ),
    index('idx_notification_recipients_user_status').on(
      table.userId,
      table.status
    ),
    index('idx_notification_recipients_user_created_at').on(
      table.userId,
      table.createdAt
    ),
  ]
);

export const notificationEventsRelations = relations(
  notificationEvents,
  ({ one, many }) => ({
    actor: one(users, {
      fields: [notificationEvents.actorUserId],
      references: [users.id],
      relationName: 'notificationEventActor',
    }),
    recipients: many(notificationRecipients),
  })
);

export const notificationRecipientsRelations = relations(
  notificationRecipients,
  ({ one }) => ({
    event: one(notificationEvents, {
      fields: [notificationRecipients.eventId],
      references: [notificationEvents.id],
    }),
    user: one(users, {
      fields: [notificationRecipients.userId],
      references: [users.id],
      relationName: 'notificationRecipientUser',
    }),
  })
);

export type NotificationEvent = typeof notificationEvents.$inferSelect;
export type NotificationRecipient = typeof notificationRecipients.$inferSelect;
