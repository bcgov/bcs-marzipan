#!/usr/bin/env node
/**
 * Run Vitest for related files in a specific workspace
 * Used by lint-staged to run tests for changed files only
 * Vitest will automatically find test files related to the source files
 *
 * Usage: vitest-related.js <workspace> [files...]
 * Example: vitest-related.js calendar-ui src/App.tsx src/utils/helper.ts
 */

const { execSync } = require('child_process');
const path = require('path');

// Map workspace names to their directory paths
const workspacePaths = {
  'calendar-service': 'calendar-service',
  'calendar-ui': 'calendar-ui',
  database: 'packages/database',
  shared: 'packages/shared',
};

const availableWorkspaces = Object.keys(workspacePaths).join(', ');

// First argument is the workspace name, rest are files
const workspace = process.argv[2];
const files = process.argv.slice(3);

if (!workspace) {
  console.error('Error: Workspace argument is required');
  console.error(`Usage: vitest-related.js <workspace> [files...]`);
  console.error(`Available workspaces: ${availableWorkspaces}`);
  process.exit(1);
}

if (!workspacePaths[workspace]) {
  console.error(`Error: Unknown workspace "${workspace}"`);
  console.error(`Available workspaces: ${availableWorkspaces}`);
  process.exit(1);
}

const workspacePath = workspacePaths[workspace];

if (files.length === 0) {
  console.log(`[${workspace}] No files to test`);
  process.exit(0);
}

// Filter to only source files in this workspace
const sourceFiles = files.filter((f) => {
  return (
    /\.(ts|tsx)$/.test(f) &&
    f.startsWith(workspacePath + '/') &&
    !f.includes('.test.') &&
    !f.includes('.spec.')
  );
});

if (sourceFiles.length === 0) {
  console.log(
    `[${workspace}] No source files to test (or only test files changed)`
  );
  process.exit(0);
}

// Convert source file paths to base names that Vitest can use as test filters
// e.g., "src/schemas/activity.schema.ts" -> "activity.schema"
// This allows Vitest to find "activity.schema.spec.ts" or "activity.schema.test.ts"
const fileArgs = sourceFiles
  .map((f) => {
    const relativePath = f.replace(workspacePath + '/', '');
    const baseName = path.basename(relativePath, path.extname(relativePath));
    return baseName;
  })
  .join(' ');

const cmd = `cd ${workspacePath} && npx vitest run ${fileArgs}`;

console.log(`[${workspace}] Running tests for: ${sourceFiles.join(', ')}`);

try {
  execSync(cmd, { stdio: 'inherit', cwd: path.join(__dirname, '..', '..') });
} catch (err) {
  process.exitCode = err.status || 1;
}
