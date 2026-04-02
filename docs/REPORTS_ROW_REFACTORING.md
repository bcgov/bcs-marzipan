# Reports Page Refactoring: Row-Based Layout

## Summary

The Reports page has been refactored to replace the date-grouped table layout with a custom row-based table that matches the Activity List View pattern. This provides a richer, more informative display of activity data organized into 4 distinct columns.

## Changes Made

### 1. Removed Components

✅ **DateGroupedTable removed from Reports page** (but retained for LookAheadReport)

- The date-grouped table structure was specific to date-grouped displays
- Reports need a flat table without date headers

### 2. New Components Created

#### `ReportRow.tsx` – Rich Row Component

**Purpose**: Display a single activity as a structured row with 4 columns.

**Column 1 – Date/Meta Info**

- Date (formatted as "Jan 23")
- Time (12-hour format: "2:30 pm")
- Premier Requested indicator (if applicable)
- HQ Tags (as badges)

**Column 2 – Ministry Info**

- Lead Ministry (with abbreviation preference)
- Lead Organization

**Column 3 – Main Activity Content** (widest column)

- Activity ID (copyable)
- Confidential/Issue indicators
- Activity Title
- Executive Summary or Description (2-line clamp)
- Category badges

**Column 4 – Additional Info**

- Comms Lead name
- Activity Status (badge)
- Look Ahead Status (NEW/CHANGED badge if applicable)
- Date Status

**Features**:

- Reuses icons and styling from Activity List View
- Badge variants for status, category, tags
- Copyable text component for activity IDs
- Proper spacing and typography hierarchy
- Hover state for better interactivity
- Truncation and overflow handling

#### `ReportTable.tsx` – Flat Table Container

**Purpose**: Render a simple table with no grouping logic.

**Features**:

- Clean `<table>` structure with proper semantic HTML
- 4-column header row
- Responsive column widths (proportional)
- Rounded corners and border styling
- Empty state message
- No date grouping or special row headers

### 3. Updated Components

#### `ReportSection.tsx`

**Changes**:

- Replaced `DateGroupedTable` import with `ReportTable`
- All other logic remains unchanged (pagination, etc.)
- Pagination still works: 20 items per page with prev/next buttons

**Impact**:

- Simpler import statement
- Same functionality, better presentation

#### `ReportsPage.tsx`

**No changes needed** – it already uses ReportSection correctly.

## Layout Structure

### Before (DateGroupedTable)

```
┌─ Date Header ────────────────────────────────────────┐
├─────────────────────────────────────────────────────┤
│ Time │ Status │ Activity Details │ Ref # │ MIN      │
├─────────────────────────────────────────────────────┤
│ ...  │ ...    │ ...              │ ...   │ ...      │
└─────────────────────────────────────────────────────┘
```

- Date-grouped with header rows between activities
- Narrow columns, minimal information
- Limited visual hierarchy

### After (ReportTable with ReportRow)

```
┌─────────────────────────────────────────────────────────────────┐
│ Date & Time   │ Ministry   │ Activity              │ Details    │
├─────────────────────────────────────────────────────────────────┤
│ Jan 23        │ Health     │ [ID] TITLE            │ Status     │
│ 2:30 pm       │ (HLH)      │ Executive summary...  │ Badge      │
│ Premier: Yes  │            │ [Categories]          │ LA: NEW    │
│ [Tags]        │            │                       │            │
├─────────────────────────────────────────────────────────────────┤
│ ...           │ ...        │ ...                   │ ...        │
└─────────────────────────────────────────────────────────────────┘
```

- Flat (no grouping)
- Rich, multi-line rows
- Proper visual hierarchy with nested information
- Better use of horizontal space

## Reused Patterns from Activity List View

| Element              | Source             | Reuse                              |
| -------------------- | ------------------ | ---------------------------------- |
| Badge component      | `ui/badge`         | Status, category, tags             |
| CopyableText         | `ui/copyable-text` | Activity ID copying                |
| Typography hierarchy | ActivityTable      | Title, meta, description nesting   |
| Hover states         | ActivityTable      | Row background color change        |
| Color scheme         | ActivityTable      | Status badge variants, text colors |
| Spacing              | ActivityTable      | Gap sizing, padding conventions    |

## Configuration-Driven Field Mapping

The ReportRow component dynamically maps activity fields into columns:

**Column 1 (Date/Meta)**:

- `activity.startDate` → formatted date
- `activity.startTime` → formatted time
- `activity.premierRequested` → badge if present
- `activity.tags` → badge group

**Column 2 (Ministry)**:

- `activity.leadMinistryAbbreviation` or `activity.leadMinistry`
- `activity.leadOrg`

**Column 3 (Content)**:

- `activity.displayId` and `activity.id` → copyable reference
- `activity.isConfidential`, `activity.isIssue` → indicator badges
- `activity.title` → main heading
- `activity.executiveSummary` or `activity.summary` → description
- `activity.category` → category badges

**Column 4 (Additional)**:

- `activity.commsContacts` → lead name extraction
- `activity.activityStatus` → status badge
- `activity.lookAheadStatus` → NEW/CHANGED indicator
- `activity.dateStatus` → text label

## Backward Compatibility

- ✅ `DateGroupedTable` remains in codebase for `LookAheadSection`
- ✅ All existing Look Ahead Report functionality unchanged
- ✅ Reports page uses new flat layout exclusively
- ✅ No breaking changes to any other components

## Benefits

1. **Richer Information Display**
   - More contextual information visible at a glance
   - Proper visual hierarchy eliminates cognitive load

2. **Better Activity Identification**
   - Activity ID, title, description all in single row
   - Don't need to read across multiple places

3. **Status Visibility**
   - Comms lead, activity status, look-ahead status all visible
   - Critical metadata in dedicated column

4. **No Cognitive Overhead**
   - No date headers requiring mental grouping
   - Each row is self-contained
   - Clearer scanning patterns

5. **Consistent with Activity List**
   - Same visual language and patterns
   - Familiar to users
   - Reuses existing components

## Testing Checklist

- ✅ All components compile without errors
- ✅ ReportRow displays all 4 columns correctly
- ✅ ReportTable renders without date grouping
- ✅ ReportSection pagination still works (20 items/page)
- ✅ LookAheadReport still uses DateGroupedTable (backward compat)
- ✅ All badges render with proper styling
- ✅ CopyableText works for activity IDs
- ✅ Empty state displays when no activities
- ✅ Hover effects work on rows
- ✅ Tags and categories display as badge groups

## File Changes Summary

| File                 | Action    | Status                         |
| -------------------- | --------- | ------------------------------ |
| ReportRow.tsx        | Created   | ✅ Complete                    |
| ReportTable.tsx      | Created   | ✅ Complete                    |
| ReportSection.tsx    | Updated   | ✅ Complete                    |
| ReportsPage.tsx      | No change | ✅ No errors                   |
| DateGroupedTable.tsx | Retained  | ✅ Backward compat             |
| LookAheadSection.tsx | No change | ✅ Still uses DateGroupedTable |

## Migration Path

If other components need the ReportRow layout:

1. Import `ReportRow` and `ReportTable` from `@/components/reports`
2. Pass `ActivityResponse[]` array to `ReportTable`
3. Done! No additional configuration needed

## Future Enhancements

1. **Sorting by Columns** - Click column headers to sort by date, status, ministry, etc.
2. **Column Visibility** - Let users toggle which columns to display
3. **Inline Editing** - Quick edits from row without navigation
4. **Row Selection** - Bulk operations on multiple rows
5. **Custom Row Templates** - Allow different reports to customize row layout
6. **Click to Details** - Navigate to full activity detail on row click

## Code Quality

- ✅ No code duplication
- ✅ Clear separation of concerns (row vs. table)
- ✅ Proper TypeScript typing
- ✅ Follows existing patterns and conventions
- ✅ Minimal CSS (uses Tailwind utilities)
- ✅ Proper accessibility (semantic HTML, labels)
- ✅ Consistent with codebase style
