# Form Drafts Feature

## Security Warning

**The current implementation is NOT production-ready due to security issues.**

The API endpoints accept client-supplied `userId` query parameters, allowing an attacker to access, modify, or delete other users' drafts. Before production deployment:

1. Implement proper authentication to identify the authenticated user on the server
2. Extract `userId` from authenticated session/token (not from query parameters)
3. Add authorization checks to ensure users can only access their own drafts

**This feature is currently for development/testing only.**

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

| Method | Endpoint                                             | Description            |
| ------ | ---------------------------------------------------- | ---------------------- |
| POST   | `/drafts/save?userId={id}`                           | Save/update draft      |
| GET    | `/drafts?userId={id}&formType={type}&entityId={id?}` | Get specific draft     |
| GET    | `/drafts/list?userId={id}`                           | List all user drafts   |
| DELETE | `/drafts/:id?userId={id}`                            | Delete by ID           |
| DELETE | `/drafts/by-form?userId={id}&formType={type}`        | Delete by form type    |
| POST   | `/drafts/cleanup`                                    | Cleanup expired drafts |

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
    1, // userId (TODO: replace with auth)
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

- User authentication: Replace userId parameter with JWT-based auth
- Scheduled cleanup: Set up cron job for expired drafts
- Show timestamp in recovery dialog for when draft was last saved
- Add preview of draft data in the recovery dialog
- Support multiple drafts per user per form type
- Conflict resolution for concurrent edits
- Offline support with localStorage sync
