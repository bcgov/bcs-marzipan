# Draft Recovery Feature

## Overview
When a user navigates to the CreateActivityForm, if they have a saved draft activity form in the database, they will see a modal dialog asking if they want to continue where they left off.

## Implementation Details

### Components Added
- **Dialog Component** (`calendar-ui/src/components/ui/dialog.tsx`)
  - A reusable modal dialog component built with Radix UI primitives
  - Includes DialogContent, DialogHeader, DialogFooter, DialogTitle, and DialogDescription

### Changes to CreateActivityForm
- **Dialog Import**: Added Dialog component imports
- **State Management**:
  - `showDraftDialog`: Controls the visibility of the draft recovery modal
  - `draftChecked`: Prevents the dialog from showing multiple times
  
- **Draft Detection Logic** (useEffect):
  - Runs on component mount
  - Checks if a draft exists and hasn't been checked yet
  - Shows the dialog if a draft is found

- **User Actions**:
  - **Continue Draft**: Loads the draft data into the form using `form.reset()`
  - **Start Fresh**: Deletes the draft from the database and starts with an empty form

### User Experience Flow

1. User navigates to Create Activity Form
2. System checks for existing draft (via useAutoSave hook)
3. If draft exists:
   - Modal dialog appears with two options
   - Dialog blocks interaction with form until user makes a choice
4. User selects an option:
   - **Continue Draft**: Form is pre-populated with saved data, autosave continues
   - **Start Fresh**: Draft is deleted, user gets empty form, new autosaves will create new draft

### Key Features
- Dialog only appears once per page load (controlled by `draftChecked` state)
- Non-dismissible - user must choose an option (no X button or background click to close)
- Seamless integration with existing autosave functionality
- Draft is automatically deleted on form submission regardless of user choice

### Technical Notes
- The dialog uses controlled state with `open` and `onOpenChange` props
- Draft deletion happens via the `deleteDraft()` function from useAutoSave hook
- The modal renders outside the form using Portal (Radix UI feature)
- Dialog uses Tailwind CSS classes for styling and animations

### Future Enhancements
- Add timestamp to dialog showing when draft was last saved
- Add preview of draft data in the dialog
- Support multiple drafts per user (currently only one per form type)
- Add keyboard shortcuts (Enter for Continue, Escape for Start Fresh)
