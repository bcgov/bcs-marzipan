/**
 * ActivityThemes junction table - Many-to-many relationship between Activities and Themes
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivityTheme.cs
 */
export declare const activityThemes: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "activity_themes";
    schema: undefined;
    columns: {
        activityId: import("drizzle-orm/pg-core").PgColumn<{
            name: "activity_id";
            tableName: "activity_themes";
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
        themeId: import("drizzle-orm/pg-core").PgColumn<{
            name: "theme_id";
            tableName: "activity_themes";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
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
            tableName: "activity_themes";
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
        timestamp: import("drizzle-orm/pg-core").PgColumn<{
            name: "timestamp";
            tableName: "activity_themes";
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
/**
 * ActivitySubscriptions junction table - Many-to-many relationship between Activities and Tags (subscriptions)
 * Renamed from activityTags. This table is for activity subscriptions to tags.
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivityTags.cs
 */
export declare const activitySubscriptions: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "activity_subscriptions";
    schema: undefined;
    columns: {
        activityId: import("drizzle-orm/pg-core").PgColumn<{
            name: "activity_id";
            tableName: "activity_subscriptions";
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
        tagId: import("drizzle-orm/pg-core").PgColumn<{
            name: "tag_id";
            tableName: "activity_subscriptions";
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
            tableName: "activity_subscriptions";
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
        timestamp: import("drizzle-orm/pg-core").PgColumn<{
            name: "timestamp";
            tableName: "activity_subscriptions";
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
export declare const activityThemesRelations: import("drizzle-orm").Relations<"activity_themes", {
    activity: import("drizzle-orm").One<"activities", true>;
    theme: import("drizzle-orm").One<"themes", true>;
}>;
export declare const activitySubscriptionsRelations: import("drizzle-orm").Relations<"activity_subscriptions", {
    activity: import("drizzle-orm").One<"activities", true>;
    tag: import("drizzle-orm").One<"tags", true>;
}>;
/**
 * ActivityCategories junction table - Many-to-many relationship between Activities and Categories
 */
export declare const activityCategories: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "activity_categories";
    schema: undefined;
    columns: {
        activityId: import("drizzle-orm/pg-core").PgColumn<{
            name: "activity_id";
            tableName: "activity_categories";
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
        categoryId: import("drizzle-orm/pg-core").PgColumn<{
            name: "category_id";
            tableName: "activity_categories";
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
            tableName: "activity_categories";
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
        timestamp: import("drizzle-orm/pg-core").PgColumn<{
            name: "timestamp";
            tableName: "activity_categories";
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
/**
 * ActivityCommsMaterials junction table - Many-to-many relationship between Activities and CommsMaterials
 */
export declare const activityCommsMaterials: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "activity_comms_materials";
    schema: undefined;
    columns: {
        activityId: import("drizzle-orm/pg-core").PgColumn<{
            name: "activity_id";
            tableName: "activity_comms_materials";
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
        commsMaterialId: import("drizzle-orm/pg-core").PgColumn<{
            name: "comms_material_id";
            tableName: "activity_comms_materials";
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
            tableName: "activity_comms_materials";
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
        timestamp: import("drizzle-orm/pg-core").PgColumn<{
            name: "timestamp";
            tableName: "activity_comms_materials";
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
/**
 * ActivityTranslationLanguages junction table - Many-to-many relationship between Activities and TranslatedLanguages
 */
export declare const activityTranslationsRequired: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "activity_translation_languages";
    schema: undefined;
    columns: {
        activityId: import("drizzle-orm/pg-core").PgColumn<{
            name: "activity_id";
            tableName: "activity_translation_languages";
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
        languageId: import("drizzle-orm/pg-core").PgColumn<{
            name: "language_id";
            tableName: "activity_translation_languages";
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
            tableName: "activity_translation_languages";
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
        timestamp: import("drizzle-orm/pg-core").PgColumn<{
            name: "timestamp";
            tableName: "activity_translation_languages";
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
/**
 * ActivityRepresentatives junction table - Many-to-many relationship between Activities and Representatives
 * Optional free text representativeName for representatives not in the governmentRepresentatives lookup table
 */
export declare const activityRepresentatives: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "activity_representatives";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "activity_representatives";
            dataType: "number";
            columnType: "PgSerial";
            data: number;
            driverParam: number;
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
        activityId: import("drizzle-orm/pg-core").PgColumn<{
            name: "activity_id";
            tableName: "activity_representatives";
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
        representativeId: import("drizzle-orm/pg-core").PgColumn<{
            name: "representative_id";
            tableName: "activity_representatives";
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
        representativeName: import("drizzle-orm/pg-core").PgColumn<{
            name: "representative_name";
            tableName: "activity_representatives";
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
        isActive: import("drizzle-orm/pg-core").PgColumn<{
            name: "is_active";
            tableName: "activity_representatives";
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
        timestamp: import("drizzle-orm/pg-core").PgColumn<{
            name: "timestamp";
            tableName: "activity_representatives";
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
/**
 * activitySharedWithTeams junction table - Many-to-many relationship between Activities and Teams
 * Indicates which teams an activity is shared with (Editor-type teams).
 * Sharing grants access when visibility='team' and marks activities as important/highlighted.
 */
export declare const activitySharedWithTeams: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "activity_shared_with_teams";
    schema: undefined;
    columns: {
        activityId: import("drizzle-orm/pg-core").PgColumn<{
            name: "activity_id";
            tableName: "activity_shared_with_teams";
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
        teamId: import("drizzle-orm/pg-core").PgColumn<{
            name: "team_id";
            tableName: "activity_shared_with_teams";
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
            tableName: "activity_shared_with_teams";
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
        timestamp: import("drizzle-orm/pg-core").PgColumn<{
            name: "timestamp";
            tableName: "activity_shared_with_teams";
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
/**
 * ActivityCommsUsers junction table - Many-to-many relationship between Activities and Users (comms contacts)
 * Contains all comms contacts for an activity, with isLead flag to identify the lead contact.
 * Exactly one contact per activity must have isLead=true (enforced by application logic).
 */
export declare const activityCommsContacts: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "activity_comms_contacts";
    schema: undefined;
    columns: {
        activityId: import("drizzle-orm/pg-core").PgColumn<{
            name: "activity_id";
            tableName: "activity_comms_contacts";
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
        userId: import("drizzle-orm/pg-core").PgColumn<{
            name: "user_id";
            tableName: "activity_comms_contacts";
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
        isLead: import("drizzle-orm/pg-core").PgColumn<{
            name: "is_lead";
            tableName: "activity_comms_contacts";
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
        isActive: import("drizzle-orm/pg-core").PgColumn<{
            name: "is_active";
            tableName: "activity_comms_contacts";
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
        timestamp: import("drizzle-orm/pg-core").PgColumn<{
            name: "timestamp";
            tableName: "activity_comms_contacts";
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
export declare const activityCategoriesRelations: import("drizzle-orm").Relations<"activity_categories", {
    activity: import("drizzle-orm").One<"activities", true>;
    category: import("drizzle-orm").One<"categories", true>;
}>;
export declare const activityCommsMaterialsRelations: import("drizzle-orm").Relations<"activity_comms_materials", {
    activity: import("drizzle-orm").One<"activities", true>;
    commsMaterial: import("drizzle-orm").One<"comms_materials", true>;
}>;
export declare const activityTranslationsRequiredRelations: import("drizzle-orm").Relations<"activity_translation_languages", {
    activity: import("drizzle-orm").One<"activities", true>;
    language: import("drizzle-orm").One<"translated_languages", true>;
}>;
export declare const activityRepresentativesRelations: import("drizzle-orm").Relations<"activity_representatives", {
    activity: import("drizzle-orm").One<"activities", true>;
}>;
export declare const activitySharedWithTeamsRelations: import("drizzle-orm").Relations<"activity_shared_with_teams", {
    activity: import("drizzle-orm").One<"activities", true>;
    team: import("drizzle-orm").One<"teams", true>;
}>;
export declare const activityCommsContactsRelations: import("drizzle-orm").Relations<"activity_comms_contacts", {
    activity: import("drizzle-orm").One<"activities", true>;
    user: import("drizzle-orm").One<"users", true>;
}>;
/**
 * MinistryUsers junction table - Many-to-many relationship between Ministries and Users
 */
export declare const ministryUsers: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "ministry_users";
    schema: undefined;
    columns: {
        ministryId: import("drizzle-orm/pg-core").PgColumn<{
            name: "ministry_id";
            tableName: "ministry_users";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
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
        userId: import("drizzle-orm/pg-core").PgColumn<{
            name: "user_id";
            tableName: "ministry_users";
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
            tableName: "ministry_users";
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
        timestamp: import("drizzle-orm/pg-core").PgColumn<{
            name: "timestamp";
            tableName: "ministry_users";
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
export declare const ministryUsersRelations: import("drizzle-orm").Relations<"ministry_users", {
    ministry: import("drizzle-orm").One<"ministries", true>;
    user: import("drizzle-orm").One<"users", true>;
}>;
/**
 * TeamCategories junction table - Many-to-many relationship between Categories and Teams
 * Controls which teams can view specific categories.
 * If a category has no entries in this table, it is viewable by all teams.
 * If a category has entries, only those teams can view it.
 */
export declare const teamCategories: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "team_categories";
    schema: undefined;
    columns: {
        categoryId: import("drizzle-orm/pg-core").PgColumn<{
            name: "category_id";
            tableName: "team_categories";
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
        teamId: import("drizzle-orm/pg-core").PgColumn<{
            name: "team_id";
            tableName: "team_categories";
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
            tableName: "team_categories";
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
        timestamp: import("drizzle-orm/pg-core").PgColumn<{
            name: "timestamp";
            tableName: "team_categories";
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
export declare const teamCategoriesRelations: import("drizzle-orm").Relations<"team_categories", {
    category: import("drizzle-orm").One<"categories", true>;
    team: import("drizzle-orm").One<"teams", true>;
}>;
/**
 * ActivityTags junction table - Many-to-many relationship between Activities and Tags
 * Renamed from activityKeywords. This table links activities to tags.
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivityKeywords.cs
 * Previously defined as ActivityKeywords in legacy schema - used for HQ Tags
 */
export declare const activityTags: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "activity_tags";
    schema: undefined;
    columns: {
        activityId: import("drizzle-orm/pg-core").PgColumn<{
            name: "activity_id";
            tableName: "activity_tags";
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
        tagId: import("drizzle-orm/pg-core").PgColumn<{
            name: "tag_id";
            tableName: "activity_tags";
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
            tableName: "activity_tags";
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
        timestamp: import("drizzle-orm/pg-core").PgColumn<{
            name: "timestamp";
            tableName: "activity_tags";
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
/**
 * ActivitySectors junction table - Many-to-many relationship between Activities and Sectors
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivitySectors.cs
 */
export declare const activitySectors: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "activity_sectors";
    schema: undefined;
    columns: {
        activityId: import("drizzle-orm/pg-core").PgColumn<{
            name: "activity_id";
            tableName: "activity_sectors";
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
        sectorId: import("drizzle-orm/pg-core").PgColumn<{
            name: "sector_id";
            tableName: "activity_sectors";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
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
            tableName: "activity_sectors";
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
        timestamp: import("drizzle-orm/pg-core").PgColumn<{
            name: "timestamp";
            tableName: "activity_sectors";
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
/**
 * FavoriteActivity junction table - Many-to-many relationship between Users and Activities (Watch Lists/Favorites)
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/FavoriteActivity.cs
 */
export declare const favoriteActivities: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "favorite_activities";
    schema: undefined;
    columns: {
        userId: import("drizzle-orm/pg-core").PgColumn<{
            name: "user_id";
            tableName: "favorite_activities";
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
        activityId: import("drizzle-orm/pg-core").PgColumn<{
            name: "activity_id";
            tableName: "favorite_activities";
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
    };
    dialect: "pg";
}>;
/**
 * activityReportSettings junction table - Per-activity report settings
 * Stores whether an activity is omitted from a specific report.
 *
 * Every activity must have a setting for every active report.
 * When an activity is created, default rows are created with omitted=false.
 * Users can update the omitted value to exclude activities from specific reports.
 *
 * Inclusion logic:
 * - If omitted=true: activity is omitted from report (regardless of isConfidential)
 * - If omitted=false and isConfidential=false: activity included with standard details
 * - If omitted=false and isConfidential=true: activity included with placeholder (redacted) details
 */
export declare const activityReportSettings: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "activity_report_settings";
    schema: undefined;
    columns: {
        activityId: import("drizzle-orm/pg-core").PgColumn<{
            name: "activity_id";
            tableName: "activity_report_settings";
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
        reportId: import("drizzle-orm/pg-core").PgColumn<{
            name: "report_id";
            tableName: "activity_report_settings";
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
        omitted: import("drizzle-orm/pg-core").PgColumn<{
            name: "omitted";
            tableName: "activity_report_settings";
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
        timestamp: import("drizzle-orm/pg-core").PgColumn<{
            name: "timestamp";
            tableName: "activity_report_settings";
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
export declare const activityTagsRelations: import("drizzle-orm").Relations<"activity_tags", {
    activity: import("drizzle-orm").One<"activities", true>;
    tag: import("drizzle-orm").One<"tags", true>;
}>;
export declare const activitySectorsRelations: import("drizzle-orm").Relations<"activity_sectors", {
    activity: import("drizzle-orm").One<"activities", true>;
    sector: import("drizzle-orm").One<"sectors", true>;
}>;
export declare const favoriteActivitiesRelations: import("drizzle-orm").Relations<"favorite_activities", {
    user: import("drizzle-orm").One<"users", true>;
    activity: import("drizzle-orm").One<"activities", true>;
}>;
export declare const activityReportSettingsRelations: import("drizzle-orm").Relations<"activity_report_settings", {
    activity: import("drizzle-orm").One<"activities", true>;
    report: import("drizzle-orm").One<"reports", true>;
}>;
//# sourceMappingURL=relations.d.ts.map