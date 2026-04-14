# Reports Row Layout - Visual Reference

## 4-Column Structure

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Date & Time          │ Ministry               │ Activity                  │ Details │
├──────────────────────────────────────────────────────────────────────────────┤
│                      │                        │                           │         │
│ Jan 15, 2026         │ Health Services        │ [ID-001] CONFIDENTIAL     │ Lead:   │
│ 10:30 am             │ (HSS)                  │                           │ John    │
│                      │                        │ Joint Announcement of     │ Smith   │
│ Premier: Yes         │ Strategic Policy       │ New Healthcare Initiative │         │
│                      │                        │                           │ Status: │
│ [Premier] [HQ]       │                        │ [Healthcare] [Policy]     │ Active  │
│                      │                        │                           │         │
│                      │                        │                           │ LA:     │
│                      │                        │                           │ NEW     │
│                      │                        │                           │         │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Column Details

### Column 1: Date & Time (1/6 width)

**What it shows:**

- **Date**: Exact date in "Jan 15, 2026" format
- **Time**: Time in 12-hour format "10:30 am"
- **Premier Requested**: Badge if activity involves Premier "Premier: Yes"
- **Tags**: Comma-separated or badge group of tags/keywords

**Why this order:**

- Date/time at top draws visual focus
- Premier indicator is critical for senior staff
- Tags help with quick filtering and scanning

**Example:**

```
Jan 15, 2026
10:30 am

Premier: Yes

[HQ] [Strategic]
```

### Column 2: Ministry Info (1/6 width)

**What it shows:**

- **Lead Ministry**: Primary ministry responsible for activity
  - Abbreviation first (e.g., "HSS" for Health Services)
  - Full name as fallback
- **Lead Organization**: Sub-organization or department
- **Lead Org**: Supporting organization if applicable

**Why separate from content:**

- Ministry is critical organizational metadata
- Narrow column for quick scanning
- Different from activity description

**Example:**

```
Health Services
(HSS)

Strategic Policy
```

### Column 3: Main Activity Content (1/2 width - widest)

**What it shows:**

- **Activity ID**: Unique identifier (copyable)
- **Confidential/Issue Indicators**: Red badges if applicable
- **Title**: Main activity heading (bold, prominent)
- **Executive Summary**: 2-line preview of description
- **Categories**: Category badges in primary color

**Why widest column:**

- Content is the core information
- Summary needs space for context
- Multiple badges may wrap

**Example:**

```
[ID-001] CONFIDENTIAL

Joint Announcement of New
Healthcare Initiative

Detailed description of the healthcare
initiative and implementation timeline...

[Healthcare] [Policy] [Active]
```

### Column 4: Additional Info (1/6 width)

**What it shows:**

- **Comms Lead**: Primary communications contact
- **Activity Status**: Current workflow status
- **Look Ahead Status**: NEW or CHANGED indicator
- **Date Status**: Confirmation/changed status
- **Other Metadata**: Any report-specific fields

**Why separate column:**

- Administrative/operational details
- Secondary but important information
- Doesn't distract from main content

**Example:**

```
Comms Lead:
John Smith

Status:
Active

LA Status:
NEW

Date Status:
Confirmed
```

## Data Mapping Examples

### Reports Example 1: Look Ahead Report

```reactjs
<ReportRow activity={{
  id: 101,
  displayId: "ID-001",
  title: "Cabinet Meeting",
  startDate: "2026-01-15",
  startTime: "14:30",
  leadMinistryAbbreviation: "PCO",
  leadMinistry: "Privy Council Office",
  executiveSummary: "Weekly cabinet update and policy review",
  category: ["Government", "Admin"],
  activityStatus: "Confirmed",
  lookAheadStatus: "new",
  premierRequested: "Yes",
  tags: [{id: 1, text: "Cabinet"}, {id: 2, text: "Strategic"}],
  commsContacts: [{name: "Alice Lee", isLead: true}]
}} />
```

**Renders as:**

```
│ Jan 15, 2026    │ Privy Council    │ [ID-001]           │ Lead:     │
│ 2:30 pm         │ (PCO)            │ Cabinet Meeting    │ Alice Lee │
│                 │                  │ Weekly cabinet     │           │
│ Premier: Yes    │ Strategic        │ update...          │ Status:   │
│                 │ Planning         │                    │ Confirmed │
│ [Cabinet]       │                  │ [Government]       │           │
│ [Strategic]     │                  │ [Admin]            │ LA: NEW   │
```

### Reports Example 2: Activity Status Report

```reactjs
<ReportRow activity={{
  id: 202,
  displayId: "ID-002",
  title: "Public Engagement Tour",
  startDate: "2026-02-20",
  startTime: "09:00",
  leadMinistryAbbreviation: "COM",
  leadMinistry: "Communications",
  summary: "Regional tour to engage stakeholders on policy changes",
  category: ["Public Engagement"],
  activityStatus: "In Progress",
  lookAheadStatus: "none",
  premierRequested: "No",
  tags: [{id: 3, text: "Public"}],
  commsContacts: [{name: "Bob Wilson", isLead: true}]
}} />
```

**Renders as:**

```
│ Feb 20, 2026    │ Communications  │ [ID-002]           │ Lead:     │
│ 9:00 am         │ (COM)           │ Public Engagement  │ Bob       │
│                 │                 │ Regional tour to   │ Wilson    │
│                 │                 │ engage stakeholders│           │
│                 │                 │                    │ Status:   │
│ [Public]        │                 │ [Public            │ In        │
│                 │                 │ Engagement]        │ Progress  │
```

## Styling Details

### Colors & Variants

| **Type**  | **Badge Variant**                       | **Use Case**        | **Color**      |
| --------- | --------------------------------------- | ------------------- | -------------- |
| Status    | `variant="secondary"`                   | Activity status     | Gray           |
| Category  | `variant="primary"`                     | Activity categories | Blue/Brand     |
| Tags      | `variant="outline"`                     | Keywords/tags       | Gray outline   |
| Premier   | `variant="warning"`                     | Premier requested   | Orange/warning |
| LA Status | `variant="info"` or `variant="warning"` | NEW or CHANGED      | Blue or Orange |

### Spacing

- Row padding: `py-3 px-4` (vertical-3, horizontal-4)
- Content spacing: `space-y-2` between elements
- Tag spacing: `gap-1.5` between badge groups
- Hover background: `hover:bg-muted/30`

### Typography

| Element     | Class                                  | Note                  |
| ----------- | -------------------------------------- | --------------------- |
| Date        | `text-xs font-medium text-slate-600`   | Secondary label color |
| Time        | `text-sm font-medium text-slate-900`   | Prominent, readable   |
| Title       | `text-sm font-semibold text-slate-900` | Bold heading          |
| Summary     | `text-xs text-slate-600 line-clamp-2`  | Gray text, 2-line max |
| Meta Labels | `text-xs font-medium text-slate-600`   | Consistent with date  |

## Responsive Behavior

### On Desktop (Full Width)

- All 4 columns visible
- Proper proportion: 16% | 16% | 52% | 16%
- Optimal readability

### On Tablet (Medium Width)

- May need horizontal scroll
- Column widths maintained proportionally
- Content still readable

### Future: Mobile Support

- May stack columns or hide some info
- Implement column visibility toggle
- Swipe to see additional columns

## Implementation Notes

### Component Structure

```tsx
<ReportTable activities={[...]} />
  └─ <thead><tr><th>... (4 headers)</th></tr></thead>
  └─ <tbody>
       {activities.map(activity => (
         <ReportRow activity={activity} />
       ))}
     </tbody>
```

### Props

**ReportTable**:

```tsx
interface ReportTableProps {
  activities: ActivityResponse[];
  className?: string;
}
```

**ReportRow**:

```tsx
interface ReportRowProps {
  activity: ActivityResponse;
  className?: string;
}
```

### Field Availability Handling

ReportRow gracefully handles missing fields:

- `activity.startDate` → defaults to "–"
- `activity.leadMinistry` → uses abbreviation or full name
- `activity.commsContacts` → finds lead or shows "–"
- `activity.tags.length === 0` → entire section hidden
- `activity.executiveSummary` → falls back to `summary`

## Configuration Notes

**No configuration needed!**

The ReportRow component automatically:

1. Discovers all activity fields from the ActivityResponse
2. Conditionally renders based on field presence
3. Formats all values appropriately
4. Resizes columns proportionally

Different reports show different data because:

- Backend returns different fields based on report config
- ReportRow displays all available fields
- Missing fields are handled gracefully

This is the key to extensibility: **Configuration at backend, smart rendering at frontend.**
