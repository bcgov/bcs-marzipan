# Shadcn/UI Theming and Augmentation Guide

This guide standardizes how we theme and extend base Shadcn components so updates stay low-friction and the UI stays consistent.

**Mental model:** Shadcn/ui is a starter kit you own, not a packaged library. Treat it as a design system: keep branding and layout decisions in tokens and variants, not scattered across component markup.

---

## 1. Theme via CSS variables (design tokens)

**Why:** A single change to a token updates all components. Re-adding a component with `npx shadcn add` does not overwrite your theme, because components use semantic classes that map to your variables.

**Do:**

- Keep `tailwind.cssVariables: true` in `components.json`.
- Define and override semantic variables in `src/styles/globals.css` (`:root` and `.dark`): `--background`, `--foreground`, `--primary`, `--input-height`, etc.
- Use semantic Tailwind classes in components: `bg-background`, `text-foreground`, `bg-primary`, `h-(--input-height)`.
- Add app- or brand-specific tokens in the same file (e.g. BCSDS colors, `--input-height`) so one place controls layout and color.

**Avoid:** Hardcoded colors or fixed sizes in component files (e.g. `h-9`, `text-gray-500`) when a token would apply across the app.

---

## 2. Add or extend variants via CVA (not one-off classes)

**Why:** Centralizes styling so you use a prop instead of repeating custom class strings. Shadcn components already use `class-variance-authority` (CVA) for variants; extend that pattern for repeated looks.

**Do:**

- Add new variants in the component’s CVA definition (e.g. `variant: "brand"`, `size: "input"`).
- Use the variant everywhere as a prop: `<Button size="input">`, `<Badge variant="primary">`.
- Keep customizations in one place so re-applying them after an update is a small, predictable diff.

**Avoid:** The same custom look applied in many places via `className`; that should become a variant.

---

## 3. Wrap for app-specific behavior (composition)

**Why:** Keeps base `components/ui` files close to upstream and isolates product rules in wrappers.

**Do:**

- Keep `components/ui/*` as thin primitives.
- Create app-level components that compose them (e.g. `components/app/PrimaryButton.tsx` that renders `<Button variant="primary" />` with default props or behavior).
- Put app-only behavior (e.g. `FormDisplayOptionsProvider`, analytics, validation) in wrappers or context, not inside the base Form/Input.

**Avoid:** Forking or heavily editing base component structure for behavior that could live in a wrapper.

---

## 4. Minimal, targeted overrides for one-offs

**Why:** Most of the look should come from tokens and variants; only a small share from per-instance overrides.

**Do:**

- Use the `cn()` pattern and pass `className` for true one-offs (e.g. a single marketing or layout exception).
- Prefer semantic tokens in overrides when possible (`text-muted-foreground` instead of `text-gray-500`).

**Avoid:** Repeated override patterns; those should become variants or tokens.

---

## 5. Safe update workflow

**Why:** Shadcn is copy-into-repo; updates are always a merge.

**Do:**

- Prefer not editing base component markup/structure; use tokens, variants, and wrappers instead.
- When running `npx shadcn add <component>` or updating a component:
  1. Re-run the add/update.
  2. Review the diff.
  3. Re-apply only the minimal local customizations (see `UI_CUSTOMIZE_LOG.md`).
- Document customizations in `UI_CUSTOMIZE_LOG.md` so future updates know what to re-apply.

**Avoid:** Forgetting what was changed; the log is the source of truth for base UI patches.

---

## Summary

| Concern                   | Approach                                                                                                   |
| ------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Theming**               | CSS variables in `globals.css`; components use semantic classes only.                                      |
| **Repeated styles**       | CVA variants (e.g. Button `size="input"`, Badge `variant="primary"`); use props, not repeated `className`. |
| **App-specific behavior** | Wrappers in `components/app` or context; compose `@/components/ui`.                                        |
| **One-offs**              | `className` + `cn()`, used sparingly.                                                                      |
| **Updates**               | Re-add/update via CLI; re-apply only what’s in `UI_CUSTOMIZE_LOG.md`.                                      |
