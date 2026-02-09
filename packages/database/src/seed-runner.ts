import * as fs from 'fs';
import * as path from 'path';
import { sql, type SQL } from 'drizzle-orm';

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
export function parseSqlStatements(sqlContent: string): string[] {
  const statements: string[] = [];
  let currentStatement = '';
  let inString = false;
  let inLineComment = false;
  let blockCommentDepth = 0;
  let i = 0;

  while (i < sqlContent.length) {
    const char = sqlContent[i];
    const nextChar = sqlContent[i + 1];

    // Handle block comments (can nest, but not inside strings or line comments)
    if (!inString && !inLineComment) {
      if (char === '/' && nextChar === '*') {
        blockCommentDepth++;
        i += 2;
        continue;
      }
      if (blockCommentDepth > 0 && char === '*' && nextChar === '/') {
        blockCommentDepth--;
        i += 2;
        continue;
      }
    }

    // Skip content inside block comments
    if (blockCommentDepth > 0) {
      i++;
      continue;
    }

    // Handle line comments (not inside strings)
    if (!inString && char === '-' && nextChar === '-') {
      inLineComment = true;
      i += 2;
      continue;
    }

    // End of line comment
    if (inLineComment) {
      if (char === '\n') {
        inLineComment = false;
        // Don't add newline - the comment line is removed entirely
      }
      i++;
      continue;
    }

    // Handle string literals (single quotes in SQL)
    if (char === "'") {
      if (inString) {
        // Check for escaped quote ('')
        if (nextChar === "'") {
          // Escaped quote - add both and skip next
          currentStatement += "''";
          i += 2;
          continue;
        } else {
          // End of string
          inString = false;
        }
      } else {
        // Start of string
        inString = true;
      }
      currentStatement += char;
      i++;
      continue;
    }

    // Handle statement terminator (semicolon)
    if (char === ';' && !inString) {
      // End of statement
      const trimmed = currentStatement.trim();
      if (trimmed.length > 0) {
        statements.push(trimmed);
      }
      currentStatement = '';
      i++;
      continue;
    }

    // Regular character
    currentStatement += char;
    i++;
  }

  // Don't forget any remaining statement (without trailing semicolon)
  const trimmed = currentStatement.trim();
  if (trimmed.length > 0) {
    statements.push(trimmed);
  }

  return statements;
}

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
export class SeedRunner {
  private readonly seedsPath: string;

  constructor(
    private readonly db: SeedableDatabase,
    seedsDirectory?: string
  ) {
    // Resolve seeds directory path
    // In development: from packages/database/src -> packages/database/seeds
    // In production: from packages/database/dist -> packages/database/seeds
    if (seedsDirectory) {
      this.seedsPath = seedsDirectory;
    } else {
      // Find the package root by looking for package.json
      // This works regardless of whether we're in src/ or dist/
      const packageRoot = this.findPackageRoot();
      this.seedsPath = path.join(packageRoot, 'seeds');
    }
  }

  /**
   * Finds the package root by walking up the directory tree
   * until it finds package.json. This works regardless of whether
   * we're running from src/ or dist/.
   */
  private findPackageRoot(): string {
    // Start from the current file's directory
    const currentDir = this.getCurrentDirectory();
    let dir = path.resolve(currentDir);

    // Walk up the directory tree until we find package.json
    // Limit to 10 levels to prevent infinite loops
    for (let i = 0; i < 10; i++) {
      const packageJsonPath = path.join(dir, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        return dir;
      }
      const parentDir = path.resolve(dir, '..');
      // If we've reached the filesystem root, stop
      if (parentDir === dir) {
        break;
      }
      dir = parentDir;
    }

    // Fallback: if we can't find package.json, use process.cwd()
    // This assumes the command is run from the package root
    return process.cwd();
  }

  /**
   * Gets the current directory, working in both CommonJS and ESM
   */
  private getCurrentDirectory(): string {
    // In CommonJS, __dirname is available
    // In ESM, we need to use import.meta.url
    // We use a runtime check to determine which context we're in

    // Check if we're in a CommonJS context by looking for require

    const hasRequire = typeof require !== 'undefined' && require.main;

    if (hasRequire) {
      // CommonJS: __dirname should be available
      // We'll use a workaround: resolve from a known file location
      // Since this is a package, we can use require.resolve to find our location
      try {
        const modulePath = require.resolve('./seed-runner');
        return path.dirname(modulePath);
      } catch {
        // Fallback: use process.cwd() and assume we're in src/
        return path.join(process.cwd(), 'src');
      }
    } else {
      // ESM: use import.meta.url
      // This code will only be executed in ESM builds
      // TypeScript will error in CJS builds, but this code won't run there
      // We use a type assertion to tell TypeScript this is okay
      const meta = (globalThis as { importMeta?: { url?: string } }).importMeta;
      if (meta?.url) {
        const filePath = new URL(meta.url).pathname;
        let dir = path.dirname(filePath);
        // Handle Windows paths
        if (process.platform === 'win32' && dir.startsWith('/')) {
          dir = dir.substring(1);
        }
        return dir;
      }
      // Fallback
      return path.join(process.cwd(), 'src');
    }
  }

  /**
   * Ensures the _seed_history table exists
   */
  private async ensureSeedHistoryTable(): Promise<void> {
    await this.db.execute(sql`
      CREATE TABLE IF NOT EXISTS _seed_history (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        checksum VARCHAR(64)
      )
    `);
  }

  /**
   * Gets the list of seed files that have already been applied
   */
  private async getAppliedSeeds(): Promise<Set<string>> {
    try {
      const result = await this.db.execute(sql`
        SELECT filename FROM _seed_history ORDER BY applied_at
      `);
      // Drizzle's execute returns a RowList which is array-like
      // Cast to the expected shape since we know the query structure
      const rows = result as { filename: string }[];
      return new Set(rows.map((row) => row.filename));
    } catch {
      // If table doesn't exist yet, return empty set
      return new Set();
    }
  }

  /**
   * Records a seed file as applied
   */
  private async recordSeedApplied(filename: string): Promise<void> {
    await this.db.execute(
      sql`INSERT INTO _seed_history (filename) VALUES (${filename}) ON CONFLICT (filename) DO NOTHING`
    );
  }

  /**
   * Discovers seed files in the seeds directory
   * Matches pattern: ####_*_seed_*.sql or ####_*seed*.sql
   */
  private discoverSeedFiles(): string[] {
    if (!fs.existsSync(this.seedsPath)) {
      return [];
    }

    const files = fs.readdirSync(this.seedsPath);
    const seedFiles = files
      .filter((file) => {
        // Match files that:
        // 1. End with .sql
        // 2. Start with 4 digits followed by underscore
        // 3. Contain "seed" in the filename
        return (
          file.endsWith('.sql') && /^\d{4}_/.test(file) && /seed/i.test(file)
        );
      })
      .sort(); // Alphabetical sort ensures numeric prefix order

    return seedFiles;
  }

  /**
   * Reads and parses SQL file, splitting into individual statements.
   * Properly handles:
   * - Semicolons inside single-quoted string literals
   * - Escaped single quotes ('') in SQL strings
   * - Line comments (--)
   * - Block comments
   */
  private parseSqlFile(filePath: string): string[] {
    const sqlContent = fs.readFileSync(filePath, 'utf-8');
    return parseSqlStatements(sqlContent);
  }

  /**
   * Executes a single seed file
   */
  private async executeSeedFile(
    filename: string,
    options: SeedOptions = {}
  ): Promise<SeedResult> {
    const filePath = path.join(this.seedsPath, filename);
    const statements = this.parseSqlFile(filePath);

    if (options.dryRun) {
      return {
        file: filename,
        success: true,
        statementsExecuted: statements.length,
      };
    }

    try {
      // Execute each statement individually
      for (const statement of statements) {
        await this.db.execute(sql.raw(statement));
      }

      // Record that this seed was applied
      await this.recordSeedApplied(filename);

      return {
        file: filename,
        success: true,
        statementsExecuted: statements.length,
      };
    } catch (error) {
      return {
        file: filename,
        success: false,
        statementsExecuted: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Runs all seed files in order
   */
  async run(options: SeedOptions = {}): Promise<SeedResult[]> {
    // Ensure seed history table exists
    await this.ensureSeedHistoryTable();

    // Get list of already applied seeds
    const appliedSeeds = await this.getAppliedSeeds();

    // Discover seed files
    const seedFiles = this.discoverSeedFiles();

    if (seedFiles.length === 0) {
      return [];
    }

    const results: SeedResult[] = [];

    for (const seedFile of seedFiles) {
      // Skip if already applied (unless force flag is set)
      if (!options.force && appliedSeeds.has(seedFile)) {
        results.push({
          file: seedFile,
          success: true,
          statementsExecuted: 0,
        });
        continue;
      }

      const result = await this.executeSeedFile(seedFile, options);
      results.push(result);

      // Stop on first error (unless force flag allows continuation)
      if (!result.success && !options.force) {
        break;
      }
    }

    return results;
  }

  /**
   * Gets the path to the seeds directory
   */
  getSeedsPath(): string {
    return this.seedsPath;
  }
}
