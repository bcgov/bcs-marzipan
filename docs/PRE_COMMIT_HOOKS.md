# Pre-Commit Hooks

This project uses [Husky](https://typicode.github.io/husky/) and [lint-staged](https://github.com/okonet/lint-staged) to automatically run code quality checks and tests before each commit.

## Overview

The pre-commit hook ensures that:

- Code follows linting rules (ESLint)
- Code is properly formatted (Prettier)
- Tests related to changed files pass (Jest/Vitest)

If any of these checks fail, the commit is blocked until the issues are resolved.

## How It Works

### 1. Pre-Commit Hook Trigger

When you run `git commit`, Husky automatically executes `.husky/pre-commit`, which runs `lint-staged`.

### 2. lint-staged Processing

`lint-staged` processes only the files you've staged for commit. It runs different commands based on file patterns:

#### TypeScript Files (`calendar-service/**/*.ts`)

1. **ESLint** - Lints and auto-fixes issues:

   ```bash
   eslint --fix
   ```

2. **Jest Tests** - Runs tests related to changed files:

   ```bash
   node scripts/test/jest-related.js
   ```

   The script uses Jest's `--findRelatedTests` flag to automatically find and run test files related to the changed source files. E2E tests are excluded.

#### TypeScript/TSX Files (`calendar-ui/**/*.{ts,tsx}`)

1. **ESLint** - Lints and auto-fixes issues:

   ```bash
   eslint --fix
   ```

2. **Vitest Tests** - Runs tests related to changed files:

   ```bash
   node scripts/test/vitest-related.js
   ```

   Vitest automatically finds related test files when given source files.

#### Package Files (`packages/**/*.ts`)

1. **ESLint** - Lints and auto-fixes issues:
   ```bash
   eslint --fix
   ```

#### Non-Code Files (`**/*.{json,md,css,scss,less,html,yaml,yml}`)

1. **Prettier** - Formats files:
   ```bash
   prettier --write
   ```

### 3. Test Scripts

The test scripts (`scripts/test/jest-related.js` and `scripts/test/vitest-related.js`) are smart about what they run:

- **Filter source files**: Only process actual source files, not test files themselves
- **Find related tests**: Automatically discover which tests are related to changed files
- **Skip when appropriate**: Exit gracefully if only test files or non-source files changed
- **Fast execution**: Only run tests for files that actually changed

See [scripts/test/README.md](../scripts/test/README.md) for detailed documentation on the test scripts.

## Example Workflow

1. You modify `calendar-service/src/lookups/lookups.controller.ts`
2. You stage the file: `git add calendar-service/src/lookups/lookups.controller.ts`
3. You commit: `git commit -m "Update lookups controller"`
4. Pre-commit hook runs:
   - ESLint checks and fixes `lookups.controller.ts`
   - Jest finds and runs `lookups.controller.spec.ts`
   - If tests pass, commit succeeds
   - If tests fail, commit is blocked

## Bypassing the Hook

**⚠️ Not Recommended**: You can bypass the pre-commit hook using `git commit --no-verify`, but this should only be used in exceptional circumstances (e.g., emergency hotfixes). Bypassing hooks can lead to:

- Broken builds in CI/CD
- Code quality issues in the repository
- Tests that don't pass for other developers

## Configuration Files

- **`.husky/pre-commit`** - Husky hook that triggers lint-staged
- **`package.json`** - Contains `lint-staged` configuration
- **`scripts/test/jest-related.js`** - Jest test runner for calendar-service
- **`scripts/test/vitest-related.js`** - Vitest test runner for calendar-ui

## Troubleshooting

### Tests are failing but I want to commit

1. Fix the failing tests
2. If tests are flaky, investigate and fix the root cause
3. Only use `--no-verify` as a last resort for emergency fixes

### ESLint is taking too long

- ESLint runs on all staged files, which should be fast
- If it's slow, check for large files or complex linting rules
- Consider running `npm run lint` manually before committing

### Tests are running for unrelated files

- The test scripts use Jest/Vitest's related test detection
- If tests are running unexpectedly, check the test file imports and dependencies
- Review the test script logic in `scripts/test/`

### Hook not running

- Ensure Husky is installed: `npm run prepare`
- Check that `.husky/pre-commit` exists and is executable
- Verify `lint-staged` is installed as a dev dependency
