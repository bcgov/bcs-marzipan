# Activity filters (shared spec)

This directory holds the single source of truth for how an `ActivityFilterState`
is interpreted across the Reports (server SQL) path and the Activity List
(client) path.

## Modules

| File                                  | Responsibility                                                                                     |
| ------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `../activity-filter-state.ts`         | `ActivityFilterState` type, defaults, coercion, key allow-list.                                    |
| `activityFilterStateToQueryParams.ts` | Maps filter state to HTTP query params for the Reports/list API.                                   |
| `activity-filter-match-input.ts`      | `ActivityFilterMatchInput` — normalized per-activity fields; `activityResponseToFilterMatchInput`. |
| `activity-filter-date.ts`             | Date helpers (`isDateInRange`, `isDateRangeActive`, `activityScheduledRangeMatches`).              |
| `activity-filter-match.ts`            | `activityMatchesFilterState` — the canonical predicate.                                            |
| `activity-searchable-text.ts`         | `getActivitySearchableTexts` / `activityMatchesSearchKeyword` — the single keyword field set.      |
| `activity-filter-active.ts`           | `hasActivityFilterCriteria` — value-based "any filter applied" check.                              |

## Predicate semantics

- **AND across dimensions**: every dimension with a value in state must pass.
- **OR within a multi-select**: any selected value matches.
- A dimension with no value in state is skipped.
- Field-scope visibility (e.g. pitch) does **not** gate predicates: criteria
  apply whenever present in state. The same goes for `hasActivityFilterCriteria`.

## Owners and parity

- The server SQL builder
  `calendar-service/src/activities/services/activity-find-all-filters.ts` is the
  Reports/list **API implementation**. `activityMatchesFilterState` is its
  behavioral **spec**; keep the two in sync.
- The Activity List client (`calendar-ui/src/lib/activity-query-utils.ts`)
  delegates directly to `activityMatchesFilterState`.
- Parity = same predicate rules, **not** identical row counts (Reports date
  windows / omitted settings vs list tab scoping / archive overlays differ).
- Translation **languages** are matched by ID when available, otherwise by a
  label resolver passed via `ActivityFilterMatchOptions` (the API response
  currently carries language display strings, not IDs).

## Adding a new filter field

1. Add the field to `ActivityFilterState` (and `ACTIVITY_FILTER_STATE_KEYS`,
   defaults, and `coerceActivityFilterStateFromRecord`).
2. Map it in `activityFilterStateToQueryParams.ts` and the API query-param
   schema.
3. Implement the SQL condition in `activity-find-all-filters.ts`.
4. Add the dimension to `activityMatchesFilterState` (and any new field on
   `ActivityFilterMatchInput` + its mappers).
5. Add it to `hasActivityFilterCriteria` so Clear/summary reflect it.
6. Add UI slots in `ActivityTableFilters.tsx` and `ReportFiltersBar.tsx`, plus
   summary chips in `calendar-ui/src/lib/activity-filter-summary.ts`.
7. Cover it in `activity-filter-match.spec.ts` fixtures and, if needed,
   `activity-find-all-filters.spec.ts`.
