#!/usr/bin/env node

/**
 * Wrapper script for drizzle-kit generate that enforces a migration name.
 *
 * After a dev squash (exactly one journal entry), runs ensure-postgresql-extensions-first
 * so the extensions template (public schema + pg_trgm) is inserted as migration 0000.
 *
 * Usage:
 *   node scripts/generate-migration.js <migration_name>
 *
 * Example:
 *   node scripts/generate-migration.js 20250115_reason_for_migration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get the migration name from command line arguments
const migrationName = process.argv[2];

if (!migrationName) {
  console.error('Error: Migration name is required');
  console.error('');
  console.error('<migration_name> format: YYYYMMDD_description_of_change');
  console.error(
    'Usage: npm run db:generate --workspace=packages/database -- <migration_name>'
  );
  console.error('');
  console.error('Example:');
  console.error(
    '  npm run db:generate --workspace=packages/database -- 20250115_reason_for_migration'
  );
  console.error('');
  process.exit(1);
}

// Validate the name format (optional - you can remove this if you want more flexibility)
// Format: YYYYMMDD_description
const namePattern = /^\d{8}_[\w-]+$/;
if (!namePattern.test(migrationName)) {
  console.warn(
    'Warning: Migration name should follow format: YYYYMMDD_description'
  );
  console.warn('Example: 20250115_description_of_change');
  console.warn('');
  console.warn('Continuing anyway...');
  console.warn('');
}

// Get the directory where this script is located
const scriptDir = __dirname;
const packageDir = path.resolve(scriptDir, '..');

// Change to package directory to ensure drizzle-kit uses the correct config
process.chdir(packageDir);

try {
  // Execute drizzle-kit generate with the --name flag
  console.log(`Generating migration: ${migrationName}`);
  console.log(`Running: drizzle-kit generate --name ${migrationName}`);
  console.log('');

  // Use npx to ensure drizzle-kit is found from node_modules
  // Use command string format for execSync
  const command = `npx drizzle-kit generate --name ${migrationName}`;
  execSync(command, {
    stdio: 'inherit',
    cwd: packageDir,
    shell: true,
  });
} catch (error) {
  console.error('');
  console.error('Failed to generate migration');
  if (error.message) {
    console.error(`Error: ${error.message}`);
  }
  process.exit(1);
}

console.log('');
console.log(`Migration "${migrationName}" generated`);

try {
  const journalPath = path.join(packageDir, 'migrations/meta/_journal.json');
  if (fs.existsSync(journalPath)) {
    const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
    const entryCount = journal.entries?.length ?? 0;
    if (entryCount === 1) {
      console.log('');
      console.log(
        'Single migration detected (dev squash). Inserting PostgreSQL extensions migration...'
      );
      execSync('node scripts/ensure-postgresql-extensions-first.js', {
        stdio: 'inherit',
        cwd: packageDir,
        shell: true,
      });
    }
  }
} catch (error) {
  console.error('');
  console.error(
    'Migration was generated, but inserting PostgreSQL extensions migration failed'
  );
  if (error.message) {
    console.error(`Error: ${error.message}`);
  }
  process.exit(1);
}
