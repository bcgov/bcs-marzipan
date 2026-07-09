---
description: calendar-ui design system, components, and table UX patterns
applyTo: 'calendar-ui/**'
---

# UI / UX instructions

Frontend conventions for `calendar-ui`. Reuse before creating: check `components/ui/`, `components/shared/`, and nearby feature folders first.

## Design system

- Use semantic Tailwind utilities tied to CSS vars (`bg-background`, `text-foreground`, `border-border`) — defined in `src/styles/globals.css`.
- BC Gov brand tokens: `--bc-blue`, `--bc-gold`, etc. Font: BCSans via `@corpcal/shared/styles/bcsans-font-face.css`.
- Do not add styles to `App.css` (legacy). New styling uses Tailwind and `globals.css`.
- Add or update Shadcn via CLI: `npx shadcn@latest add <component>`. Follow `calendar-ui/docs/SHADCN_STANDARDIZATION_GUIDE.md`.
- Extend repeated styles via CVA variants, not one-off `className` strings.

## Component structure

- **Pages** compose feature components; keep route logic thin.
- **Presentation** in `components/`; **data-fetching** in `api/` (axios + TanStack Query) or `hooks/`.
- **Forms:** react-hook-form + Zod; mirror validation schemas in `@corpcal/shared` when shared with the API.

## Accessibility and patterns

- Preserve labels, focus management, and ARIA on forms, dialogs, tables, and navigation (Radix/Shadcn defaults).
- **Management tables:** follow `src/components/table/README.md` (Users/Teams exemplar; see `src/pages/UserManagement.tsx`).

More detail: `calendar-ui/README.md` · `calendar-ui/docs/SHADCN_STANDARDIZATION_GUIDE.md` · `calendar-ui/docs/UI_CUSTOMIZE_LOG.md`
