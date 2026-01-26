# Test Runner Scripts

This directory contains scripts used by `lint-staged` to run tests for changed files during pre-commit hooks.

## Scripts

### `vitest-related.js`

Runs Vitest tests for files related to changed source files in a given workspace.

**Usage:**

```bash
node scripts/test/vitest-related.js <workspace> [file1] [file2] ...
```

**Workspaces:** `calendar-service`, `calendar-ui`, `database` (packages/database), `shared` (packages/shared)

**How it works:**

1. First argument is the workspace name; remaining arguments are staged file paths
2. Filters input files to only include TypeScript/TSX source files from that workspace (excludes test files)
3. Converts paths to be relative to the workspace directory
4. Runs Vitest which automatically finds related test files when given source files
5. Exits gracefully if no source files are found or only test files were changed

**Example:**
If you change `calendar-service/src/lookups/lookups.controller.ts`, lint-staged will run:

- `node scripts/test/vitest-related.js calendar-service calendar-service/src/lookups/lookups.controller.ts`
- Vitest will find and run `lookups.controller.spec.ts`

## Integration with lint-staged

These scripts are automatically invoked by `lint-staged` during pre-commit hooks. The `lint-staged` configuration in `package.json` passes the workspace name and staged file paths as arguments.

**Configuration:**

```json
"lint-staged": {
  "calendar-service/**/*.ts": [
    "eslint --fix",
    "node scripts/test/vitest-related.js calendar-service"
  ],
  "calendar-ui/**/*.{ts,tsx}": [
    "eslint --fix",
    "node scripts/test/vitest-related.js calendar-ui"
  ],
  "packages/database/**/*.ts": [
    "eslint --fix",
    "node scripts/test/vitest-related.js database"
  ],
  "packages/shared/**/*.ts": [
    "eslint --fix",
    "node scripts/test/vitest-related.js shared"
  ]
}
```

When files are staged and you commit:

1. `lint-staged` runs ESLint on the staged files
2. `lint-staged` passes the workspace and file paths to the test script
3. The script runs only tests related to changed source files
4. If tests fail, the commit is blocked

## Benefits

- **Fast**: Only runs tests for files that actually changed
- **Automatic**: No need to manually specify which tests to run
- **Safe**: Blocks commits if related tests fail
- **Efficient**: Skips running tests if only test files or non-source files changed
