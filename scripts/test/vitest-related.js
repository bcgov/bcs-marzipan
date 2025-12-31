#!/usr/bin/env node
/**
 * Run Vitest for related files (files passed as arguments)
 * Used by lint-staged to run tests for changed files only
 * Vitest will automatically find test files related to the source files
 */

const { execSync } = require('child_process');
const path = require('path');

const files = process.argv.slice(2);

if (files.length === 0) {
  console.log('No files to test');
  process.exit(0);
}

// Filter to only calendar-ui source files
const sourceFiles = files.filter((f) => {
  const ext = path.extname(f);
  return (
    /\.(ts|tsx)$/.test(f) &&
    f.startsWith('calendar-ui/') &&
    !f.includes('.test.') &&
    !f.includes('.spec.')
  );
});

if (sourceFiles.length === 0) {
  console.log('No source files to test (or only test files changed)');
  process.exit(0);
}

// Convert paths to be relative to calendar-ui directory
// Vitest will find related test files automatically when given source files
const fileArgs = sourceFiles
  .map((f) => f.replace('calendar-ui/', ''))
  .join(' ');
const cmd = `cd calendar-ui && npx vitest run ${fileArgs}`;

try {
  execSync(cmd, { stdio: 'inherit', cwd: path.join(__dirname, '..', '..') });
} catch (err) {
  process.exitCode = err.status || 1;
}
