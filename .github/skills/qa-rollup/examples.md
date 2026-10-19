# QA rollup — example excerpt

Illustrates tone and structure. Not a real deploy range.

---

# QA rollup — develop — 2026-10-15

**Environment:** dev (develop deploy)  
**Range:** `31bdaf4` → `c24f8f00`  
**PRs included:** #454, #457

## Before you test

- [ ] Dev team has applied database migrations through 0007 and refreshed seed data if requested.
- [ ] Sign in with accounts listed below.

## Suggested test order

1. PR #454 (teams and planners)
2. PR #457 (review highlights on activity edit)

## Release smoke

- [ ] Sign in and open the activity list.
- [ ] Open an activity, save a harmless edit, open Reports and run a preview.

---

## PR #454 — CORPCAL-317 — Share With visibility and event planners

**What changed:** Teams can be hidden from the Share With picker; event planners are chosen from users marked as event planners.

**Where to look**

| Page                   | Area                           | What to verify                                                             |
| ---------------------- | ------------------------------ | -------------------------------------------------------------------------- |
| Users and teams        | `/users` → Edit team           | Switch **Appears in "Share With" options** — save and re-open              |
| Activity detail / edit | Sharing section                | Share With list only shows teams that are active and allowed in Share With |
| Users and teams        | `/users` → Create or edit user | **Event planner** switch                                                   |
| Activity detail / edit | Event section                  | Event planner dropdown lists flagged users; names sort by display name     |
| Activity detail / edit | History                        | Planner changes show names, not codes                                      |

**Steps**

1. Turn off Share With visibility for a test team; confirm it disappears from Share With on an activity but existing shares still show the team name.
2. Flag a user as event planner; open an activity and confirm they appear in Event planners without a full browser refresh (after save on user, re-open activity if needed).

**Who / setup**

- User admin access for team and user toggles.
- Seed may hide Share With for some teams — use a team you control for toggling.

---

## PR #457 — CORPCAL-322 — Form labels match review highlighting

**What changed:** On activity edit, changed fields use the same highlight style as the activity list; review highlighting requires review permission, not admin alone.

**Where to look**

| Page                   | Area              | What to verify                                                    |
| ---------------------- | ----------------- | ----------------------------------------------------------------- |
| Activity list          | Grid cells        | Amber highlight on fields changed since review (reviewer account) |
| Activity detail / edit | Form field labels | Matching amber on labels for unsaved or since-review changes      |
| Activity detail / edit | Sticky footer     | **Discard N change(s)** count matches edits                       |

**Steps**

1. As a user **with** review permission: review an activity, change a field, confirm list and form both highlight it.
2. As admin **without** review permission: confirm since-review highlights do not appear; unsaved edits still behave as expected.

**Who / setup**

- One account with **Review activities** permission; one admin without it.

---
