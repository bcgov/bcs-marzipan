import * as postgresModule from 'postgres';
import * as schema from './schema';
export declare const queryClient: any;
export declare const migrationClient: any;
export declare const db: (import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof schema> & {
    $client: any;
}) | (import("drizzle-orm/postgres-js").PostgresJsDatabase<Record<string, unknown>> & {
    $client: postgresModule.Sql<{}>;
});
export type Database = typeof db;
//# sourceMappingURL=client.d.ts.map