# Activity form sections

Canonical section order, labels, and field membership live in:

`packages/shared/src/activity-form-sections.ts`

The activity form UI is composed in `calendar-ui/src/components/activity/ActivityFormBody.tsx` using one component per section under `ActivityFormSections/`.

## When you change the form

1. **Update the registry** — add/move/remove the top-level `ActivityFormData` key under the correct section in `ACTIVITY_FORM_SECTION_FIELDS`. Adjust `ACTIVITY_FORM_SECTION_IDS` and `ACTIVITY_FORM_SECTION_LABELS` if you add or rename a section.
2. **Update the section component** — render the field in the matching `Activity*Section.tsx` file.
3. **Update `ActivityFormBody`** — if section order or column layout changes.
4. **Review-exempt** — if the field should be admin-configurable, ensure it is listed in the registry and **not** in `ACTIVITY_REVIEW_EXEMPT_CODE_KEYS` (`review-exempt-settings.ts`). The admin UI grouping is derived automatically.
5. **Clone modal** — optional advanced fields are derived from the registry minus exclusions in `clone-activity.schema.ts` (`CLONE_NEVER_COPIED_FIELD_KEYS`, etc.). Add clone-specific exclusions there; do not duplicate section lists.
6. **Run tests** — `npm test -- activity-form-sections` in `packages/shared`.

## Derived consumers (do not duplicate section lists)

| Consumer                              | Source                                                      |
| ------------------------------------- | ----------------------------------------------------------- |
| Review-exempt Settings combobox       | `ACTIVITY_REVIEW_EXEMPT_CONFIGURABLE_SECTIONS`              |
| Clone modal “More options” checkboxes | `CLONE_ADVANCED_SECTIONS` / `CLONE_ADVANCED_FIELD_GROUPS`   |
| Section headings in form components   | `ACTIVITY_FORM_SECTION_LABELS` (re-exported in calendar-ui) |

## Section order (current)

| Column | Sections                                       |
| ------ | ---------------------------------------------- |
| Left   | Overview → Comms                               |
| Right  | Reports → Schedule → Release → Event → Sharing |

## Notes

- **`newsReleaseId`** — still on `ActivityFormData` but not rendered in the form; listed under Release for review-exempt configurability only. Excluded from clone advanced options in `clone-activity.schema.ts`.
- **Nested paths** (e.g. `venueAddress.city`) are not listed here; clone/review use top-level keys (`venueAddress`) where applicable.
- **Code-exempt review fields** (`ACTIVITY_REVIEW_EXEMPT_CODE_KEYS`) remain in the registry but are filtered out of the admin Settings UI.

## Keys intentionally omitted from the registry

These top-level `ActivityFormData` keys are listed in `ACTIVITY_FORM_SECTION_REGISTRY_OMITTED_KEYS` and must not appear in any section. A compile-time and runtime test in `activity-form-sections.test.ts` fails if a schema key is missing from both the registry and this list.

| Key                    | Reason                                                     |
| ---------------------- | ---------------------------------------------------------- |
| `activityStatusId`     | Backend-owned status; excluded from review diff            |
| `markAsReviewed`       | Create/clone workflow flag, not a form section field       |
| `markAsCompleted`      | Complete workflow flag, not a form section field           |
| `activityHistoryNotes` | Audit/history note on create or clone, not the main form   |
| `commsContactLeadId`   | UI convenience; submitted as `commsContacts` with `isLead` |
| `leadMinistryId`       | Derived from lead team ministry                            |
