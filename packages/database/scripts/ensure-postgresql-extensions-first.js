#!/usr/bin/env node

/**
 * After a fresh squash, `drizzle-kit generate` produces a single `0000_*.sql` migration
 * and one snapshot. PostgreSQL extensions (e.g. pg_trgm) cannot live in Drizzle schema,
 * so this script inserts `scripts/templates/postgresql_extensions.sql` as the real `0000`
 * migration, renumbers the generated SQL to `0001_*`, and repairs meta/ snapshot chain
 * + _journal.json (matches a hand-maintained two-step layout).
 *
 * Preconditions:
 * - Run from packages/database (or any cwd; script resolves package root).
 * - migrations/meta/_journal.json must have exactly one entry (the new squash).
 *
 * Idempotent: if the journal already has two entries and the first tag contains
 * `postgresql_extensions`, exits successfully without changes.
 *
 * Do not use for incremental migrations (multiple journal entries from ongoing dev);
 * only for full squash regenerate workflows.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const scriptDir = __dirname;
const packageDir = path.resolve(scriptDir, '..');
const migrationsDir = path.join(packageDir, 'migrations');
const metaDir = path.join(migrationsDir, 'meta');
const journalPath = path.join(metaDir, '_journal.json');
const templatePath = path.join(
  scriptDir,
  'templates',
  'postgresql_extensions.sql'
);

function fail(message) {
  console.error(`ensure-postgresql-extensions-first: ${message}`);
  process.exit(1);
}

function emptyBaselineSnapshot(id) {
  return {
    id,
    prevId: '00000000-0000-0000-0000-000000000000',
    version: '7',
    dialect: 'postgresql',
    tables: {},
    enums: {},
    schemas: {},
    sequences: {},
    roles: {},
    policies: {},
    views: {},
    _meta: {
      columns: {},
      schemas: {},
      tables: {},
    },
  };
}

function extractYyyyMmDdFromTag(tag) {
  const rest = tag.replace(/^0000_/, '');
  const m = rest.match(/^(\d{8})_/);
  if (m) {
    return m[1];
  }
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

function main() {
  if (!fs.existsSync(journalPath)) {
    fail(`Missing ${path.relative(packageDir, journalPath)}. Run drizzle-kit generate first.`);
  }

  if (!fs.existsSync(templatePath)) {
    fail(`Missing template ${path.relative(packageDir, templatePath)}`);
  }

  const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
  const entries = journal.entries ?? [];

  if (entries.length >= 2) {
    const firstTag = entries[0]?.tag ?? '';
    if (firstTag.includes('postgresql_extensions')) {
      console.log(
        'Journal already lists postgresql_extensions as the first migration; nothing to do.'
      );
      process.exit(0);
    }
    fail(
      `Expected 1 journal entry after a fresh squash, or 2 with postgresql_extensions first. ` +
        `Found ${entries.length} entries (first tag: ${firstTag || 'n/a'}). ` +
        `Refusing to modify (incremental migration folder?).`
    );
  }

  if (entries.length !== 1) {
    fail(`Expected exactly 1 journal entry, found ${entries.length}.`);
  }

  const soleEntry = entries[0];
  const originalTag = soleEntry.tag;
  if (!originalTag || !originalTag.startsWith('0000_')) {
    fail(
      `Unexpected migration tag "${originalTag}". Expected a single 0000_* migration from generate.`
    );
  }

  const snapshot0Path = path.join(metaDir, '0000_snapshot.json');
  if (!fs.existsSync(snapshot0Path)) {
    fail(`Missing ${path.relative(packageDir, snapshot0Path)}`);
  }

  const originalSqlPath = path.join(migrationsDir, `${originalTag}.sql`);
  if (!fs.existsSync(originalSqlPath)) {
    fail(`Missing SQL file ${path.relative(packageDir, originalSqlPath)}`);
  }

  const yyyyMmDd = extractYyyyMmDdFromTag(originalTag);
  const extensionsTag = `0000_${yyyyMmDd}_postgresql_extensions`;
  const newSquashTag = `0001_${originalTag.replace(/^0000_/, '')}`;

  if (extensionsTag === originalTag) {
    fail(`Resolved extensions tag equals squash tag (${extensionsTag}); rename squash migration and retry.`);
  }

  const extensionsSqlPath = path.join(migrationsDir, `${extensionsTag}.sql`);
  const newSquashSqlPath = path.join(migrationsDir, `${newSquashTag}.sql`);
  if (fs.existsSync(extensionsSqlPath)) {
    fail(`Refusing to overwrite existing ${path.relative(packageDir, extensionsSqlPath)}`);
  }

  const baselineId = crypto.randomUUID();
  const fullSnapshot = JSON.parse(fs.readFileSync(snapshot0Path, 'utf8'));
  fullSnapshot.prevId = baselineId;

  const baselineSnapshot = emptyBaselineSnapshot(baselineId);
  const snapshot1Path = path.join(metaDir, '0001_snapshot.json');

  fs.writeFileSync(snapshot1Path, `${JSON.stringify(fullSnapshot, null, 2)}\n`);
  fs.writeFileSync(snapshot0Path, `${JSON.stringify(baselineSnapshot, null, 2)}\n`);

  fs.renameSync(originalSqlPath, newSquashSqlPath);
  fs.copyFileSync(templatePath, extensionsSqlPath);

  const originalWhen = soleEntry.when ?? Date.now();
  journal.entries = [
    {
      idx: 0,
      version: journal.version ?? '7',
      when: originalWhen - 1,
      tag: extensionsTag,
      breakpoints: soleEntry.breakpoints ?? true,
    },
    {
      idx: 1,
      version: journal.version ?? '7',
      when: originalWhen,
      tag: newSquashTag,
      breakpoints: soleEntry.breakpoints ?? true,
    },
  ];

  fs.writeFileSync(journalPath, `${JSON.stringify(journal, null, 2)}\n`);

  console.log('Inserted first migration:', extensionsTag);
  console.log('Renumbered squash migration:', newSquashTag);
  console.log('Updated meta snapshot chain (0000 empty baseline, 0001 full schema).');
  console.log('');
  console.log('Running drizzle-kit check...');

  try {
    execSync('npx drizzle-kit check', {
      cwd: packageDir,
      stdio: 'inherit',
      shell: true,
    });
  } catch {
    fail('drizzle-kit check failed. Fix migrations/meta and re-run check.');
  }

  console.log('');
  console.log('Done.');
}

main();
