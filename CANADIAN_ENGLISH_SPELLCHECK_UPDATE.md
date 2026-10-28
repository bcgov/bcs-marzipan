# Canadian English Spellcheck Implementation

## Summary

Added `lang='en-CA'` attribute to all text input and textarea elements throughout the `calendar-ui` application to enable Canadian English spellchecking.

## Changes Made

### 1. Core Input Component (`calendar-ui/src/components/ui/input.tsx`)

- Added `lang` prop to the component function signature
- Set default value to `'en-CA'` when not explicitly provided
- Allows override if needed: `<Input lang="en-US" />`
- Applied to native HTML `<input>` element

### 2. Textarea Component (`calendar-ui/src/components/ui/textarea.tsx`)

- Added `lang` prop to the component function signature
- Set default value to `'en-CA'` when not explicitly provided
- Allows override if needed: `<Textarea lang="en-US" />`
- Applied to native HTML `<textarea>` element

### 3. Freeform Combobox Component (`calendar-ui/src/components/ui/freeform-combobox.tsx`)

- Added `lang='en-CA'` to the raw text input element used for chip-based input
- This input is rendered when `showChips` is true
- The default input path already inherits the lang attribute through `InputGroupInput`

## Affected Components (Inheriting Canadian English Spellcheck)

The following components automatically receive `lang='en-CA'` through inheritance from the base `Input` and `Textarea` components:

- **Activity Forms:**
  - `ActivityOverviewSection` - Summary and optional text fields
  - `ActivityCommsSection` - Communication contact information
  - `ActivityScheduleSection` - Scheduling notes
  - `ActivityEventSection` - Event details

- **User Management:**
  - `UserCreateModal` - User email, IDIR username, display name, job title, phone
  - `UserEditModal` - Edit user details
  - `UserManagementFilters` - User search and filtering

- **Team Management:**
  - `TeamEditModal` - Team name and details
  - `TeamManagementFilters` - Team search

- **Admin Forms:**
  - `LookupForm` - Lookup data administration
  - `VenuePresetForm` - Venue management
  - `BannerSettingsAdmin` - Banner text
  - `LoginModalSettingsAdmin` - Login modal text
  - `ReportCoverContactSettingsAdmin` - Report details
  - `MinistryAdminModalForm` - Ministry configuration

- **Reports:**
  - `EditReportModal` - Report editing
  - `ReportFiltersBar` - Report search and filtering

- **Other Components:**
  - `AddressAutocomplete` - Address search input
  - `RichTextFieldLinkDialog` - URL and link label inputs
  - `Combobox` (all variants) - Search and selection inputs
  - `HistorySearchInput` - History search
  - `ActivityTableFilters` - Activity filtering

## Technical Details

- **Default Behavior:** All text inputs now default to Canadian English spellcheck
- **Opt-out Support:** Components can override with `lang="en-US"` or any other language code
- **Backwards Compatible:** Existing code doesn't need to be modified; the change is transparent
- **HTML Standard:** Uses the standard HTML `lang` attribute for accessibility and spell-checking
- **Component Hierarchy:**
  - `Input` → `InputGroupInput` → `Combobox` variants
  - `Textarea` → `InputGroupTextarea` → Form sections

## Testing

- ✅ TypeScript compilation passes without errors
- ✅ ESLint validation passes
- ✅ Build completes successfully (calendar-ui Vite build)
- ✅ No breaking changes to component APIs

## Browser Support

The `lang` attribute is supported in all modern browsers and affects:

- Spell-checking behavior
- Text direction (if applicable)
- Accessibility features
- Voice input (on supported devices)

## Notes

- Numeric inputs (time picker hour/minute fields) intentionally excluded as they don't benefit from language-specific spell-checking
- Hidden inputs (e.g., form state management) excluded as they're not user-visible
- Rich text editor uses TipTap which has its own spell-checking configuration

## Files Modified

```
calendar-ui/src/components/ui/input.tsx             +4 -1
calendar-ui/src/components/ui/textarea.tsx          +4 -1
calendar-ui/src/components/ui/freeform-combobox.tsx +1 -0
```
