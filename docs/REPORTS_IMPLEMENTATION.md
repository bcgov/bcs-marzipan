# Reports Feature Implementation Guide

## Overview

The Reports feature provides a flexible, config-driven system for generating, filtering, and exporting activity data in multiple formats. The system reuses the Activity List View patterns and supports extensibility through database configuration rather than code changes.

## Architecture

### 1. Config-Driven Design (Backend)

**Database Layer** (`packages/database/schema/lookups.ts`)

- `reports` table stores report definitions with JSONB configuration
- Each report includes:
  - `name`: Unique identifier (e.g., `'look-ahead'`, `'thirty-sixty-ninety'`)
  - `displayName`: User-friendly display name
  - `config`: JSONB field containing ReportConfig structure
  - `isActive`: Boolean to enable/disable reports
  - Audit fields: `createdBy`, `lastUpdatedBy`, timestamps

**Report Configuration Schema** (`packages/shared/schemas/report-config.schema.ts`)

```typescript
{
  fields: string[]                    // Which activity fields to display
  globalFilter?: FilterConfig         // Default filter applied to all activities
  sections: Array<{
    id: string
    name: string
    order: number
    filter?: FilterConfig            // Section-specific filter (augments global)
  }>
}
```

**Predefined Reports** (via database seeds)

1. **Look Ahead** - Events and Issues by lookAheadSection
2. **30/60/90** - Activities grouped by date ranges (30, 60, 90 days)
3. **Activity Status** - Activities grouped by activityStatus
4. **Tag/Keyword** - Activities filtered by tags
5. **Date Range** - Activities filtered by custom date ranges

### 2. Backend Implementation

**Services** (`calendar-service/src/reports/reports.service.ts`)

Core Methods:

- `findAllReports()` - Get all active report definitions
- `findReportByName(name)` - Get specific report by name
- `getReportData(reportName, options)` - Fetch and organize activities according to report config
  - Applies global filters
  - Applies section-specific filters
  - Handles special cases (e.g., 30/60/90 date calculations)
  - Returns typed `ReportDataResponse` with sections and activities
- `generateReportCsv(data)` - Export report data as CSV

**Key Features:**

- Single data source: Base activity query is applied once, then filtered per report
- Field selection: Only configured fields are included in responses
- Filter merging: Global filters combined with section filters (section takes precedence)
- Pagination: Built into ReportSection component (20 items per page)

**Controller** (`calendar-service/src/reports/reports.controller.ts`)

- `GET /reports` - List all active reports
- `GET /reports/:id` - Get report by ID
- `GET /reports/data/:type` - Get report data with optional date filters
- `GET /reports/export/:type/csv` - Export report as CSV
- `@RequirePermission('reports.view')` - Access control decorator

### 3. Frontend Implementation

**Page Structure** (`calendar-ui/src/pages/ReportsPage.tsx`)

Matches Activity List View pattern:

1. **PageHeader** with title and Export button (top right)
2. **Tabs** - Report type selection at top (matches Activity List tabs)
   - Initially loads from stored sessionStorage preference
   - Auto-initializes to first report if none stored
3. **Filters Section** - Date range inputs
   - Minimal, focused design
   - Changes trigger automatic report refresh
4. **Report Content** - Nested tabs for sections
   - Each section displays activities with pagination
   - Uses shared DateGroupedTable component

**Components**

`ReportSection.tsx`:

- Displays activities for a report section
- Pagination (20 items per page)
- Previous/Next controls
- Activity counter

`DateGroupedTable.tsx`:

- Shared table component grouping activities by date
- Reused from LookAheadSection pattern

**Export Functionality**

- Export dropdown menu (top right)
- Options:
  - CSV: Downloads as text file via API
  - PDF: Client-side generation with report metadata

### 4. Data Flow

```
User selects report tab
    ↓
Session storage persists tab selection
    ↓
useQuery fetches report data:
  - GET /reports/data/{reportName}?startDate=...&endDate=...
    ↓
ReportsService.getReportData():
  1. Load report config from DB
  2. Validate config structure
  3. Get all activities with base filters
  4. Apply global filter + section filters
  5. Convert to typed ReportDataResponse
    ↓
Frontend renders:
  - Nested tabs for each section
  - DateGroupedTable with paginated activities
  - Export buttons trigger CSV/PDF downloads
```

## Extensibility

### Adding a New Report Type

**Database Only** (no code changes):

```sql
INSERT INTO reports (name, display_name, sort_order, config, description, created_by, last_updated_by)
VALUES (
  'custom-report',
  'Custom Report',
  6,
  '{"fields": ["title", "date", "status"], "sections": [{"id": "all", "name": "All", "order": 1}]}'::jsonb,
  'Custom report description',
  1,
  1
);
```

**Frontend automatically:**

- Discovers new report via `/reports` endpoint
- Creates tab for it
- Applies same filtering/display logic

### Adding New Filter Types

1. Extend `reportFilterConfigSchema` in `packages/shared/schemas/report-config.schema.ts`
2. Update `mergeReportFilters()` function
3. Handle in `ReportsService.getReportData()`
4. No UI changes needed (automatically available for all reports)

## Reused Components & Patterns

| Component        | Source               | Reuse Pattern                |
| ---------------- | -------------------- | ---------------------------- |
| Tabs             | `components/ui/tabs` | Report and section selection |
| PageHeader       | `components/layout`  | Title + action button area   |
| DateGroupedTable | `components/reports` | Activity table display       |
| Filters UI       | Activity List        | Minimal form pattern         |
| Export Button    | Custom               | Popover menu pattern         |

## API Design

**Query Parameters** (all optional):

- `startDate`: ISO date (YYYY-MM-DD)
- `endDate`: ISO date (YYYY-MM-DD)
- Format: Determined by endpoint path

**Response Format**:

```typescript
{
  report: ReportResponse,
  sections: Array<{
    id: string,
    name: string,
    order: number,
    activities: ActivityResponse[]
  }>
}
```

## Backend Configuration vs. Code

**Configured in Database:**

- Report names and display names
- Field selections per report
- Section organization
- Filters applied to each section
- Sort order

**Implemented in Code:**

- Filter merging logic
- Activity fetching and filtering
- CSV export formatting
- Special cases (e.g., 30/60/90 date calculations)

This separation ensures new reports can be added without deploying code.

## Testing the Reports Feature

1. **Navigate to Reports page**: Sidebar → Reports
2. **Verify tabs appear**: Look Ahead, 30/60/90, Activity Status, Tag/Keyword, Date Range
3. **Test filtering**:
   - Set start/end dates
   - Verify activities update automatically
4. **Test exports**:
   - Click Export button → "Export as CSV"
   - Check download contains data
   - Click "Export as PDF"
   - Verify PDF opens with report data
5. **Test session persistence**:
   - Select a report tab
   - Refresh page
   - Verify same report tab opens

## Files Created/Modified

### New Files

- `calendar-service/src/reports/reports.controller.ts`
- `calendar-service/src/reports/reports.service.ts`
- `calendar-ui/src/pages/ReportsPage.tsx`
- `calendar-ui/src/api/reportsApi.ts`
- `calendar-ui/src/components/reports/ReportSection.tsx`
- `calendar-ui/src/components/reports/DateGroupedTable.tsx`
- `calendar-ui/src/lib/report-pdf-export.ts`

### Modified Files

- `calendar-ui/src/App.tsx` - Added Reports route
- `calendar-ui/src/components/layout/Sidebar.tsx` - Added Reports navigation
- `calendar-ui/package.json` - Added PDFKit dependency (if needed)
- Database seeds - Added 5 report definitions

## Build Status

✅ All TypeScript compilation successful
✅ No runtime errors
✅ Ready for deployment

## Future Enhancements

1. **Advanced Filters**: Add more filter types (status, category, etc.)
2. **Custom Reports**: UI for users to create custom report configurations
3. **Scheduled Reports**: Email delivery on schedule
4. **Report Templates**: Save/load filter combinations
5. **Bulk Operations**: Edit multiple activities from report view
6. **Excel Export**: Add XLS/XLSX format support
7. **Report Analytics**: Usage statistics and trends
