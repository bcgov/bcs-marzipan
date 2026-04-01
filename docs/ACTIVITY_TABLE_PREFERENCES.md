# Activity table preferences and URL query parameters

The activity list persists table preferences (sort, page size, search, and **filter state**) in two ways:

1. **Session storage** — full `ActivityTablePreferences` JSON, including the complete `filterState` object from `@corpcal/shared`.
2. **URL query parameters** — a subset of that state, implemented in `calendar-ui/src/lib/activityTablePreferencesParams.ts` (`URL_PARAM_*` constants, `parseFromSearchParams`, serialization into the query string, and `hasAnySearchParams`).

## Maintenance when adding or changing a filter

- **`ActivityFilterState`** (and related defaults) live in `packages/shared/src/activity-filter-state.ts`. Update that module when introducing new filter dimensions.
- **`activityTablePreferencesParams.ts`** must stay aligned for anything that should appear in **shareable/bookmarkable URLs**:
  - Add or adjust `URL_PARAM_*` names.
  - Read new params in `parseFromSearchParams` and write them when building the query object (same file).
  - Include new params in the `hasAnySearchParams` check so the app detects “URL has filter-related state.”
- **Not every field is necessarily in the URL today** — for example, some multi-select dimensions may only round-trip via session storage while others use query params. When in doubt, confirm behavior in `parseFromSearchParams` and the serialize path in the same file.

Keeping URL encoding in one place avoids silent drift between the canonical filter model and what users can paste into the address bar.
