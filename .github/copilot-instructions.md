# Corporate Calendar — Agent Instructions

Monorepo for corporate calendar activities, approvals, and reporting.

## Repository layout

- `calendar-service` — NestJS backend API
- `calendar-ui` — React frontend
- `packages/database` — Drizzle schema, migrations, seeds
- `packages/shared` — Shared Zod schemas, types, utilities
- `docs` — Project documentation

## Tech stack

Node.js >= 24, npm workspaces. **Service:** NestJS 11, PostgreSQL, Drizzle, Zod, JWT, Socket.IO. **UI:** React 19, Vite, Tailwind v4, Radix/Shadcn, TanStack Query/Table, react-hook-form + Zod. Env vars in root `.env`.

## Working style

- Read existing code before creating new patterns; reuse components, hooks, utilities, and schemas.
- Extend existing features instead of parallel abstractions. Keep diffs focused on the task.
- Run `npm run check` and relevant tests before finishing.

## Path-specific instructions

`.github/instructions/*.instructions.md` auto-apply via `applyTo` when editing matching paths.

## Boundaries

- Do not edit generated output (`dist/`, coverage, `packages/database/migrations`) unless explicitly instructed.
- Do not run database CLI commands (`db:generate`, `db:migrate`, `db:push`, `db:add-extensions`) — hand off to the user; see `.github/instructions/database.instructions.md`.
- Do not add dependencies without clear justification.
- Do not change auth, authorization, or permissions without tests.
- Do not reorganize folders unless required by the task.

## Coding standards

- TypeScript everywhere; import only needed React symbols (no `import * as React`). Match patterns in the file you edit.
- Validate with Zod; share schemas in `@corpcal/shared` when used by both UI and API.
- Schema changes in `packages/database/` — see `.github/instructions/database.instructions.md`.

## UI conventions

- See `.github/instructions/ux.instructions.md` when editing `calendar-ui/`.

## Common commands

`npm start` · `npm run check` · `npm run test` · `npm run build` · `npm run build:packages`

## Architecture

- Build `packages/*` before service/UI when shared types change.
- **Backend:** Feature modules in `calendar-service/src/<feature>/`. RBAC via `policy/` guards and `DataScopeInterceptor`. DB access in services, not controllers.
- **Frontend:** `api/`, `components/`, `hooks/`, `lib/`, `pages/`, `schemas/`.

## Testing

- Vitest; colocate `*.spec.ts` / `*.spec.tsx` — not `*.test.ts`. Focus on contracts, validation, pure logic.
- See `docs/TESTING.md` for full conventions.

## Deeper docs

`README.md` · `docs/TESTING.md` · `docs/ERROR_HANDLING.md` · `docs/AUTH_AND_RBAC.md` · `.github/instructions/` (path-specific)
