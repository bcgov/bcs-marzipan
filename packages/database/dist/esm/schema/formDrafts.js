import { pgTable, serial, integer, varchar, jsonb, timestamp, index, uniqueIndex, } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import { users } from './user';
/**
 * FormDrafts table - Stores in-progress form data for autosave functionality
 * Allows users to save incomplete forms and resume later without validation constraints
 */
export const formDrafts = pgTable('form_drafts', {
    id: serial('id').primaryKey(),
    // User who created this draft (FK to system_users)
    userId: integer('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    // Type of form being saved (e.g., 'activity', 'event', 'category')
    formType: varchar('form_type', { length: 50 }).notNull(),
    // Optional: ID of the entity being edited (NULL for new items)
    entityId: integer('entity_id'),
    // The incomplete form data stored as JSON (no validation required)
    draftData: jsonb('draft_data').notNull(),
    // Audit timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
    // Expiration date for automatic cleanup (default 30 days from creation)
    expiresAt: timestamp('expires_at', { withTimezone: true }),
}, (table) => ({
    // Partial unique indexes to handle NULL entity_id properly
    // One draft per user per form type when entity_id IS NULL (new items)
    uniqueDraftNew: uniqueIndex('unique_user_form_null_entity')
        .on(table.userId, table.formType)
        .where(sql `entity_id IS NULL`),
    // One draft per user per form type per entity when entity_id IS NOT NULL (edits)
    uniqueDraftEdit: uniqueIndex('unique_user_form_entity')
        .on(table.userId, table.formType, table.entityId)
        .where(sql `entity_id IS NOT NULL`),
    // Indexes for common queries
    userIdIdx: index('form_drafts_user_id_idx').on(table.userId),
    formTypeIdx: index('form_drafts_form_type_idx').on(table.formType),
    expiresAtIdx: index('form_drafts_expires_at_idx').on(table.expiresAt),
}));
/**
 * Relations: FormDraft -> SystemUser
 */
export const formDraftsRelations = relations(formDrafts, ({ one }) => ({
    user: one(users, {
        fields: [formDrafts.userId],
        references: [users.id],
    }),
}));
