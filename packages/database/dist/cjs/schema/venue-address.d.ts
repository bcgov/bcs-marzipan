/**
 * Venue Address table - One-to-one relationship with activities
 * Stores venue address information for event activities
 * Note: Audit fields are not included here as the parent activity already has audit fields
 */
export declare const venueAddresses: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "venue_addresses";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "venue_addresses";
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
            tableName: "venue_addresses";
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
        venueName: import("drizzle-orm/pg-core").PgColumn<{
            name: "venue_name";
            tableName: "venue_addresses";
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
        street: import("drizzle-orm/pg-core").PgColumn<{
            name: "street";
            tableName: "venue_addresses";
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
        city: import("drizzle-orm/pg-core").PgColumn<{
            name: "city";
            tableName: "venue_addresses";
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
        provinceOrState: import("drizzle-orm/pg-core").PgColumn<{
            name: "province_or_state";
            tableName: "venue_addresses";
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
        country: import("drizzle-orm/pg-core").PgColumn<{
            name: "country";
            tableName: "venue_addresses";
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
    };
    dialect: "pg";
}>;
export declare const venueAddressesRelations: import("drizzle-orm").Relations<"venue_addresses", {
    activity: import("drizzle-orm").One<"activities", true>;
}>;
//# sourceMappingURL=venue-address.d.ts.map