---
description: Drizzle schema, seeds, and migration handoff for packages/database
applyTo: 'packages/database/**'
---

# Database instructions

Schema and migrations for `@corpcal/database`. Follow global boundaries: do not run database CLI commands or hand-edit committed migration SQL / `migrations/meta/` unless explicitly instructed.

## What the agent does

- Define tables and columns in `src/schema/` via Drizzle only — no ad-hoc SQL in app code.
- Export types from schema modules; keep naming consistent with existing tables.
- Update `seeds/` when lookup or required seed data changes; follow existing numbering.
- If schema extensions are needed (`pg_trgm`, etc.), edit `scripts/templates/postgresql_extensions.sql` and note it for the user. Tell the user to run `db:add-extensions` only after a squash, not incremental.

## What the user runs (handoff required)

`db:generate` and `db:migrate` require interactive Drizzle Kit prompts agents cannot complete. After schema edits, **stop and tell the user** to run the steps below.

### Incremental migration (default — current repo workflow)

This repo keeps incremental migrations in `migrations/`. Do **not** delete, edit, or archive existing migrations.

1. `npm run db:generate --workspace=packages/database -- YYYYMMDD_description`
2. Carefully complete Drizzle CLI prompts.
3. Review generated SQL in `migrations/` — check for unexpected `DROP TABLE` / `DROP COLUMN`.
4. `npm run db:migrate --workspace=packages/database` (or `db:push` for local-only reset).
5. `npm run seed --workspace=calendar-service` (if seeds changed).

Do **not** run `db:add-extensions` for incremental migrations.

## Agent handoff template

When finishing schema work, include:

```
## Schema handoff

**Changes:** <summary of schema/seed changes>
**Migration name:** YYYYMMDD_kebab-description
**User steps:** incremental migration workflow above
**Also note:** <any extension template updates that need applying>
```

Full workflows: `packages/database/README.md`
