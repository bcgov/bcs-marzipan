# Continuous integration and quality gates

This document describes how GitHub Actions, local git hooks, and deploy workflows stay aligned.

## Canonical command: `npm run verify`

Root [`package.json`](../package.json) defines `verify` as the same bar CI uses:

```bash
npm run verify
```

Steps (in order): `format:check` → `build` → `check` (lint + typecheck) → `test` → `perf:k6:inspect`.

For a faster local check (same as pre-push minus schema validation):

```bash
npm run verify:quick
```

## GitHub Actions

| Workflow                                                             | When                                                 | What                                                                |
| -------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------- |
| [Code quality checks](../.github/workflows/code-quality-checks.yaml) | PR and push to `main` / `develop`                    | Reusable job: `npm run verify` + npm audit (critical, non-blocking) |
| [Deploy to Emerald](../.github/workflows/deploy-emerald.yaml)        | Push to `develop` / `test` / `prod`, manual dispatch | **Quality Checks** job runs before Artifactory build/promote        |

Reusable implementation: [`.github/workflows/_code-quality.yaml`](../.github/workflows/_code-quality.yaml). The job name reported to GitHub is **Quality Checks**.

The legacy OpenShift dev deploy on push to `develop` ([`pr-deploy-dev.yaml`](../.github/workflows/pr-deploy-dev.yaml)) builds images without running `verify`; Emerald and PR CI are the primary quality gates for that branch.

## CodeQL and other org checks

[CodeQL](https://codeql.github.com/) and other organization-level scans focus on security and dependency analysis. They do **not** replace `verify` (formatting, lint, build, tests, k6 script validation). Use both: required **Quality Checks** for merge/deploy confidence, plus org security tooling where configured.

## Branch protection (repository admins)

Configure in GitHub **Settings → Branches → Branch protection rules** for `develop` and `main`:

1. **Require status checks to pass** before merging.
2. Add required check: **Quality Checks** (from the _Code quality checks_ workflow on pull requests). If GitHub shows a prefixed name (e.g. `Quality Checks / quality-checks`), use the exact label from a green PR check run.
3. **Require branches to be up to date** before merge (recommended) to reduce “green PR, red merge” from drift.
4. Treat local Husky hooks as best-effort: `git commit --no-verify`, `git push --no-verify`, and merges from the GitHub UI bypass hooks. Required status checks are the enforcement layer.

## Local hooks vs CI

| Stage          | Scope                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------- |
| Pre-commit     | Staged files: Prettier, ESLint, related Vitest tests — see [Pre-Commit Hooks](PRE_COMMIT_HOOKS.md) |
| Pre-push       | `format:check`, `check`, `validate-types` (shared), branch naming on feature branches              |
| CI / pre-merge | Full `npm run verify`                                                                              |

Run `npm run verify` locally before opening or updating a PR when you want full parity with CI without waiting on Actions.
