# Activity Table – data sources and display formatting

This document audits where each table value comes from (API/backend) and any extra formatting applied in the UI. All lookup-backed values use the lookup **displayName** (or equivalent display field) from the backend; none use the internal **name** field for display.

## Backend (activity-data-fetcher)

| Field / source               | Backend value used                                         | Table column / usage               |
| ---------------------------- | ---------------------------------------------------------- | ---------------------------------- |
| Categories                   | `categories.displayName`                                   | Overview – category badges         |
| Tags                         | `tags.displayName` (fallback `tags.name`)                  | Summary – tag badges               |
| Activity status              | `activity_statuses.displayName`                            | Status – status badge              |
| Date status                  | `date_statuses.displayName`                                | Scheduling – date status badge     |
| Time status                  | `time_statuses.displayName`                                | Scheduling – time status badge     |
| Premier requested            | `premier_requested.displayName`                            | Scheduling – premier badge         |
| Pitch required status        | `pitch_required_statuses.displayName`                      | (Overview – pitch label when used) |
| Translations required status | `translation_required_statuses.displayName`                | Materials – when no language list  |
| Translations required (list) | `translated_languages.shortcode` (fallback `displayName`)  | Materials – language list          |
| Comms materials              | `comms_materials.displayName`                              | Materials – materials list         |
| Lead ministry                | `ministries.displayName`                                   | Leads – lead ministry              |
| Lead org                     | From lead org lookup / name                                | Leads – lead org                   |
| Event lead                   | From user lookup                                           | Leads – event lead                 |
| Representatives attending    | `activity_representatives.representative_name` (free text) | Scheduling – rep badges            |
| Comms contacts               | User names (for lead)                                      | Leads – comms lead name            |
| Venue                        | Joined venue_addresses (name, street, city, etc.)          | Scheduling – formatted address     |
| Look ahead status / section  | DB enum values (not from lookup table)                     | Summary – look ahead badge         |

## Values not from lookups

- **Identity**: `id`, `displayId` – from activities table.
- **Overview**: `title`, `pitchDate`, `isConfidential`, `isIssue` – from activities or simple lookups.
- **Summary**: `summary` – from activities; tags and look ahead as above.
- **Scheduling**: `startDate`, `endDate`, `startTime`, `endTime`, `isAllDay` – from activities; venue is joined and formatted.
- **Leads**: `commsContactsCount` – derived; `eventLead` from user lookup.
- **Status column**: `lastUpdatedDateTime`, `lastUpdatedBy`, `createdDateTime` – from activities / audit.

## UI formatting on top of API values

| Element                    | Source value                             | Additional formatting                                                                              |
| -------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Category badges            | Category displayName                     | Raw `cat` (no transform; displayName is already correct, e.g. FYI)                                 |
| Pitch label                | Pitch required displayName (when used)   | `toSentenceCase(pitchLabel)`                                                                       |
| Look ahead badge           | Look ahead status + section (enum)       | `getLookAheadStatusLabel` / `getLookAheadSectionLabel` + `"LA …"` template                         |
| Date status badge          | Date status displayName                  | `toSentenceCase(row.dateStatus)`                                                                   |
| Time status badge          | Time status displayName                  | `toSentenceCase(row.timeStatus)`                                                                   |
| Premier badge              | Premier requested displayName            | None (display as-is)                                                                               |
| Representative badges      | Representative name (free text)          | `formatRepresentativeBadgeText(name)` (e.g. "Minister &lt;LastName&gt;")                           |
| Translations (list)        | Language displayName                     | `.toUpperCase()` when shown as badge-style list                                                    |
| Translations (status only) | Translations required status displayName | `toSentenceCase(row.translationsRequiredStatus)`                                                   |
| Comms materials            | Comms materials displayName              | `toSentenceCase(m)` per item, joined with ", "                                                     |
| Venue                      | Venue address fields                     | `formatVenueAddress()` – parts joined ", ", country omitted when Canada                            |
| Activity status badge      | Activity status displayName              | None (display as-is); colour from `getActivityStatusBadgeVariant(normalizeActivityStatus(status))` |
| Dates in scheduling        | ISO date strings                         | `formatDate(iso)` – "Mon DD" style                                                                 |

Look ahead status/section are **enum values** from the schema (e.g. `new`, `events`); they are not from a lookup table. The UI maps them to labels via `getLookAheadStatusLabel` / `getLookAheadSectionLabel` in `form-options.ts`.
