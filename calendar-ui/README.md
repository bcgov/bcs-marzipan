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
    layout/      # App shell (Layout, Sidebar, Header, PageContainer, PageHeader, ProtectedRoute, error boundaries)
    shared/      # Cross-feature components (ErrorState, StatusMessage, ActivityBreadcrumb, CalendarFilters, DashboardBarChart, etc.)
    activity/    # Activity-specific UI (form body/sections, table, modals, history)
    Table/       # Generic table; pagination, summary bar, sort; see README for management-table UX
    ui/          # Shadcn-style primitives (button, dialog, select, etc.)
    users/       # User management (filters, modals, tab content)
    teams/       # Team management
    admin/       # Lookup/admin UIs
    reports/     # Report-related components
  contexts/      # Auth and other React context
  hooks/         # useAuth, useFormLookups, etc.
  lib/           # utils, form helpers, error handling
  pages/         # Route-level views (UserManagement, Dashboard, etc.)
  schemas/       # Zod schemas
  styles/        # globals.css, App.css
  test/          # Test setup and test-utils
```

## Azure AD local development

The login page shows a **Sign in with Microsoft** button automatically when the backend reports that Azure is configured. To test this locally:

1. Create a `.env` file at the **monorepo root** (`bcs-marzipan/.env`) with your App Registration credentials:

   ```bash
   # Azure AD App Registration (BC Gov IDIR tenant)
   AZURE_TENANT_ID=your-tenant-id
   AZURE_CLIENT_ID=your-app-client-id
   AZURE_CLIENT_SECRET=your-app-client-secret

   # Explicit callback URL — must exactly match an entry in your Azure App Registration.
   # For local development, register https://localhost:3001/api/auth/azure/callback
   # Leave blank to auto-derive from the request host.
   AZURE_REDIRECT_URI=

   # Required so the backend activates the OIDC redirect endpoints
   AUTH_STRATEGY=azure
   ```

2. Register the redirect URI in your Azure App Registration:

   | Environment            | Redirect URI to register                          |
   | ---------------------- | ------------------------------------------------- |
   | Local (backend direct) | `http://localhost:3001/api/auth/azure/callback`   |
   | Local (via UI proxy)   | `http://localhost:3000/api/auth/azure/callback`   |
   | Dev / staging          | `https://<your-env-host>/api/auth/azure/callback` |

3. Start both services (`npm start` from the repo root). The **Sign in with Microsoft** button appears on the login page once `GET /api/auth/azure/config` responds `{ "enabled": true }`.

4. After a successful sign-in, the backend sets the httpOnly auth cookie and redirects to `/`. The user must already have an active account in the database whose `adEmail` matches the Azure AD `preferred_username` claim; otherwise login is refused with an `azure_no_account` error.

> **Local accounts only** — the Azure OIDC flow does not auto-provision new users. An admin must create the user record in advance.

## Docs

- **[Management tables UX](src/components/Table/README.md)** – Sticky header, scrolling, skeleton loading, column widths, filters, sort, and pagination. Users/Teams tables as reference.
- **Activity table URL & session preferences** — See [Activity table preferences](../docs/ACTIVITY_TABLE_PREFERENCES.md) (repo root `docs/`) for how `activityTablePreferencesParams.ts` maps filters to query strings and what to update when adding filter types.
