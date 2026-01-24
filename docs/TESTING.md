# Testing: Strategy, Standards, and Conventions

This document describes the testing strategy, folder structure, naming conventions, and guidelines for the Corporate Calendar monorepo.

## Commands

- **Root:** `npm run test` runs `calendar-service` (Jest), `calendar-ui` (Vitest), and `packages/shared` (Vitest) concurrently.
- **Per-workspace:**
  - `npm run test -w calendar-service`
  - `npm run test -w calendar-ui`
  - `npm run test -w packages/shared` (run after `npm run build:packages` when running in isolation, since schemas depend on `@corpcal/database`)
- **Watch:** `npm run test:watch -w <workspace>` where supported.

## Strategy

- **Initial scope:** Unit tests only. No E2E, no MSW, no snapshots, no DOM-structure assertions, no strict API response-shape tests. Focus on stable domain contracts, validation, and pure or lightly mocked logic.
- **Order of impact:** `packages/shared` (schemas, utils) → `calendar-service` (pipes, `ActivityUtilsService`) → `calendar-ui` (form-utils, stable components like `FreeformCombobox`).

## Structure and Naming

- **All workspaces:** `*.spec.ts` and `*.spec.tsx` colocated with source. Do not use `*.test.ts` / `*.test.tsx`.
- **calendar-service:** Shared factories in `common/test-utils.ts`.
- **calendar-ui:** `src/test/setup.ts`, `src/test-utils.tsx`.
- **packages/shared:** `src/__fixtures__/` or `src/test-utils/`. E2E (future) in `__tests__/`.

## When Tests Run

- **Pre-commit (lint-staged):** Related tests for changed `calendar-service` and `calendar-ui` files via `scripts/test/jest-related.js` and `vitest-related.js`. `packages/*` only run ESLint.
- **Pre-push:** Full build, then all test suites (`calendar-service`, `calendar-ui`, `packages/shared`) via the root `npm run test` (after `npm run build`).

## Related Documentation

- [scripts/test/README.md](../scripts/test/README.md) — `jest-related` and `vitest-related` scripts used by lint-staged
- [Pre-Commit Hooks](PRE_COMMIT_HOOKS.md) — Hooks and pre-push behavior
