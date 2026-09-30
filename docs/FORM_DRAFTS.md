# Form Drafts Feature

## Authentication

Draft API routes require JWT authentication. The server identifies the user from the token (`@CurrentUser()`); clients must not pass `userId` in query strings. Operations are gated by `drafts.create`, `drafts.edit`, `drafts.view`, and `drafts.delete` permissions.

---

## Overview

The Form Drafts feature provides automatic saving of in-progress forms, allowing users to recover their work if they navigate away or close the browser. When returning to the form, users are presented with a dialog to either continue their draft or start fresh.

## Features

- **Automatic Saving**: Debounced autosave (default: 2 seconds)
- **Draft Loading**: Loads existing draft on component mount
- **Manual Save**: Option to save immediately
- **Draft Deletion**: Deletes drafts after form submission
- **User Isolation**: Drafts scoped to specific users
- **Expiration**: Auto-expire after 30 days
- **No Validation**: JSONB storage accepts any partial form data

## Architecture

### Database Schema

```sql
CREATE TABLE form_drafts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  form_type VARCHAR(50) NOT NULL,
  entity_id INTEGER,
  draft_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  UNIQUE(user_id, form_type, entity_id)
);
```

### API Endpoints

| Method | Endpoint                                         | Description            |
| ------ | ------------------------------------------------ | ---------------------- |
| PUT    | `/drafts`                                        | Save/update draft      |
| GET    | `/drafts?formType={type}&entityId={id?}`         | Get specific draft     |
| GET    | `/drafts/list`                                   | List all user drafts   |
| DELETE | `/drafts/:id`                                    | Delete by ID           |
| DELETE | `/drafts/by-form?formType={type}&entityId={id?}` | Delete by form type    |
| (cron) | `DraftsCleanupService` daily 02:00               | Cleanup expired drafts |

### Key Files

**Database:**

- `packages/database/src/schema/formDrafts.ts` - Drizzle schema
- `packages/database/migrations/0003_draft_forms_table.sql` - Migration

**Backend (NestJS):**

- `calendar-service/src/drafts/drafts.module.ts` - Module configuration
- `calendar-service/src/drafts/drafts.service.ts` - Business logic
- `calendar-service/src/drafts/drafts.controller.ts` - REST endpoints
- `calendar-service/src/drafts/dto/drafts.dto.ts` - DTOs

**Frontend (React):**

- `calendar-ui/src/api/draftsApi.ts` - API client
- `calendar-ui/src/hooks/useAutoSave.ts` - Autosave hook
- `calendar-ui/src/components/ui/dialog.tsx` - Recovery dialog component

## User Experience Flow

1. User navigates to Create Activity Form
2. System checks for existing draft via the `useAutoSave` hook
3. If a draft exists, a modal dialog appears with two options:
   - **Continue Draft**: Form is pre-populated with saved data
   - **Start Fresh**: Draft is deleted, user gets an empty form
4. The dialog is non-dismissible; user must choose an option
5. On form submission, the draft is automatically deleted

## Frontend Usage

```tsx
import { useAutoSave } from '../hooks/useAutoSave';

function CreateActivityForm() {
  const [formData, setFormData] = useState({});

  const { existingDraft, isSaving, lastSaved, deleteDraft } = useAutoSave(
    'activity',
    formData,
    undefined, // entityId
    {
      debounceMs: 2000,
      onSaveSuccess: () => toast.success('Draft saved'),
    }
  );

  // Load draft on mount
  useEffect(() => {
    if (existingDraft?.draftData) {
      setFormData(existingDraft.draftData);
    }
  }, [existingDraft]);

  return (
    <form>
      {isSaving && <span>Saving...</span>}
      {lastSaved && <span>Saved {lastSaved.toLocaleTimeString()}</span>}
      {/* Form fields */}
    </form>
  );
}
```

## Configuration

**Backend:**

- Expiration Period: 30 days (configurable in `drafts.service.ts`)
- Unique Constraint: One draft per user/form/entity combination

**Frontend:**

- Debounce Delay: 2000ms (configurable in hook options)
- Cache Duration: 5 minutes (React Query staleTime)

## Future Enhancements

- Show timestamp in recovery dialog for when draft was last saved
- Add preview of draft data in the recovery dialog
- Support multiple drafts per user per form type
- Conflict resolution for concurrent edits
- Offline support with localStorage sync
