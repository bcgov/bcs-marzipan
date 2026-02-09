"use strict";
/**
 * IMPORTANT: This file should NOT be edited.
 *
 * This file represents documentation of the legacy schema and is required to match
 * the legacy SQL database for migration purposes. Any changes to this file could
 * break the migration process.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ministriesRelations = exports.ministries = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const user_legacy_1 = require("./user.legacy");
const activity_legacy_1 = require("./activity.legacy");
const audit_legacy_1 = require("./audit.legacy");
/**
 * Ministry table - Government departments
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Ministry.cs
 */
exports.ministries = (0, pg_core_1.pgTable)('ministries', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull(),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    key: (0, pg_core_1.varchar)('key', { length: 100 }),
    displayName: (0, pg_core_1.varchar)('display_name', { length: 255 }),
    abbreviation: (0, pg_core_1.varchar)('abbreviation', { length: 50 }),
    displayAdditionalName: (0, pg_core_1.varchar)('display_additional_name', { length: 255 }),
    // Minister information
    ministerName: (0, pg_core_1.varchar)('minister_name', { length: 255 }),
    ministerEmail: (0, pg_core_1.varchar)('minister_email', { length: 255 }),
    ministerAddress: (0, pg_core_1.text)('minister_address'),
    ministerSummary: (0, pg_core_1.text)('minister_summary'),
    ministerPhotoUrl: (0, pg_core_1.varchar)('minister_photo_url', { length: 500 }),
    ministerPageHtml: (0, pg_core_1.text)('minister_page_html'),
    // Social media
    twitterUsername: (0, pg_core_1.varchar)('twitter_username', { length: 100 }),
    flickrUrl: (0, pg_core_1.varchar)('flickr_url', { length: 500 }),
    youtubeUrl: (0, pg_core_1.varchar)('youtube_url', { length: 500 }),
    audioUrl: (0, pg_core_1.varchar)('audio_url', { length: 500 }),
    // Embed HTML
    facebookEmbedHtml: (0, pg_core_1.text)('facebook_embed_html'),
    youtubeEmbedHtml: (0, pg_core_1.text)('youtube_embed_html'),
    audioEmbedHtml: (0, pg_core_1.text)('audio_embed_html'),
    // Misc HTML
    miscHtml: (0, pg_core_1.text)('misc_html'),
    miscRightHtml: (0, pg_core_1.text)('misc_right_html'),
    // URLs
    ministryUrl: (0, pg_core_1.varchar)('ministry_url', { length: 500 }),
    // Contacts
    contactUserId: (0, pg_core_1.integer)('contact_user_id'), // FK to SystemUser
    secondContactUserId: (0, pg_core_1.integer)('second_contact_user_id'), // FK to SystemUser
    weekendContactNumber: (0, pg_core_1.varchar)('weekend_contact_number', { length: 50 }),
    // News Release IDs (references to News Release Management system)
    topReleaseId: (0, pg_core_1.uuid)('top_release_id'),
    featureReleaseId: (0, pg_core_1.uuid)('feature_release_id'),
    // Parent ministry (hierarchical structure)
    parentId: (0, pg_core_1.uuid)('parent_id'), // FK to Ministry (self-reference)
    // End of Day (EOD) fields
    eodFinalizedDateTime: (0, pg_core_1.timestamp)('eod_finalized_date_time', {
        withTimezone: true,
    }),
    eodLastRunUserId: (0, pg_core_1.integer)('eod_last_run_user_id'), // FK to SystemUser
    eodLastRunDateTime: (0, pg_core_1.timestamp)('eod_last_run_date_time', {
        withTimezone: true,
    }),
    timestamp: (0, pg_core_1.timestamp)('timestamp', { withTimezone: true })
        .notNull()
        .defaultNow(),
});
exports.ministriesRelations = (0, drizzle_orm_1.relations)(exports.ministries, ({ one, many }) => ({
    contactUser: one(user_legacy_1.systemUsers, {
        fields: [exports.ministries.contactUserId],
        references: [user_legacy_1.systemUsers.id],
        relationName: 'contactUser',
    }),
    secondContactUser: one(user_legacy_1.systemUsers, {
        fields: [exports.ministries.secondContactUserId],
        references: [user_legacy_1.systemUsers.id],
        relationName: 'secondContactUser',
    }),
    eodLastRunUser: one(user_legacy_1.systemUsers, {
        fields: [exports.ministries.eodLastRunUserId],
        references: [user_legacy_1.systemUsers.id],
        relationName: 'eodLastRunUser',
    }),
    parent: one(exports.ministries, {
        fields: [exports.ministries.parentId],
        references: [exports.ministries.id],
        relationName: 'parent',
    }),
    children: many(exports.ministries, { relationName: 'parent' }),
    activities: many(activity_legacy_1.activities),
    systemUserMinistries: many(user_legacy_1.systemUserMinistries),
    newsFeeds: many(audit_legacy_1.newsFeeds),
}));
