/**
 * IMPORTANT: This file should NOT be edited.
 *
 * This file represents documentation of the legacy schema and is required to match
 * the legacy SQL database for migration purposes. Any changes to this file could
 * break the migration process.
 */
import { pgTable, uuid, integer, boolean, varchar, text, timestamp, } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { systemUsers, systemUserMinistries } from './user.legacy';
import { activities } from './activity.legacy';
import { newsFeeds } from './audit.legacy';
/**
 * Ministry table - Government departments
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Ministry.cs
 */
export const ministries = pgTable('ministries', {
    id: uuid('id').primaryKey().defaultRandom(),
    sortOrder: integer('sort_order').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    key: varchar('key', { length: 100 }),
    displayName: varchar('display_name', { length: 255 }),
    abbreviation: varchar('abbreviation', { length: 50 }),
    displayAdditionalName: varchar('display_additional_name', { length: 255 }),
    // Minister information
    ministerName: varchar('minister_name', { length: 255 }),
    ministerEmail: varchar('minister_email', { length: 255 }),
    ministerAddress: text('minister_address'),
    ministerSummary: text('minister_summary'),
    ministerPhotoUrl: varchar('minister_photo_url', { length: 500 }),
    ministerPageHtml: text('minister_page_html'),
    // Social media
    twitterUsername: varchar('twitter_username', { length: 100 }),
    flickrUrl: varchar('flickr_url', { length: 500 }),
    youtubeUrl: varchar('youtube_url', { length: 500 }),
    audioUrl: varchar('audio_url', { length: 500 }),
    // Embed HTML
    facebookEmbedHtml: text('facebook_embed_html'),
    youtubeEmbedHtml: text('youtube_embed_html'),
    audioEmbedHtml: text('audio_embed_html'),
    // Misc HTML
    miscHtml: text('misc_html'),
    miscRightHtml: text('misc_right_html'),
    // URLs
    ministryUrl: varchar('ministry_url', { length: 500 }),
    // Contacts
    contactUserId: integer('contact_user_id'), // FK to SystemUser
    secondContactUserId: integer('second_contact_user_id'), // FK to SystemUser
    weekendContactNumber: varchar('weekend_contact_number', { length: 50 }),
    // News Release IDs (references to News Release Management system)
    topReleaseId: uuid('top_release_id'),
    featureReleaseId: uuid('feature_release_id'),
    // Parent ministry (hierarchical structure)
    parentId: uuid('parent_id'), // FK to Ministry (self-reference)
    // End of Day (EOD) fields
    eodFinalizedDateTime: timestamp('eod_finalized_date_time', {
        withTimezone: true,
    }),
    eodLastRunUserId: integer('eod_last_run_user_id'), // FK to SystemUser
    eodLastRunDateTime: timestamp('eod_last_run_date_time', {
        withTimezone: true,
    }),
    timestamp: timestamp('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(),
});
export const ministriesRelations = relations(ministries, ({ one, many }) => ({
    contactUser: one(systemUsers, {
        fields: [ministries.contactUserId],
        references: [systemUsers.id],
        relationName: 'contactUser',
    }),
    secondContactUser: one(systemUsers, {
        fields: [ministries.secondContactUserId],
        references: [systemUsers.id],
        relationName: 'secondContactUser',
    }),
    eodLastRunUser: one(systemUsers, {
        fields: [ministries.eodLastRunUserId],
        references: [systemUsers.id],
        relationName: 'eodLastRunUser',
    }),
    parent: one(ministries, {
        fields: [ministries.parentId],
        references: [ministries.id],
        relationName: 'parent',
    }),
    children: many(ministries, { relationName: 'parent' }),
    activities: many(activities),
    systemUserMinistries: many(systemUserMinistries),
    newsFeeds: many(newsFeeds),
}));
