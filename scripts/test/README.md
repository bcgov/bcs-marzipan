# Test Runner Scripts

This directory contains scripts used by `lint-staged` to run tests for changed files during pre-commit hooks.

## Scripts

### `jest-related.js`

Runs Jest tests for files related to changed source files in the `calendar-service` workspace.

**Usage:**

```bash
node scripts/test/jest-related.js <file1> <file2> ...
```

**How it works:**

1. Filters input files to only include TypeScript source files from `calendar-service/` (excludes test files)
2. Converts paths to be relative to the `calendar-service` directory
3. Runs Jest with `--findRelatedTests` to automatically find and run tests related to the changed source files
4. Excludes e2e tests using `--testPathIgnorePatterns=e2e`
5. Uses `--passWithNoTests` to allow commits when no related tests are found

**Example:**
If you change `calendar-service/src/lookups/lookups.controller.ts`, this script will:

- Detect it's a source file (not a test)
- Run Jest with `--findRelatedTests` pointing to that file
- Jest will automatically find and run `lookups.controller.spec.ts`

### `vitest-related.js`

Runs Vitest tests for files related to changed source files in the `calendar-ui` workspace.

**Usage:**

```bash
node scripts/test/vitest-related.js <file1> <file2> ...
```

**How it works:**

1. Filters input files to only include TypeScript/TSX source files from `calendar-ui/` (excludes test files)
2. Converts paths to be relative to the `calendar-ui` directory
3. Runs Vitest which automatically finds related test files when given source files
4. Exits gracefully if no source files are found or only test files were changed

**Example:**
If you change `calendar-ui/src/components/Button.tsx`, this script will:

- Detect it's a source file (not a test)
- Run Vitest pointing to that file
- Vitest will automatically find and run related test files (e.g., `Button.test.tsx`)

## Integration with lint-staged

These scripts are automatically invoked by `lint-staged` during pre-commit hooks. The `lint-staged` configuration in `package.json` passes staged file paths as arguments to these scripts.

**Configuration:**

```json
"lint-staged": {
  "calendar-service/**/*.ts": [
    "eslint --fix",
    "node scripts/test/jest-related.js"
  ],
  "calendar-ui/**/*.{ts,tsx}": [
    "eslint --fix",
    "node scripts/test/vitest-related.js"
  ]
}
```

When files are staged and you commit:

1. `lint-staged` runs ESLint on the staged files
2. `lint-staged` passes the staged file paths to the appropriate test script
3. The test script filters and runs only tests related to changed source files
4. If tests fail, the commit is blocked

## Benefits

- **Fast**: Only runs tests for files that actually changed
- **Automatic**: No need to manually specify which tests to run
- **Safe**: Blocks commits if related tests fail
- **Efficient**: Skips running tests if only test files or non-source files changed
