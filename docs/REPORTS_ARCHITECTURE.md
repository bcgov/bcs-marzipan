# Reports Page Refactoring - Architecture Overview

## Component Hierarchy

### Before Refactoring

```
ReportsPage
├── Section tabs
├── Filters
└── TabsContent
    └── ReportSection
        └── DateGroupedTable
            ├── Date header row
            ├── Activity row
            ├── Date header row
            ├── Activity row
            └── ...
```

**Problem**: Date headers create unnecessary grouping; activity information scattered across columns.

### After Refactoring

```
ReportsPage
├── Section tabs
├── Filters
└── TabsContent
    └── ReportSection
        ├── ReportTable
        │   └── ReportRow (x20 per page)
        │       ├── Column 1: Date/Meta
        │       ├── Column 2: Ministry
        │       ├── Column 3: Content
        │       └── Column 4: Details
        └── Pagination controls
```

**Improvement**: Flat structure; rich rows with all metadata visible.

## Component Responsibilities

### ReportsPage.tsx

- **Responsibility**: Page-level orchestration
- **Tasks**:
  - Fetch reports list
  - Manage active report tab
  - Handle filters (date range)
  - Manage export button state
  - Route to section tabs
- **Changes**: None - still uses ReportSection

### ReportSection.tsx

- **Responsibility**: Display single report section with pagination
- **Tasks**:
  - Paginate activities (20 per page)
  - Provide prev/next controls
  - Pass activities to table
- **Changes**: Updated to use ReportTable instead of DateGroupedTable

### ReportTable.tsx (NEW)

- **Responsibility**: Render flat table container
- **Tasks**:
  - Create table header with 4 columns
  - Render ReportRow for each activity
  - Show empty state if no activities
  - Apply consistent styling
- **Props**: `activities: ActivityResponse[]`
- **Lines of Code**: ~50

### ReportRow.tsx (NEW)

- **Responsibility**: Render single activity as rich 4-column row
- **Tasks**:
  - Format date/time
  - Extract and display ministry info
  - Render activity content with hierarchy
  - Show activity status and metadata
  - Handle missing fields gracefully
- **Props**: `activity: ActivityResponse`
- **Lines of Code**: ~168
- **Reused Components**:
  - `Badge` (for status, categories, tags)
  - `CopyableText` (for activity ID)
  - `Tooltip` (for help text)

## Data Flow

```
User selects report tab
    ↓
ReportsPage manages activeReport state
    ↓
useQuery fetches report data
    GET /reports/data/{reportName}
    ↓
Backend:
  1. Load report config from DB
  2. Fetch activities with filters
  3. Apply report-specific filters per section
  ↓
Frontend receives ReportDataResponse:
{
  report: ReportResponse,
  sections: [{
    id: "section-1",
    name: "Events",
    activities: [ActivityResponse, ...]
  }]
}
    ↓
ReportsPage renders section tabs
    ↓
Each section's TabsContent renders ReportSection
    ↓
ReportSection paginates and renders ReportTable
    ↓
ReportTable maps activities to ReportRow components
    ↓
User sees 4-column rich row layout
```

## Styling Architecture

### Reused from Activity List View

**Colors:**

```tsx
// Text colors
text - slate - 900; // Headings
text - slate - 700; // Body text
text - slate - 600; // Secondary text
text - muted - foreground; // Disabled/hint text

// Background
bg - muted / 30; // Hover state
bg - muted / 50; // Section headers
```

**Badge Variants:**

```tsx
variant = 'primary'; // Categories (blue)
variant = 'secondary'; // Status (gray)
variant = 'outline'; // Tags (gray outline)
variant = 'warning'; // Premier requested (orange)
variant = 'info'; // LA Status NEW (blue)
```

**Typography:**

```tsx
text-sm font-semibold        // Titles
text-xs font-medium          // Labels
text-xs text-slate-600       // Secondary text
text-sm leading-relaxed      // Body text
```

**Spacing:**

```tsx
py-3 px-4       // Cell padding
space-y-2       // Content spacing
gap-1.5         // Badge spacing
```

## Import Organization

```tsx
// Icon library
import { /* lucide-react icons */ }

// React Query
import { useQuery } from '@tanstack/react-query'

// Shared types & schemas
import type { ActivityResponse } from '@corpcal/shared/api/types'

// Layout
import { PageHeader } from '@/components/layout'

// UI Components (reused from existing)
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CopyableText } from '@/components/ui/copyable-text'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// Utilities
import { formatExactDate, formatTime12h } from '@/lib/datetime-utils'
import { cn } from '@/lib/utils'

// API & types
import { fetchReportData } from '@/api/reportsApi'

// New components
import { ReportTable } from './ReportTable'
import { ReportRow } from './ReportRow'
```

## Error Handling

### Field Availability

ReportRow handles missing/undefined fields:

```tsx
const formattedDate = startDate ? formatExactDate(startDate) : '–';
const commsLeadName = commsLead?.name ?? '–';
const isPremierRequested =
  activity.premierRequested && activity.premierRequested.toLowerCase() !== 'no';
```

### Conditional Rendering

```tsx
{
  activity.tags.length > 0 && <div>/* render tags */</div>;
}

{
  activity.leadOrg && <div>/* render org */</div>;
}

{
  activity.lookAheadStatus && activity.lookAheadStatus !== 'none' && (
    <div>/* render LA status */</div>
  );
}
```

### Empty State

ReportTable shows message when no activities:

```tsx
{
  activities.length === 0 && (
    <div className="text-muted-foreground px-4 py-8 text-center">
      No activities to display.
    </div>
  );
}
```

## Performance Considerations

### Pagination

- **Page Size**: 20 items per page
- **Rendering**: Only 20 ReportRow components at a time
- **Memory**: Efficient for large datasets

### Query Caching

- React Query caches report data
- Cache keys: `['report-data', activeReport, startDate, endDate]`
- Automatic background refetch available

### Rendering Optimization

- `useMemo` used in ReportSection for pagination calculations
- ReportRow is lightweight functional component
- No unnecesary re-renders due to proper key usage

## Accessibility

### Semantic HTML

```tsx
<table>
  <thead>
    <tr>
      <th>...</th>
    </tr>
  </thead>
  <tbody>
    {activities.map((a) => (
      <tr>
        <td>...</td>
      </tr>
    ))}
  </tbody>
</table>
```

### Copyable Text

- Proper role and aria labels
- Keyboard accessible
- Screen reader compatible

### Badges

- Clear visual distinction
- Color + text (not color alone)
- Proper contrast ratios

### Labels

- Form labels properly associated with inputs
- Help text available via tooltips

## Testing Strategy

### Unit Tests (Potential)

```typescript
// ReportRow.test.tsx
describe('ReportRow', () => {
  it('formats date correctly');
  it('displays ministry abbreviation when available');
  it('shows premier requested indicator');
  it('handles missing fields gracefully');
  it('renders tags as badges');
  it('makes activity ID copyable');
});

// ReportTable.test.tsx
describe('ReportTable', () => {
  it('renders all activities as rows');
  it('shows empty state when no activities');
  it('applies correct styling');
});
```

### Integration Tests (Potential)

```typescript
// Reports.integration.test.tsx
describe('Reports Page', () => {
  it('loads report data and displays rows');
  it('pagination works correctly');
  it('filters update data');
  it('export buttons work');
});
```

### Manual Testing (Done)

- ✅ All fields display correctly
- ✅ Missing fields handled gracefully
- ✅ Badges render properly
- ✅ Copyable text works
- ✅ Hover states work
- ✅ Empty state displays
- ✅ No console errors
- ✅ TypeScript compilation passes

## Future Enhancements

### Short Term

- [ ] Column sorting (click header to sort)
- [ ] Row click navigation to detail view
- [ ] Keyboard shortcuts (J/K for next/prev row)

### Medium Term

- [ ] Column visibility toggle
- [ ] Inline quick edit for status
- [ ] Bulk row selection
- [ ] Inline activity preview on hover

### Long Term

- [ ] Custom report templates
- [ ] Save filter combinations
- [ ] Scheduled report emails
- [ ] Report analytics/usage stats
- [ ] Mobile responsive stack layout

## Deployment Checklist

- ✅ Code review ready
- ✅ TypeScript compilation passes
- ✅ No console errors
- ✅ No breaking changes
- ✅ Backward compatible (DateGroupedTable retained)
- ✅ Documentation complete
- ✅ Build tested
- ✅ Ready for QA testing

## Rollback Plan

If needed to rollback:

1. Revert ReportSection.tsx to use DateGroupedTable
2. Remove ReportRow.tsx and ReportTable.tsx
3. Requires zero changes to backend
4. No database migrations needed
5. Can be done in < 5 minutes
