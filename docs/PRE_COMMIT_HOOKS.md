# Pre-Commit Hooks

This project uses [Husky](https://typicode.github.io/husky/) and [lint-staged](https://github.com/okonet/lint-staged) to automatically run code quality checks and tests before each commit.

## Overview

This project uses multiple Git hooks to ensure code quality and consistency:

### Pre-Commit Hook

The pre-commit hook ensures that:

- Code follows linting rules (ESLint)
- Code is properly formatted (Prettier)
- Tests related to changed files pass (Vitest)

If any of these checks fail, the commit is blocked until the issues are resolved.

### Commit Message Hook

The commit-msg hook validates commit messages against the [Conventional Commits](https://www.conventionalcommits.org/) specification using [Commitlint](https://commitlint.js.org/). This ensures:

- Consistent commit message format across the project
- Better changelog generation
- Improved code history readability

### Pre-Push Hook

The pre-push hook validates branch names to ensure they follow the project's naming convention:

- Format: `<type>/CORPCAL-<number>-<short-description>`
- Enforces Jira integration (CORPCAL issue keys)
- Ensures consistent branch naming across the team

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

2. **Vitest** - Runs tests related to changed files:

   ```bash
   node scripts/test/vitest-related.js calendar-service
   ```

   The script runs Vitest for the calendar-service workspace; Vitest finds and runs test files related to the changed source files. E2E tests are excluded via config.

#### TypeScript/TSX Files (`calendar-ui/**/*.{ts,tsx}`)

1. **ESLint** - Lints and auto-fixes issues:

   ```bash
   eslint --fix
   ```

2. **Vitest** - Runs tests related to changed files:

   ```bash
   node scripts/test/vitest-related.js calendar-ui
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

The test script (`scripts/test/vitest-related.js`) is smart about what it runs:

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
   - Vitest finds and runs `lookups.controller.spec.ts`
   - If tests pass, commit succeeds
   - If tests fail, commit is blocked

## Bypassing the Hook

**⚠️ Not Recommended**: You can bypass the pre-commit hook using `git commit --no-verify`, but this should only be used in exceptional circumstances (e.g., emergency hotfixes). Bypassing hooks can lead to:

- Broken builds in CI/CD
- Code quality issues in the repository
- Tests that don't pass for other developers

## Configuration Files

- **`.husky/pre-commit`** - Husky hook that triggers lint-staged
- **`.husky/commit-msg`** - Husky hook that validates commit messages using Commitlint
- **`.husky/pre-push`** - Husky hook that validates branch names
- **`commitlint.config.js`** - Commitlint configuration for Conventional Commits
- **`package.json`** - Contains `lint-staged` configuration and Commitizen setup
- **`scripts/test/vitest-related.js`** - Vitest test runner for all workspaces (calendar-service, calendar-ui, packages)

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

- The test script uses Vitest's related test detection
- If tests are running unexpectedly, check the test file imports and dependencies
- Review the test script logic in `scripts/test/`

### Hook not running

- Ensure Husky is installed: `npm run prepare`
- Check that `.husky/pre-commit` exists and is executable
- Verify `lint-staged` is installed as a dev dependency
- For commit-msg hook: Verify `@commitlint/cli` and `@commitlint/config-conventional` are installed

### Commit Message Validation

#### Format

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

- **type**: Required. One of: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `build`
- **scope**: Optional. The area of the codebase affected (e.g., `activities`, `auth`, `database`)
- **subject**: Required. Short description (max 100 characters)
- **body**: Optional. Detailed explanation
- **footer**: Optional. Breaking changes or issue references

#### Valid Examples

```bash
feat(activities): add filtering by date range
fix(auth): resolve API key validation issue
docs: update README with developer guide
refactor(database): optimize query performance
test(activities): add unit tests for filtering
build: update dependencies
```

#### Invalid Examples

```bash
# Missing type
Added new feature

# Missing space after colon
fix:bug

# Wrong type
feature: add new component
```

#### Troubleshooting Commit Messages

If your commit message is rejected:

1. Check the error message for specific format issues
2. Ensure the message follows the format: `<type>(<scope>): <subject>`
3. Verify the type is one of the allowed values
4. Make sure the subject is under 100 characters

Example fix:

```bash
# ❌ Invalid
git commit -m "Added new feature"

# ✅ Valid
git commit -m "feat: add new feature"
```

### Branch Naming Validation

#### Format

All feature branches must follow this naming pattern:

```
<type>/CORPCAL-<number>-<short-description>
```

#### Format Rules

- **type**: One of: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `build`, `chore`
- **Jira key**: `CORPCAL-` followed by digits (e.g., `CORPCAL-123`) - must be uppercase
- **description**: Lowercase, hyphens allowed, no spaces

#### Valid Examples

```bash
feat/CORPCAL-123-add-user-authentication
fix/CORPCAL-456-resolve-login-bug
docs/CORPCAL-789-update-readme
refactor/CORPCAL-101-optimize-database-queries
test/CORPCAL-202-add-unit-tests
```

#### Invalid Examples

```bash
# Wrong type
feature/CORPCAL-123-add-auth

# Wrong Jira key format
feat/corcal-123-add-auth
feat/CORPCAL-add-auth

# Missing description
feat/CORPCAL-123

# Contains spaces or uppercase
feat/CORPCAL-123-Add User Auth
```

#### Protected Branches

The following branches skip validation (you can push directly):

- `main`
- `master`
- `develop`

#### Troubleshooting Branch Names

If your branch name is rejected:

1. Check the error message for the expected format
2. Ensure the Jira key is `CORPCAL-<number>` (uppercase, with dash)
3. Verify the type matches one of the allowed values
4. Make sure the description is lowercase with hyphens

Example fix:

```bash
# ❌ Invalid
git checkout -b feature/corcal-123-auth

# ✅ Valid
git checkout -b feat/CORPCAL-123-add-authentication
```

### Bypassing Hooks

In exceptional circumstances, you can bypass hooks using the `--no-verify` flag:

```bash
# Skip commit message validation
git commit --no-verify -m "your message"

# Skip branch name validation
git push --no-verify
```

**⚠️ Warning**: Bypassing hooks should only be used in emergencies (e.g., hotfixes). It can lead to:

- Inconsistent commit history
- CI/CD failures
- Code quality issues
