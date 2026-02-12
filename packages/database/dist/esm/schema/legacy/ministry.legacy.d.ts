/**
 * IMPORTANT: This file should NOT be edited.
 *
 * This file represents documentation of the legacy schema and is required to match
 * the legacy SQL database for migration purposes. Any changes to this file could
 * break the migration process.
 */
/**
 * Ministry table - Government departments
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/Ministry.cs
 */
export declare const ministries: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "ministries";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "ministries";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        sortOrder: import("drizzle-orm/pg-core").PgColumn<{
            name: "sort_order";
            tableName: "ministries";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        isActive: import("drizzle-orm/pg-core").PgColumn<{
            name: "is_active";
            tableName: "ministries";
            dataType: "boolean";
            columnType: "PgBoolean";
            data: boolean;
            driverParam: boolean;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        key: import("drizzle-orm/pg-core").PgColumn<{
            name: "key";
            tableName: "ministries";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 100;
        }>;
        displayName: import("drizzle-orm/pg-core").PgColumn<{
            name: "display_name";
            tableName: "ministries";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 255;
        }>;
        abbreviation: import("drizzle-orm/pg-core").PgColumn<{
            name: "abbreviation";
            tableName: "ministries";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 50;
        }>;
        displayAdditionalName: import("drizzle-orm/pg-core").PgColumn<{
            name: "display_additional_name";
            tableName: "ministries";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 255;
        }>;
        ministerName: import("drizzle-orm/pg-core").PgColumn<{
            name: "minister_name";
            tableName: "ministries";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 255;
        }>;
        ministerEmail: import("drizzle-orm/pg-core").PgColumn<{
            name: "minister_email";
            tableName: "ministries";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 255;
        }>;
        ministerAddress: import("drizzle-orm/pg-core").PgColumn<{
            name: "minister_address";
            tableName: "ministries";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        ministerSummary: import("drizzle-orm/pg-core").PgColumn<{
            name: "minister_summary";
            tableName: "ministries";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        ministerPhotoUrl: import("drizzle-orm/pg-core").PgColumn<{
            name: "minister_photo_url";
            tableName: "ministries";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 500;
        }>;
        ministerPageHtml: import("drizzle-orm/pg-core").PgColumn<{
            name: "minister_page_html";
            tableName: "ministries";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        twitterUsername: import("drizzle-orm/pg-core").PgColumn<{
            name: "twitter_username";
            tableName: "ministries";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 100;
        }>;
        flickrUrl: import("drizzle-orm/pg-core").PgColumn<{
            name: "flickr_url";
            tableName: "ministries";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 500;
        }>;
        youtubeUrl: import("drizzle-orm/pg-core").PgColumn<{
            name: "youtube_url";
            tableName: "ministries";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 500;
        }>;
        audioUrl: import("drizzle-orm/pg-core").PgColumn<{
            name: "audio_url";
            tableName: "ministries";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 500;
        }>;
        facebookEmbedHtml: import("drizzle-orm/pg-core").PgColumn<{
            name: "facebook_embed_html";
            tableName: "ministries";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        youtubeEmbedHtml: import("drizzle-orm/pg-core").PgColumn<{
            name: "youtube_embed_html";
            tableName: "ministries";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        audioEmbedHtml: import("drizzle-orm/pg-core").PgColumn<{
            name: "audio_embed_html";
            tableName: "ministries";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        miscHtml: import("drizzle-orm/pg-core").PgColumn<{
            name: "misc_html";
            tableName: "ministries";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        miscRightHtml: import("drizzle-orm/pg-core").PgColumn<{
            name: "misc_right_html";
            tableName: "ministries";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        ministryUrl: import("drizzle-orm/pg-core").PgColumn<{
            name: "ministry_url";
            tableName: "ministries";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 500;
        }>;
        contactUserId: import("drizzle-orm/pg-core").PgColumn<{
            name: "contact_user_id";
            tableName: "ministries";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        secondContactUserId: import("drizzle-orm/pg-core").PgColumn<{
            name: "second_contact_user_id";
            tableName: "ministries";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        weekendContactNumber: import("drizzle-orm/pg-core").PgColumn<{
            name: "weekend_contact_number";
            tableName: "ministries";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 50;
        }>;
        topReleaseId: import("drizzle-orm/pg-core").PgColumn<{
            name: "top_release_id";
            tableName: "ministries";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        featureReleaseId: import("drizzle-orm/pg-core").PgColumn<{
            name: "feature_release_id";
            tableName: "ministries";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        parentId: import("drizzle-orm/pg-core").PgColumn<{
            name: "parent_id";
            tableName: "ministries";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        eodFinalizedDateTime: import("drizzle-orm/pg-core").PgColumn<{
            name: "eod_finalized_date_time";
            tableName: "ministries";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        eodLastRunUserId: import("drizzle-orm/pg-core").PgColumn<{
            name: "eod_last_run_user_id";
            tableName: "ministries";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        eodLastRunDateTime: import("drizzle-orm/pg-core").PgColumn<{
            name: "eod_last_run_date_time";
            tableName: "ministries";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        timestamp: import("drizzle-orm/pg-core").PgColumn<{
            name: "timestamp";
            tableName: "ministries";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
export declare const ministriesRelations: import("drizzle-orm").Relations<"ministries", {
    contactUser: import("drizzle-orm").One<"system_users", false>;
    secondContactUser: import("drizzle-orm").One<"system_users", false>;
    eodLastRunUser: import("drizzle-orm").One<"system_users", false>;
    parent: import("drizzle-orm").One<"ministries", false>;
    children: import("drizzle-orm").Many<"ministries">;
    activities: import("drizzle-orm").Many<"activities">;
    systemUserMinistries: import("drizzle-orm").Many<"system_user_ministries">;
    newsFeeds: import("drizzle-orm").Many<"news_feeds">;
}>;
//# sourceMappingURL=ministry.legacy.d.ts.map