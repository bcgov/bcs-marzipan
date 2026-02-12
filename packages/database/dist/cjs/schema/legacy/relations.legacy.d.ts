/**
 * IMPORTANT: This file should NOT be edited.
 *
 * This file represents documentation of the legacy schema and is required to match
 * the legacy SQL database for migration purposes. Any changes to this file could
 * break the migration process.
 */
/**
 * ActivityThemes junction table - Many-to-many relationship between Activities and Themes
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivityThemes.cs
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
        createdDateTime: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_date_time";
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
        createdBy: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_by";
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
        lastUpdatedDateTime: import("drizzle-orm/pg-core").PgColumn<{
            name: "last_updated_date_time";
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
        lastUpdatedBy: import("drizzle-orm/pg-core").PgColumn<{
            name: "last_updated_by";
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
    };
    dialect: "pg";
}>;
/**
 * ActivityTags junction table - Many-to-many relationship between Activities and Tags
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivityTags.cs
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
        createdDateTime: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_date_time";
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
        createdBy: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_by";
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
        lastUpdatedDateTime: import("drizzle-orm/pg-core").PgColumn<{
            name: "last_updated_date_time";
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
        lastUpdatedBy: import("drizzle-orm/pg-core").PgColumn<{
            name: "last_updated_by";
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
    };
    dialect: "pg";
}>;
export declare const activityThemesRelations: import("drizzle-orm").Relations<"activity_themes", {
    activity: import("drizzle-orm").One<"activities", true>;
    theme: import("drizzle-orm").One<"themes", true>;
    createdByUser: import("drizzle-orm").One<"system_users", true>;
    updatedByUser: import("drizzle-orm").One<"system_users", true>;
}>;
export declare const activityTagsRelations: import("drizzle-orm").Relations<"activity_tags", {
    activity: import("drizzle-orm").One<"activities", true>;
    tag: import("drizzle-orm").One<"tags", true>;
    createdByUser: import("drizzle-orm").One<"system_users", true>;
    updatedByUser: import("drizzle-orm").One<"system_users", true>;
}>;
/**
 * ActivityCategories junction table - Many-to-many relationship between Activities and Categories
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivityCategories.cs
 */
export declare const activityCategories: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "activity_categories";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "activity_categories";
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
        createdDateTime: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_date_time";
            tableName: "activity_categories";
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
        createdBy: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_by";
            tableName: "activity_categories";
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
        lastUpdatedDateTime: import("drizzle-orm/pg-core").PgColumn<{
            name: "last_updated_date_time";
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
        lastUpdatedBy: import("drizzle-orm/pg-core").PgColumn<{
            name: "last_updated_by";
            tableName: "activity_categories";
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
        rowGuid: import("drizzle-orm/pg-core").PgColumn<{
            name: "row_guid";
            tableName: "activity_categories";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
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
 * ActivityCommunicationMaterials junction table - Many-to-many relationship between Activities and CommunicationMaterials
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivityCommunicationMaterial.cs
 */
export declare const activityCommunicationMaterials: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "activity_communication_materials";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "activity_communication_materials";
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
            tableName: "activity_communication_materials";
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
        communicationMaterialId: import("drizzle-orm/pg-core").PgColumn<{
            name: "communication_material_id";
            tableName: "activity_communication_materials";
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
            tableName: "activity_communication_materials";
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
        createdDateTime: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_date_time";
            tableName: "activity_communication_materials";
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
        createdBy: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_by";
            tableName: "activity_communication_materials";
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
        lastUpdatedDateTime: import("drizzle-orm/pg-core").PgColumn<{
            name: "last_updated_date_time";
            tableName: "activity_communication_materials";
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
        lastUpdatedBy: import("drizzle-orm/pg-core").PgColumn<{
            name: "last_updated_by";
            tableName: "activity_communication_materials";
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
        timestamp: import("drizzle-orm/pg-core").PgColumn<{
            name: "timestamp";
            tableName: "activity_communication_materials";
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
        rowGuid: import("drizzle-orm/pg-core").PgColumn<{
            name: "row_guid";
            tableName: "activity_communication_materials";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
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
 * ActivityInitiatives junction table - Many-to-many relationship between Activities and Initiatives
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivityInitiatives.cs
 */
export declare const activityInitiatives: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "activity_initiatives";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "activity_initiatives";
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
            tableName: "activity_initiatives";
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
        initiativeId: import("drizzle-orm/pg-core").PgColumn<{
            name: "initiative_id";
            tableName: "activity_initiatives";
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
            tableName: "activity_initiatives";
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
        createdDateTime: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_date_time";
            tableName: "activity_initiatives";
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
        createdBy: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_by";
            tableName: "activity_initiatives";
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
        lastUpdatedDateTime: import("drizzle-orm/pg-core").PgColumn<{
            name: "last_updated_date_time";
            tableName: "activity_initiatives";
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
        lastUpdatedBy: import("drizzle-orm/pg-core").PgColumn<{
            name: "last_updated_by";
            tableName: "activity_initiatives";
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
        timestamp: import("drizzle-orm/pg-core").PgColumn<{
            name: "timestamp";
            tableName: "activity_initiatives";
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
        rowGuid: import("drizzle-orm/pg-core").PgColumn<{
            name: "row_guid";
            tableName: "activity_initiatives";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
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
 * ActivityKeywords junction table - Many-to-many relationship between Activities and Keywords
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivityKeywords.cs
 */
export declare const activityKeywords: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "activity_keywords";
    schema: undefined;
    columns: {
        activityId: import("drizzle-orm/pg-core").PgColumn<{
            name: "activity_id";
            tableName: "activity_keywords";
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
        keywordId: import("drizzle-orm/pg-core").PgColumn<{
            name: "keyword_id";
            tableName: "activity_keywords";
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
            tableName: "activity_keywords";
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
        lastUpdatedDateTime: import("drizzle-orm/pg-core").PgColumn<{
            name: "last_updated_date_time";
            tableName: "activity_keywords";
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
        lastUpdatedBy: import("drizzle-orm/pg-core").PgColumn<{
            name: "last_updated_by";
            tableName: "activity_keywords";
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
 * ActivityNROrigins junction table - Many-to-many relationship between Activities and NROrigins
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivityNROrigins.cs
 */
export declare const activityNROrigins: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "activity_nr_origins";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "activity_nr_origins";
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
            tableName: "activity_nr_origins";
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
        nrOriginId: import("drizzle-orm/pg-core").PgColumn<{
            name: "nr_origin_id";
            tableName: "activity_nr_origins";
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
            tableName: "activity_nr_origins";
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
        createdDateTime: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_date_time";
            tableName: "activity_nr_origins";
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
        createdBy: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_by";
            tableName: "activity_nr_origins";
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
        lastUpdatedDateTime: import("drizzle-orm/pg-core").PgColumn<{
            name: "last_updated_date_time";
            tableName: "activity_nr_origins";
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
        lastUpdatedBy: import("drizzle-orm/pg-core").PgColumn<{
            name: "last_updated_by";
            tableName: "activity_nr_origins";
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
        timestamp: import("drizzle-orm/pg-core").PgColumn<{
            name: "timestamp";
            tableName: "activity_nr_origins";
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
        rowGuid: import("drizzle-orm/pg-core").PgColumn<{
            name: "row_guid";
            tableName: "activity_nr_origins";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
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
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "activity_sectors";
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
        createdDateTime: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_date_time";
            tableName: "activity_sectors";
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
        createdBy: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_by";
            tableName: "activity_sectors";
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
        lastUpdatedDateTime: import("drizzle-orm/pg-core").PgColumn<{
            name: "last_updated_date_time";
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
        lastUpdatedBy: import("drizzle-orm/pg-core").PgColumn<{
            name: "last_updated_by";
            tableName: "activity_sectors";
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
        rowGuid: import("drizzle-orm/pg-core").PgColumn<{
            name: "row_guid";
            tableName: "activity_sectors";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
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
 * ActivitySharedWith junction table - Many-to-many relationship between Activities and Ministries
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/ActivitySharedWith.cs
 */
export declare const activitySharedWith: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "activity_shared_with";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "activity_shared_with";
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
            tableName: "activity_shared_with";
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
        ministryId: import("drizzle-orm/pg-core").PgColumn<{
            name: "ministry_id";
            tableName: "activity_shared_with";
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
            tableName: "activity_shared_with";
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
        createdDateTime: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_date_time";
            tableName: "activity_shared_with";
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
        createdBy: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_by";
            tableName: "activity_shared_with";
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
        lastUpdatedDateTime: import("drizzle-orm/pg-core").PgColumn<{
            name: "last_updated_date_time";
            tableName: "activity_shared_with";
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
        lastUpdatedBy: import("drizzle-orm/pg-core").PgColumn<{
            name: "last_updated_by";
            tableName: "activity_shared_with";
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
        timestamp: import("drizzle-orm/pg-core").PgColumn<{
            name: "timestamp";
            tableName: "activity_shared_with";
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
        rowGuid: import("drizzle-orm/pg-core").PgColumn<{
            name: "row_guid";
            tableName: "activity_shared_with";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
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
    createdByUser: import("drizzle-orm").One<"system_users", false>;
    updatedByUser: import("drizzle-orm").One<"system_users", false>;
}>;
export declare const activityCommunicationMaterialsRelations: import("drizzle-orm").Relations<"activity_communication_materials", {
    activity: import("drizzle-orm").One<"activities", true>;
    createdByUser: import("drizzle-orm").One<"system_users", false>;
    updatedByUser: import("drizzle-orm").One<"system_users", false>;
}>;
export declare const activityInitiativesRelations: import("drizzle-orm").Relations<"activity_initiatives", {
    activity: import("drizzle-orm").One<"activities", true>;
    createdByUser: import("drizzle-orm").One<"system_users", false>;
    updatedByUser: import("drizzle-orm").One<"system_users", false>;
}>;
export declare const activityKeywordsRelations: import("drizzle-orm").Relations<"activity_keywords", {
    activity: import("drizzle-orm").One<"activities", true>;
    updatedByUser: import("drizzle-orm").One<"system_users", true>;
}>;
export declare const activityNROriginsRelations: import("drizzle-orm").Relations<"activity_nr_origins", {
    activity: import("drizzle-orm").One<"activities", true>;
    createdByUser: import("drizzle-orm").One<"system_users", false>;
    updatedByUser: import("drizzle-orm").One<"system_users", false>;
}>;
export declare const activitySectorsRelations: import("drizzle-orm").Relations<"activity_sectors", {
    activity: import("drizzle-orm").One<"activities", true>;
    createdByUser: import("drizzle-orm").One<"system_users", false>;
    updatedByUser: import("drizzle-orm").One<"system_users", false>;
}>;
export declare const activitySharedWithRelations: import("drizzle-orm").Relations<"activity_shared_with", {
    activity: import("drizzle-orm").One<"activities", true>;
    ministry: import("drizzle-orm").One<"ministries", true>;
    createdByUser: import("drizzle-orm").One<"system_users", false>;
    updatedByUser: import("drizzle-orm").One<"system_users", false>;
}>;
/**
 * FavoriteActivity junction table - Many-to-many relationship between SystemUsers and Activities (Watch Lists/Favorites)
 * Inferred from Hub.Legacy/Gcpe.Calendar.Data/Entity/FavoriteActivity.cs
 */
export declare const favoriteActivities: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "favorite_activities";
    schema: undefined;
    columns: {
        systemUserId: import("drizzle-orm/pg-core").PgColumn<{
            name: "system_user_id";
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
export declare const favoriteActivitiesRelations: import("drizzle-orm").Relations<"favorite_activities", {
    systemUser: import("drizzle-orm").One<"system_users", true>;
    activity: import("drizzle-orm").One<"activities", true>;
}>;
//# sourceMappingURL=relations.legacy.d.ts.map