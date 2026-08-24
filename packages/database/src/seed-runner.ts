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
  scope?: SeedScope;
}

export type SeedScope = 'all' | 'config' | 'seed';

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
 * - Dollar-quoted strings ($$ ... $$) so DO blocks and other PL/pgSQL are not split
 *
 * @param sqlContent - The SQL content to parse
 * @returns Array of SQL statements (trimmed, non-empty)
 */
export function parseSqlStatements(sqlContent: string): string[] {
  const statements: string[] = [];
  let currentStatement = '';
  let inString = false;
  let inDollarQuote = false;
  let inLineComment = false;
  let blockCommentDepth = 0;
  let i = 0;

  while (i < sqlContent.length) {
    const char = sqlContent[i];
    const nextChar = sqlContent[i + 1];

    // Handle dollar-quoted strings ($$ ... $$) - do not split on semicolons inside
    if (!inString && char === '$' && nextChar === '$') {
      inDollarQuote = !inDollarQuote;
      currentStatement += '$$';
      i += 2;
      continue;
    }

    // Handle block comments (can nest, but not inside strings, dollar quotes, or line comments)
    if (!inString && !inDollarQuote && !inLineComment) {
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

    // Handle line comments (not inside strings or dollar quotes)
    if (!inString && !inDollarQuote && char === '-' && nextChar === '-') {
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

    // Handle string literals (single quotes in SQL) - not inside dollar quotes
    if (!inDollarQuote && char === "'") {
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

    // Handle statement terminator (semicolon) - not inside string or dollar quote
    if (char === ';' && !inString && !inDollarQuote) {
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
 * Files match `####_*_seed*.sql`. Use zero-padded numeric prefixes in order (`0000`, `0001`, …); reserve `9999_*` for sequence sync (must sort last).
 *
 * Features:
 * - Auto-discovers seed files matching the pattern
 * - Executes seeds in alphabetical order (numeric prefix ensures order)
 * - Tracks applied seeds in _seed_history table
 * - Idempotent execution (skips already applied seeds unless --force)
 */
export class SeedRunner {
  private readonly seedsPaths: string[];

  constructor(
    private readonly db: SeedableDatabase,
    seedsDirectory?: string
  ) {
    // Resolve seed directories.
    // In development: from packages/database/src -> packages/database/config-data + packages/database/seeds
    // In production: from packages/database/dist -> packages/database/config-data + packages/database/seeds
    if (seedsDirectory) {
      this.seedsPaths = [seedsDirectory];
    } else {
      // Find the package root by looking for package.json
      // This works regardless of whether we're in src/ or dist/
      const packageRoot = this.findPackageRoot();
      this.seedsPaths = [
        path.join(packageRoot, 'config-data'),
        path.join(packageRoot, 'seeds'),
      ];
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
   * Discovers seed files in configured seed directories.
   * Matches pattern: ####_*.sql
   *
   * Execution order is two-phase when scope=all:
   * 1) all files in config-data/ (sorted by filename)
   * 2) all files in seeds/ (sorted by filename)
   */
  private discoverSeedFiles(
    scope: SeedScope
  ): Array<{ filePath: string; filename: string }> {
    const discoveredFiles: Array<{ filePath: string; filename: string }> = [];

    for (const seedPath of this.seedsPaths) {
      if (!fs.existsSync(seedPath)) {
        continue;
      }

      const dirName = path.basename(seedPath).toLowerCase();
      const isConfigDirectory = dirName === 'config-data';
      const isSeedDirectory = dirName === 'seeds';
      // Custom/unknown directories (passed via constructor) are always included regardless of scope.
      const isCustomDirectory = !isConfigDirectory && !isSeedDirectory;

      if (scope === 'config' && !isConfigDirectory && !isCustomDirectory) {
        continue;
      }

      if (scope === 'seed' && !isSeedDirectory && !isCustomDirectory) {
        continue;
      }

      const files = fs.readdirSync(seedPath);
      const seedFiles = files
        .filter((file) => {
          // Match files that:
          // 1. End with .sql
          // 2. Start with 4 digits followed by underscore
          return file.endsWith('.sql') && /^\d{4}_/.test(file);
        })
        .sort((a, b) => a.localeCompare(b));

      for (const filename of seedFiles) {
        discoveredFiles.push({
          filePath: path.join(seedPath, filename),
          filename,
        });
      }
    }

    return discoveredFiles;
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
    filePath: string,
    filename: string,
    options: SeedOptions = {}
  ): Promise<SeedResult> {
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
    const scope = options.scope ?? 'all';
    const seedFiles = this.discoverSeedFiles(scope);

    if (seedFiles.length === 0) {
      return [];
    }

    const results: SeedResult[] = [];

    for (const seedFile of seedFiles) {
      // Skip if already applied (unless force flag is set)
      if (!options.force && appliedSeeds.has(seedFile.filename)) {
        results.push({
          file: seedFile.filename,
          success: true,
          statementsExecuted: 0,
        });
        continue;
      }

      const result = await this.executeSeedFile(
        seedFile.filePath,
        seedFile.filename,
        options
      );
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
    return this.seedsPaths.join(', ');
  }

  /**
   * Gets the configured seed directories.
   */
  getSeedDirectories(): string[] {
    return [...this.seedsPaths];
  }
}
