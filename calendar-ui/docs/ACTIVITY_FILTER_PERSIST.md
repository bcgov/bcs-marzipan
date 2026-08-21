# Activity table sort and filter persistence

The activity list persists sort and filter state so it survives navigation and can be shared via URL. This doc describes how the implementation works and how to add new filters.

## Overview

- **URL search params** (via `useSearchParams` from React Router): When the user lands on the list with query params (e.g. `/?sort=lastUpdated&dir=desc`), state is restored from the URL. Links with params are shareable and bookmarkable.
- **sessionStorage**: When the user lands on `/` with no relevant params (e.g. after clicking "Activities" in the sidebar or before any preferences exist), state is restored from sessionStorage for the current tab. This covers "navigate away and back" within the same session.
- **Write path**: Whenever the user changes sort or a filter, the hook updates React state, then a `useEffect` syncs the same values to both the URL (`setSearchParams`) and sessionStorage. URL updates use `replace: true` so each change does not push a new history entry.

So URL and sessionStorage always hold the same preference shape; the only difference is **when** we read from which source (URL wins when it has any of our known params).

## Saved filter default auto-apply

- Saved filters are available across activity list contexts/tabs.
- The user default saved filter is global for activity lists.
- Default auto-apply only runs when initial state is effectively blank.
- Auto-apply is skipped when either:
  - URL includes any known activity query params, or
  - restored preferences already contain active filters and/or a non-empty search.

This prevents defaults from overwriting explicit user intent during navigation.

## How URL and sessionStorage work together

### Read path (initial state)

On mount, the hook decides initial preferences in this order:

1. **URL has any known param?** (`sort`, `dir`, `completed`, `deleted`, `pageSize`, `search`)  
   If **yes**: Parse all preferences from the URL (with validation and defaults for missing/invalid values). Ignore sessionStorage for this load.
2. **Otherwise**: Read from sessionStorage key `activityTablePreferences`. Parse and validate. If invalid or missing, use `DEFAULT_PREFERENCES`.

So: **URL is the source of truth when it contains any of our params.** An empty or unrelated query string triggers a sessionStorage restore.

### Write path (user changes something)

When the user changes sort or a filter:

1. `setPreferences(partial)` updates React state (merge with current preferences).
2. A `useEffect` runs because `preferences` changed. It only syncs if the change came from the user (a ref guards the initial mount).
3. Sync step: call `setSearchParams(preferencesToParams(preferences), { replace: true })` and `sessionStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))`.

So URL and sessionStorage are updated together; they are not sources of truth for each other, they are two outputs from the same state.

### Summary

| Scenario                                                                  | Source used                                                 |
| ------------------------------------------------------------------------- | ----------------------------------------------------------- |
| User opens `/?sort=lastUpdated&dir=desc` (e.g. shared link or breadcrumb) | URL                                                         |
| User opens `/` with no params (e.g. sidebar "Activities")                 | sessionStorage, or defaults if empty                        |
| User changes sort/filter on the list                                      | State updates, then URL and sessionStorage are both written |

## Data shape and URL param names

Defined in [calendar-ui/src/hooks/useActivityTablePreferences.ts](src/hooks/useActivityTablePreferences.ts):

| Preference    | URL param   | Type                                    | Default     |
| ------------- | ----------- | --------------------------------------- | ----------- |
| sortKey       | `sort`      | string (must be in VALID_SORT_KEYS)     | `startDate` |
| sortDirection | `dir`       | `asc` \| `desc`                         | `asc`       |
| showCompleted | `completed` | boolean                                 | `false`     |
| showDeleted   | `deleted`   | boolean                                 | `false`     |
| pageSize      | `pageSize`  | number (1–100)                          | `25`        |
| searchKeyword | `search`    | string (keyword; sync to URL debounced) | `''`        |

- **sessionStorage key**: `activityTablePreferences`. Stored value is a single JSON object with these keys.
- **pageIndex** is not persisted; it is local component state and resets when filters change.

## Adding a new filter (or preference)

To add a new persisted filter (or any new field in the preferences object), update the hook in one place and the consumer (e.g. ActivityTable) in another.

### 1. Hook: [useActivityTablePreferences.ts](src/hooks/useActivityTablePreferences.ts)

Do all of the following so the new field is read from URL, read from sessionStorage, validated, and written back to both.

1. **URL param constant**  
   Add a constant, e.g. `const URL_PARAM_MY_FILTER = 'myFilter';`

2. **Type and defaults**
   - Add the field to `ActivityTablePreferences` (e.g. `myFilter: boolean`).
   - Add it to `DEFAULT_PREFERENCES` with the default value.

3. **Parsing from URL**  
   In `parseFromSearchParams`, read the param (e.g. `searchParams.get(URL_PARAM_MY_FILTER)`), parse/validate, and add the field to the returned object. Use the same pattern as existing fields (e.g. `parseBool` for booleans, or a small validator for numbers/enums).

4. **"Known param" check**  
   In `hasAnyKnownParam`, add `searchParams.has(URL_PARAM_MY_FILTER)` so that when this param is present we treat the URL as source of truth.

5. **Parsing from sessionStorage**  
   In `parseFromStorage`, read `parsed.myFilter`, validate type and bounds, and add the field to the returned object. If invalid, use the default from `DEFAULT_PREFERENCES`. Apply any permission gating here if needed (e.g. like `showDeleted` and `canSeeDeleted`).

6. **Serialization to URL and storage**  
   In `preferencesToParams`, add a line so the new field is included in the object passed to `URLSearchParams` and thus to the URL. sessionStorage already stores the full `preferences` object as JSON, so no extra step there.

7. **Optional: permission gating**  
   If the filter should be hidden or forced off for some users (e.g. `showDeleted` and `canSeeDeleted`):
   - In `parseFromSearchParams` and `parseFromStorage`, when the user cannot use the feature, set the field to the safe default (e.g. `false`).
   - In `setPreferences`, when merging `partial`, if the field is in `partial` and the user cannot use it, ignore or override it (same pattern as `showDeleted`).

### 2. Consumer: [ActivityTable.tsx](src/components/activity/ActivityTable/ActivityTable.tsx)

1. Read the value from `preferences` (e.g. `preferences.myFilter`).
2. When the user changes the filter, call `setPreferences({ myFilter: newValue })`.
3. Use the value where needed (e.g. in `activityFilters` or in the filter UI). Keep the existing “reset to first page when filters change” behavior if this filter affects the list.

### 3. Breadcrumb (if the list is linked from elsewhere)

The breadcrumb “Activities list” link uses `getStoredActivityListSearch(canSeeDeleted)` to build the list URL. That function reads from sessionStorage and builds a query string from the same `preferencesToParams` shape. So once the new field is in `ActivityTablePreferences` and `preferencesToParams`, the breadcrumb will include it automatically. No change needed in [ActivityBreadcrumb.tsx](src/components/shared/ActivityBreadcrumb.tsx) unless the new filter is permission-gated (then ensure `canSeeDeleted` or an equivalent is passed where needed; the breadcrumb already passes `canSeeDeleted` for `showDeleted`).

### Checklist for a new filter

- [ ] `ActivityTablePreferences` and `DEFAULT_PREFERENCES`
- [ ] URL param constant and `hasAnyKnownParam`
- [ ] `parseFromSearchParams` (read + validate + default)
- [ ] `parseFromStorage` (read + validate + default; permission override if needed)
- [ ] `preferencesToParams` (so URL and breadcrumb include the new param)
- [ ] ActivityTable: read from `preferences`, call `setPreferences` on change, use value in filters / UI

## Key files

| File                                                                                                                  | Purpose                                                                                                                                                                                                       |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [calendar-ui/src/hooks/useActivityTablePreferences.ts](src/hooks/useActivityTablePreferences.ts)                      | Hook that holds preferences state, reads from URL or sessionStorage on mount, and syncs writes to both. Exports `useActivityTablePreferences`, `getStoredActivityListSearch`, and `ActivityTablePreferences`. |
| [calendar-ui/src/components/ActivityTable/ActivityTable.tsx](src/components/activity/ActivityTable/ActivityTable.tsx) | Uses `useActivityTablePreferences(canSeeDeleted)` and passes `preferences` / `setPreferences` into sort and filter UI.                                                                                        |
| [calendar-ui/src/components/ActivityBreadcrumb.tsx](src/components/shared/ActivityBreadcrumb.tsx)                     | “Activities list” link uses `getStoredActivityListSearch(canSeeDeleted)` so View/Edit/Create breadcrumbs return to the list with stored sort/filters in the URL.                                              |

## Edge cases

- **Invalid or missing stored data**: Parsers fall back to defaults; the table always renders.
- **canSeeDeleted**: When the user cannot see deleted activities, `showDeleted` is forced to `false` when reading (URL or storage) and when applying updates in `setPreferences`. The breadcrumb passes `canSeeDeleted` into `getStoredActivityListSearch` so the link never includes `deleted=true` for those users.
- **Replace vs push**: `setSearchParams(..., { replace: true })` avoids one history entry per sort/filter change.
