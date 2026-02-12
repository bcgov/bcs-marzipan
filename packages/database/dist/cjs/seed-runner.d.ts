import { type SQL } from 'drizzle-orm';
export interface SeedResult {
    file: string;
    success: boolean;
    statementsExecuted: number;
    error?: string;
}
export interface SeedOptions {
    force?: boolean;
    dryRun?: boolean;
}
/**
 * Database interface that seed-runner requires
 * Works with any Drizzle database instance
 * Drizzle's execute returns a RowList which is array-like and can be iterated
 * We use a flexible type that accepts any execute method returning a Promise
 */
export interface SeedableDatabase {
    execute(query: SQL): Promise<unknown>;
}
/**
 * Parses SQL content into individual statements.
 * Properly handles:
 * - Semicolons inside single-quoted string literals
 * - Escaped single quotes ('') in SQL strings
 * - Line comments (--)
 * - Block comments (including PostgreSQL-style nested comments)
 *
 * @param sqlContent - The SQL content to parse
 * @returns Array of SQL statements (trimmed, non-empty)
 */
export declare function parseSqlStatements(sqlContent: string): string[];
/**
 * Seed Runner
 *
 * Automatically discovers and executes seed SQL files from the seeds directory.
 * Seed files should follow the naming convention: ####_YYYYMMDD_description_seed_*.sql
 *
 * Features:
 * - Auto-discovers seed files matching the pattern
 * - Executes seeds in alphabetical order (numeric prefix ensures order)
 * - Tracks applied seeds in _seed_history table
 * - Idempotent execution (skips already applied seeds unless --force)
 */
export declare class SeedRunner {
    private readonly db;
    private readonly seedsPath;
    constructor(db: SeedableDatabase, seedsDirectory?: string);
    /**
     * Finds the package root by walking up the directory tree
     * until it finds package.json. This works regardless of whether
     * we're running from src/ or dist/.
     */
    private findPackageRoot;
    /**
     * Gets the current directory, working in both CommonJS and ESM
     */
    private getCurrentDirectory;
    /**
     * Ensures the _seed_history table exists
     */
    private ensureSeedHistoryTable;
    /**
     * Gets the list of seed files that have already been applied
     */
    private getAppliedSeeds;
    /**
     * Records a seed file as applied
     */
    private recordSeedApplied;
    /**
     * Discovers seed files in the seeds directory
     * Matches pattern: ####_*_seed_*.sql or ####_*seed*.sql
     */
    private discoverSeedFiles;
    /**
     * Reads and parses SQL file, splitting into individual statements.
     * Properly handles:
     * - Semicolons inside single-quoted string literals
     * - Escaped single quotes ('') in SQL strings
     * - Line comments (--)
     * - Block comments
     */
    private parseSqlFile;
    /**
     * Executes a single seed file
     */
    private executeSeedFile;
    /**
     * Runs all seed files in order
     */
    run(options?: SeedOptions): Promise<SeedResult[]>;
    /**
     * Gets the path to the seeds directory
     */
    getSeedsPath(): string;
}
//# sourceMappingURL=seed-runner.d.ts.map