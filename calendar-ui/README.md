# Calendar UI

Frontend for the Corporate Calendar (bcs-marzipan).

## Stack

- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS v4** (with `@tailwindcss/vite`)
- **Radix UI** primitives (Shadcn-style components in `src/components/ui/`)
- **TanStack** Query (data) and Table (pagination/sorting)
- **React Router 7**, **Lucide** icons, **react-hook-form** + **Zod**

## Scripts

| Script       | Command                            | Description                   |
| ------------ | ---------------------------------- | ----------------------------- |
| `dev`        | `vite`                             | Dev server                    |
| `build`      | `tsc && vite build`                | Type-check + production build |
| `preview`    | `vite preview`                     | Preview production build      |
| `test`       | `vitest run`                       | Run tests                     |
| `test:watch` | `vitest`                           | Tests in watch mode           |
| `test:cov`   | `vitest run --coverage`            | Coverage                      |
| `lint`       | `eslint "src/**/*.{ts,tsx}" --fix` | Lint + fix                    |
| `typecheck`  | `tsc --noEmit`                     | Type-check only               |

## CSS globals

Main entry: **`src/styles/globals.css`**.

- **Tailwind** (`@import 'tailwindcss'`) and **tw-animate-css**
- **BCSans** `@font-face` (Regular, Italic, Light, Bold; woff2)
- **`:root` / `.dark`** theme variables: semantic tokens (`--background`, `--foreground`, `--primary`, `--muted`, `--border`, etc.), radius, chart/sidebar/link colors
- **BC Gov brand**: `--bc-blue`, `--bc-blue-light`, `--bc-gold`, `--bc-gold-dark`; `--tabs-underline`, `--link`
- **Tailwind theme** mapping in `@theme` / `@theme inline` so utilities (`bg-background`, `text-foreground`, etc.) use the CSS vars
- **Base**: `body` uses BCSans; `body[data-scroll-locked]` overrides Radix scroll-lock margin so layout doesn’t jump

`src/styles/App.css` is legacy; new styles use Tailwind and globals.

## File structure

```
src/
  api/           # API clients (axios, react-query usage)
  components/    # Feature and shared components
    Table/       # Pagination, summary bar, sort; see README for management-table UX
    ui/          # Shadcn-style primitives (button, dialog, select, etc.)
    users/       # User management (filters, modals, tab content)
    teams/       # Team management
    admin/       # Lookup/admin UIs
  contexts/      # Auth and other React context
  hooks/         # useAuth, useFormLookups, etc.
  lib/           # utils, form helpers, error handling
  pages/         # Route-level views (UserManagement, Dashboard, etc.)
  schemas/       # Zod schemas
  styles/        # globals.css, App.css
```

## Docs

- **[Management tables UX](src/components/Table/README.md)** – Sticky header, scrolling, skeleton loading, column widths, filters, sort, and pagination. Users/Teams tables as reference.
