# Management tables UX

This document describes the UX patterns used in the **Users** and **Teams** management tables. The **Users** table is the exemplar; follow its structure (tabs, filters, sort, table summary, table, pagination) when adding or changing similar screens.

## Exemplar reference

- **Page:** `src/pages/UserManagement.tsx` – tabs (Users / Teams), modals, drawers.
- **Tab content:** `src/components/users/UsersTabContent.tsx` – filters, summary bar, table, pagination.
- **Filters:** `src/components/users/UserManagementFilters.tsx` – keyword, multi-select filters, sort dropdown.

## Key UX improvements

### 1. Sticky header

The table header stays visible while the body scrolls so column labels remain in view.

```tsx
<thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
```

The scroll container is the **wrapper div** (see below), not the window, so `sticky top-0` is relative to that container.

### 2. Fixed-height scroll container (no layout flicker)

The table lives in a fixed-height wrapper so the header and chrome don’t jump when data loads or changes. Only the tbody content scrolls.

```tsx
const TABLE_SCROLL_HEIGHT = 'min(480px, 60vh)';

<div
  className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white"
  style={{ height: TABLE_SCROLL_HEIGHT }}
>
  <div ref={tableScrollRef} className="min-h-0 flex-1 overflow-auto">
    <table className="w-full min-w-[640px] table-fixed border-collapse" ...>
```

- Outer div: fixed height, `overflow-hidden`, flex column.
- Inner div: `min-h-0 flex-1 overflow-auto` so it takes remaining space and scrolls. Use a ref on this element for scroll control (e.g. scroll-to-top on page change).

### 3. Scroll-to-top on explicit page/size changes

When the user changes page or page size, scroll the table body back to the top so they see the new page from the start.

```tsx
const tableScrollRef = useRef<HTMLDivElement>(null);

<TablePagination
  onPageChange={(p) => {
    setPagination((prev) => ({ ...prev, pageIndex: p - 1 }));
    tableScrollRef.current?.scrollTo({ top: 0 });
  }}
  onPageSizeChange={(ps) => {
    setPagination((prev) => ({ ...prev, pageSize: ps, pageIndex: 0 }));
    tableScrollRef.current?.scrollTo({ top: 0 });
  }}
  ...
/>
```

### 4. Skeleton rows while loading

Show a fixed number of skeleton rows in the tbody during the initial fetch so the table doesn’t pop from empty to full. Match column count and approximate cell widths for a stable layout.

```tsx
const SKELETON_ROW_COUNT = 8;

{isLoading ? (
  Array.from({ length: SKELETON_ROW_COUNT }, (_, i) => (
    <tr key={i} className="border-b border-slate-100" aria-hidden>
      <td className="px-4 py-3"><Skeleton className="h-5 w-28" /></td>
      ...
    </tr>
  ))
) : (
  // data rows or empty state
)}
```

Use `aria-hidden` on skeleton rows so they’re ignored by assistive tech.

### 5. Percentage column widths (no width jump)

Use `table-fixed` plus a `<colgroup>` with percentage widths so column widths don’t change when content or filters change.

```tsx
<table
  className="w-full min-w-[640px] table-fixed border-collapse"
  role="grid"
  aria-colcount={TABLE_COLUMN_COUNT}
>
  <colgroup>
    <col style={{ width: '16%' }} />
    <col style={{ width: '20%' }} />
    ...
  </colgroup>
  <thead>...</thead>
  <tbody>...</tbody>
</table>
```

Set `TABLE_COLUMN_COUNT` to the number of columns and use it for empty-state `colSpan`.

### 6. Structure order (exemplar: Users tab)

1. **Filters** – e.g. `UserManagementFilters` / `TeamManagementFilters`: keyword, dropdowns, sort.
2. **TableSummaryBar** – “Showing N users” and optional checkboxes (e.g. “Show inactive”).
3. **Table container** – fixed height, scroll div, table with sticky header and percentage cols.
4. **TablePagination** – only when there is at least one item; wire `onPageChange` / `onPageSizeChange` and scroll ref as above.

### 7. Sort

- Use `SortIndicator` in sortable `<th>` cells; pass `sortKey`, `sortDirection`, and column id.
- Drive sort state from the parent (e.g. `UsersTabContent`) and pass a single `onSortChange(key, direction)` to the filters component, which can use `SortDropdown` or equivalent.

### 8. Accessibility

- `role="grid"` and `aria-colcount` on the table.
- Pagination: `aria-label` (e.g. “Users table pagination”), `aria-current="page"` on the current page button.
- Skeleton rows: `aria-hidden`.
- Empty state: one cell with `colSpan={TABLE_COLUMN_COUNT}` and clear message.

## Related components

| Component         | Purpose                                       |
| ----------------- | --------------------------------------------- |
| `TablePagination` | Page nav, page-size selector, scroll callback |
| `TableSummaryBar` | “Showing N items” + optional boolean filters  |
| `SortIndicator`   | Arrow in header for active sort column        |
| `SortDropdown`    | Used inside filter bars for sort selection    |
