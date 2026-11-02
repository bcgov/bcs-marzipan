---
name: qa-rollup
description: >-
  Produces a non-technical QA test plan from pull requests merged to origin/develop
  since a baseline commit. Groups by PR with page and section locations and manual
  checks. Use when the user asks for a QA rollup, develop push testing, release
  notes for QA, or what to test after merge to develop.
---

# QA rollup (develop)

Build a **non-technical** manual test document for QA. Group by **merged PR**. For each user-facing change, state **which page and area** to use and **what to verify**.

## When to use

- User asks for a QA rollup, test plan for develop, or "what should QA test?"
- After a push or deploy to **develop** (dev environment)
- User gives an optional range: "since `abc123`", "since PR #465", or a **Next baseline** SHA from a prior rollup

## References (this folder)

- UI routes and section names: [ui-map.md](ui-map.md)
- Output style: [examples.md](examples.md)

## Scope: what landed on develop

1. `git fetch origin develop`
2. **Head:** `origin/develop` (unless user names another ref)
3. **Base** (first match):
   - User-provided commit SHA or tag
   - "Since PR #N" — resolve that PR's merge commit on `develop`
   - User pasted **Next baseline** from a previous rollup
   - Else ask which baseline to use (do not assume a saved file in the repo)
   - Use `git merge-base origin/main origin/develop` only when the user explicitly wants everything on develop that is not on main
4. **PR list:**
   - `git log <base>..<head> --first-parent --merges --format='%H %s'`
   - Include squash/direct commits on first-parent that mention `(#NNN)` in the subject
5. Record **base SHA**, **head SHA**, and **date** at the top of the rollup

## Gather context per PR

For each PR number `N`:

1. `gh pr view N --json title,body,labels,mergedAt,url`
2. Parse the PR **body** (common sections: Summary, Important, Changes, Testing):
   - **Testing** — turn checklist items into QA steps when they are user-facing
   - **Important** — migrations, env vars, permissions, build steps → **Before you test** (QA waits on dev; do not ask QA to run DB CLI)
   - **Summary / Changes** — plain-language "what changed" for users
3. **Optional comments** — only if the PR body lacks manual test hints:
   - `gh pr view N --comments`
   - Use human QA-relevant notes only; skip review nits and bot comments

Classify the PR:

| Type                                            | Rollup treatment                                                   |
| ----------------------------------------------- | ------------------------------------------------------------------ |
| Format, lint-only, chore with no product impact | One line: no user-facing testing                                   |
| Docs / Swagger-only                             | Smoke or "skip unless QA uses API docs"                            |
| Database migrations                             | **Before you test** (dev team runs migrate/seed; QA waits for env) |
| OpenShift / CI only                             | Deploy smoke: login + one critical path                            |
| UI + API behaviour                              | Page/section table + steps                                         |

Inspect code only to locate UI areas (not to write technical detail in the deliverable):

- `git diff <merge>^1..<merge>^2 --stat`
- Focus on `calendar-ui/src/pages/`, `calendar-ui/src/components/`, `calendar-ui/src/App.tsx`
- Map to [ui-map.md](ui-map.md) names and routes

## Deliverable rules (non-technical)

- Use **page names and routes** (`/reports`), not file paths or component names in the final document
- Use plain language: "what you should see", "try this", "should not happen"
- Call out **roles or permissions** when behaviour differs (e.g. "user who can review activities")
- Separate **Before you test** (migrations, env, build packages — tell QA what dev must do first) from **test cases**
- Do not instruct QA to run `db:migrate`, `db:generate`, or npm scripts unless the user is a developer asking for a combined handoff; default audience is manual QA

## Output delivery

**Default: post the full rollup in the chat response.** Do not create or edit repo files unless the user asks to save the document somewhere.

- Use the template below as the body of your reply (one continuous markdown document).
- End with **Next baseline:** `[full or short head SHA]` — tell the user to use `since <sha>` on the next rollup.

## Output template

```markdown
# QA rollup — develop — [YYYY-MM-DD]

**Environment:** dev (develop deploy)  
**Range:** [base SHA short] → [head SHA short]  
**PRs included:** #…, #…  
**PR links:** (optional list)

## Before you test

- [ ] …

## Suggested test order

1. …

## Release smoke (whole deploy)

- [ ] Sign in
- [ ] …

---

## PR #NNN — [TICKET if known] — [short title]

**What changed:** One sentence for users.

**Where to look**

| Page | Area | What to verify |
| ---- | ---- | -------------- |
| …    | …    | …              |

**Steps**

1. …

**Who / setup**

- …

**No UI change**

- … (omit section if everything is user-facing)

---
```

## Quality checklist

Before finishing:

- [ ] Every PR in scope is listed or explicitly excluded with reason
- [ ] Each user-facing PR has at least one row in **Where to look**
- [ ] Permissions and test accounts noted where behaviour differs
- [ ] Migrations and env called out in **Before you test** when in scope
- [ ] No duplicate retesting of the same fix across PRs (note "already validated at baseline X" when applicable)
- [ ] Wording is understandable without reading the codebase

## Workflow summary

1. Resolve base and head on `origin/develop`
2. List merged PRs and direct merges
3. For each PR: title, user summary from PR body (+ diff + ui-map for locations)
4. Merge **Before you test** and smoke list once at the top
5. **Post the complete rollup in chat** using the output template
6. End with **Next baseline:** head SHA
