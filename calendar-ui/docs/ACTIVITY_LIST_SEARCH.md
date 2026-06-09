# Activity list keyword search and filtering strategy

This document describes the activity list keyword search, the server vs client filtering split, and long-term suggestions for scaling.

## Filtering strategy

The activity list uses **server-side** filtering only for:

- **Archive:** `includeCompleted` and `includeDeleted` (driven by "Show completed" / "Show deleted" and by the Status filter when it includes Completed or Deleted).
- **Tab context (array params, OR semantics):** `leadTeamIds`, `commsContactLeadUserIds`, `sharedWithTeamIds`, `flagAssigneeUserIds` when viewing a ministry, My activities, Shared with me, or Assigned to me tab. Tabs pass single-element arrays (e.g. `leadTeamIds: [teamId]`).

All other filtering is **client-side** over the cached list: date range, status (dropdown), category, pitch, tags, leads, translations, and keyword search. At expected scale (~1–1.5k active rows, up to ~10k with archive), client-side filtering is performant and keeps a single pipeline for adding new filters without API changes.

## Reports vs Activity List

**Reports** apply the full `ActivityFilterState` on the **server** via `activityFilterStateToQueryParams` (array query params, OR semantics). Preview applies **keyword search client-side** over the cached report payload (search is excluded from the fetch query key). Export (PDF/CSV/XLSX) passes `search` to the server so downloaded files match the on-screen filter. The summary bar counts activities after client-side search.

**Activity List** keeps the hybrid model above: tab/archive params on the API; filter-panel criteria client-side for table responsiveness.

**Saved filters** are shared globally (same API payload). Applying a saved filter on Reports sets the same `filterState` + `searchKeyword` as on the Activity List; Reports honor every field server-side.

Unified query shape: all ID-list filters use `…Ids` array params in HTTP (comma-separated). Single-select is represented as a one-element array.

### Shared filter spec (predicate parity)

Both surfaces interpret `ActivityFilterState` through one shared specification in `packages/shared/src/filters/`:

- `activityMatchesFilterState` (in `activity-filter-match.ts`) is the canonical predicate (AND across dimensions, OR within a multi-select). The Activity List client filter delegates to it; the server SQL builder (`calendar-service/.../activity-find-all-filters.ts`) is the API owner and is kept in sync with it.
- `activityMatchesSearchKeyword` / `getActivitySearchableTexts` (in `activity-searchable-text.ts`) define the single keyword field set used by both the list and Reports search.
- `hasActivityFilterCriteria` (in `activity-filter-active.ts`) detects applied criteria for "Clear filters" / summary affordances — purely value-based, so applied **Pitch** / **Look Ahead** criteria count even when their controls are hidden by field scope.

Parity means the **same predicate rules**, not identical row **counts**. Counts can legitimately differ: Reports use report date windows, omitted-activity settings, and section pins, while the list applies tab scoping (ministry, favourites) and archive overlays.

The Reports filter row now exposes the same dimensions as the Activity List, including **Look Ahead** and **Pitch** (Pitch is shown only to users with pitch field scope, identical to the list).

## Implemented approach

### Client-side filtering

Keyword search is implemented as **client-side filtering** over the cached activity list:

- The list is already fetched for the current filter set (tab, include completed, include deleted) via TanStack Query. The query key does **not** include the search term, date, status, category, or pitch.
- When the user types a search term, the client filters the in-memory `ActivityTableRow[]` before sorting and pagination. No new network request is made for search.
- When the cache is invalidated or refetched (e.g. refetch interval or after a mutation), the same search term is reapplied to the new data.

### Persistence (URL and sessionStorage, debounced for search)

Search is synced to the URL so links are shareable, but the URL is updated only **after** the user stops typing (debounced, 400ms). That keeps the search input from losing focus.

- **Filtering**: The table filters on **every keystroke** (no debounce). The user sees results update immediately; only the **URL write** is debounced.
- **sessionStorage**: Written on every preference change (including each keystroke) so the current search is never lost.
- **URL (`search` param)**: When only the search keyword changes, the hook schedules a debounced sync. After 400ms with no further search changes, it calls `setSearchParams`. When sort/filter/pageSize change, the URL syncs immediately.
- **Read**: On load, if the URL has any known params (including `search`), preferences are parsed from the URL; otherwise from sessionStorage.
- **Breadcrumb**: The "Activities list" link includes the current search (from sessionStorage) once it has been synced.

### Fields searched

The keyword field set is defined once in `packages/shared/src/filters/activity-searchable-text.ts` (`getActivitySearchableTexts`) and used by both the list and Reports. The filter matches the trimmed keyword (case-insensitive) against:

- `title`, `displayId`, `summary` (plain text), `executiveSummary` (plain text)
- `activityCategories` (joined), `tags[].text` (joined)
- `lookAheadStatus`, `lookAheadSection`
- `venue`, `leadOrg`, `leadMinistry`, `leadMinistryAbbreviation`
- `commsLeadName`, `eventPlanners` (joined)
- `activityStatus`
- `activityRepresentatives` (joined)

The list filter is implemented in [calendar-ui/src/lib/activity-query-utils.ts](src/lib/activity-query-utils.ts) as `filterActivityRowsByKeyword`, which maps each row to the shared searchable input and delegates to `activityMatchesSearchKeyword`. Reports preview uses [calendar-ui/src/lib/report-search-filter.ts](src/lib/report-search-filter.ts) over the cached `/reports/data` payload (same shared matcher). Export still passes `search` to the server (`calendar-service/.../report-activity-search.ts`) so PDF/CSV/XLSX match the preview. `executiveSummary` is searched on the list as well (it requires the field on `ActivityTableRow`).

### Behavior details

- **Page index**: When the user changes the search term, the table resets to the first page.
- **Empty search**: If the term is empty or only whitespace, all rows are shown (no filtering).
- **No matches**: When there are activities from the server but none match the keyword, the table shows the message "No activities match your search" with the same toolbar (search input and sort/filters) so the user can adjust or clear the search.

### Key files

| File                                                                                     | Purpose                                                                                                                                                    |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [useActivityTablePreferences.ts](src/hooks/useActivityTablePreferences.ts)               | Adds `searchKeyword` to preferences; debounces URL sync (400ms) when only search changes so the field keeps focus; sessionStorage written on every change. |
| [activity-query-utils.ts](src/lib/activity-query-utils.ts)                               | `filterActivityRowsByKeyword(rows, keyword)` used to filter table rows.                                                                                    |
| [ActivityTable.tsx](src/components/activity/ActivityTable/ActivityTable.tsx)             | Applies filter to `data` -> `filteredData`, then sort -> `sortedData`; passes search props to layout; empty-search state.                                  |
| [ActivityTableLayout.tsx](src/components/activity/ActivityTable/ActivityTableLayout.tsx) | Optional search input in toolbar when `searchKeyword` and `onSearchKeywordChange` are provided.                                                            |

---

## Long-term suggestions

### Server-side pagination

When "include completed" and/or "include deleted" is on, the list can grow to 10k+ activities. Loading the full list in one response may become slow and memory-heavy. Consider:

- Adding `page` and `limit` (or cursor) query params to the activities API.
- Using them in the TanStack Query key so each page is cached separately.
- Optionally disabling or lengthening the 15s refetch interval when the full list is large.

### Server-side search

If the list is paginated, client-side search is no longer possible (the client only has the current page). Then:

- Add a `search` (or `keyword`) query param to the activities API and filter on the server.
- Include the search term in the query key (e.g. debounced) so results are cached per term.
- For large tables, consider PostgreSQL trigram indexes (`pg_trgm`) so `ILIKE '%term%'` can use an index.

### Summary

| Scenario                                                   | Current behavior                                                           | Possible evolution                                                                          |
| ---------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Default list (include completed/deleted off, ~1–1.5k rows) | Full list fetched (archive + context only); all other filters client-side. | No change needed.                                                                           |
| Include completed/deleted on (~10k rows max)               | Full list fetched once; client-side date, status, category, pitch, search. | Add server-side pagination (and then server-side search) only if needed for responsiveness. |
