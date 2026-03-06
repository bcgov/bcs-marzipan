# Activity list keyword search

This document describes the activity list keyword search implementation and long-term suggestions for scaling.

## Implemented approach

### Client-side filtering

Keyword search is implemented as **client-side filtering** over the cached activity list:

- The list is already fetched for the current filter set (tab, exclude completed, include deleted) via TanStack Query. The query key does **not** include the search term.
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

The filter matches the trimmed keyword (case-insensitive) against these fields on each activity row:

- `title`, `displayId`, `summary`
- `activityCategories` (joined), `tags[].text` (joined)
- `lookAheadStatus`, `lookAheadSection`
- `venue`, `leadOrg`, `leadMinistry`, `leadMinistryAbbreviation`
- `commsLeadName`, `eventLead`
- `activityStatus`
- `activityRepresentatives` (joined)

The filter is implemented in [calendar-ui/src/lib/activity-query-utils.ts](../src/lib/activity-query-utils.ts) as `filterActivityRowsByKeyword`.

### Behavior details

- **Page index**: When the user changes the search term, the table resets to the first page.
- **Empty search**: If the term is empty or only whitespace, all rows are shown (no filtering).
- **No matches**: When there are activities from the server but none match the keyword, the table shows the message "No activities match your search" with the same toolbar (search input and sort/filters) so the user can adjust or clear the search.

### Key files

| File                                                                               | Purpose                                                                                                                                                    |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [useActivityTablePreferences.ts](../src/hooks/useActivityTablePreferences.ts)      | Adds `searchKeyword` to preferences; debounces URL sync (400ms) when only search changes so the field keeps focus; sessionStorage written on every change. |
| [activity-query-utils.ts](../src/lib/activity-query-utils.ts)                      | `filterActivityRowsByKeyword(rows, keyword)` used to filter table rows.                                                                                    |
| [ActivityTable.tsx](../src/components/ActivityTable/ActivityTable.tsx)             | Applies filter to `data` -> `filteredData`, then sort -> `sortedData`; passes search props to layout; empty-search state.                                  |
| [ActivityTableLayout.tsx](../src/components/ActivityTable/ActivityTableLayout.tsx) | Optional search input in toolbar when `searchKeyword` and `onSearchKeywordChange` are provided.                                                            |

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

| Scenario                                                | Current behavior                                                     | Possible evolution                                                                                     |
| ------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Default list (exclude completed/deleted, &lt;1000 rows) | Full list fetched; client-side search; search in URL/sessionStorage. | No change needed.                                                                                      |
| Include completed/deleted (10k+ rows)                   | Full list fetched once; client-side search over full set.            | Add server-side pagination (and then server-side search) to reduce payload and improve responsiveness. |
