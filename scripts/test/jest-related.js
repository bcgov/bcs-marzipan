#!/usr/bin/env node
/**
 * Run Jest for related files (files passed as arguments)
 * Used by lint-staged to run tests for changed files only
 * Jest will find test files related to the source files using --findRelatedTests
 */

const { execSync } = require('child_process');
const path = require('path');

const files = process.argv.slice(2);

if (files.length === 0) {
  console.log('No files to test');
  process.exit(0);
}

// Filter to only calendar-service source files
const sourceFiles = files.filter((f) => {
  const ext = path.extname(f);
  return (
    /\.ts$/.test(f) &&
    f.startsWith('calendar-service/') &&
    !f.includes('.spec.') &&
    !f.includes('.test.')
  );
});

if (sourceFiles.length === 0) {
  console.log('No source files to test (or only test files changed)');
  process.exit(0);
}

// Convert paths to be relative to calendar-service directory
// Jest --findRelatedTests needs paths relative to the project root
const fileArgs = sourceFiles
  .map((f) => f.replace('calendar-service/', ''))
  .join(' ');
const cmd = `cd calendar-service && npx jest --findRelatedTests --passWithNoTests --testPathIgnorePatterns=e2e ${fileArgs}`;

try {
  execSync(cmd, { stdio: 'inherit', cwd: path.join(__dirname, '..', '..') });
} catch (err) {
  process.exitCode = err.status || 1;
}
