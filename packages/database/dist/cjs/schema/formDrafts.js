"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formDraftsRelations = exports.formDrafts = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const drizzle_orm_2 = require("drizzle-orm");
const user_1 = require("./user");
/**
 * FormDrafts table - Stores in-progress form data for autosave functionality
 * Allows users to save incomplete forms and resume later without validation constraints
 */
exports.formDrafts = (0, pg_core_1.pgTable)('form_drafts', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    // User who created this draft (FK to system_users)
    userId: (0, pg_core_1.integer)('user_id')
        .notNull()
        .references(() => user_1.users.id, { onDelete: 'cascade' }),
    // Type of form being saved (e.g., 'activity', 'event', 'category')
    formType: (0, pg_core_1.varchar)('form_type', { length: 50 }).notNull(),
    // Optional: ID of the entity being edited (NULL for new items)
    entityId: (0, pg_core_1.integer)('entity_id'),
    // The incomplete form data stored as JSON (no validation required)
    draftData: (0, pg_core_1.jsonb)('draft_data').notNull(),
    // Audit timestamps
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
    // Expiration date for automatic cleanup (default 30 days from creation)
    expiresAt: (0, pg_core_1.timestamp)('expires_at', { withTimezone: true }),
}, (table) => ({
    // Partial unique indexes to handle NULL entity_id properly
    // One draft per user per form type when entity_id IS NULL (new items)
    uniqueDraftNew: (0, pg_core_1.uniqueIndex)('unique_user_form_null_entity')
        .on(table.userId, table.formType)
        .where((0, drizzle_orm_1.sql) `entity_id IS NULL`),
    // One draft per user per form type per entity when entity_id IS NOT NULL (edits)
    uniqueDraftEdit: (0, pg_core_1.uniqueIndex)('unique_user_form_entity')
        .on(table.userId, table.formType, table.entityId)
        .where((0, drizzle_orm_1.sql) `entity_id IS NOT NULL`),
    // Indexes for common queries
    userIdIdx: (0, pg_core_1.index)('form_drafts_user_id_idx').on(table.userId),
    formTypeIdx: (0, pg_core_1.index)('form_drafts_form_type_idx').on(table.formType),
    expiresAtIdx: (0, pg_core_1.index)('form_drafts_expires_at_idx').on(table.expiresAt),
}));
/**
 * Relations: FormDraft -> SystemUser
 */
exports.formDraftsRelations = (0, drizzle_orm_2.relations)(exports.formDrafts, ({ one }) => ({
    user: one(user_1.users, {
        fields: [exports.formDrafts.userId],
        references: [user_1.users.id],
    }),
}));
