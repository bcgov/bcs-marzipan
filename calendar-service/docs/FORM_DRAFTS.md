# Form Drafts Feature - Autosave Implementation

## Overview

The Form Drafts feature provides automatic saving of in-progress forms, allowing users to save incomplete work and resume later without losing data. Draft data is stored separately from validated entity tables, bypassing validation constraints.

## ⚠️ Security Warning

**CRITICAL: The current implementation uses client-supplied `userId` query parameters for authentication, which is NOT secure for production use.**

### Current Security Issues:
- Endpoints accept `userId` as a query parameter that can be modified by the client
- An attacker can change the `userId` to access, modify, or delete other users' drafts
- No server-side authentication or authorization is implemented

### Required Before Production:
1. Implement proper authentication middleware to identify the authenticated user
2. Extract `userId` from the authenticated session/token on the server side
3. Remove `userId` from query parameters in client requests
4. Implement authorization checks to ensure users can only access their own drafts
5. Add audit logging for draft operations

### Temporary Mitigation:
This feature is currently intended for development/testing only. The API should be protected behind:
- Network-level restrictions (not exposed publicly)
- API gateway authentication
- Rate limiting

## Architecture

### Database Layer

**Table: `form_drafts`**

```sql
CREATE TABLE form_drafts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  form_type VARCHAR(50) NOT NULL,
  entity_id INTEGER,              -- NULL for new items, ID for editing existing
  draft_data JSONB NOT NULL,      -- Incomplete form data (no validation)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,           -- Auto-expire after 30 days
  UNIQUE(user_id, form_type, entity_id)
);

-- Indexes for performance
CREATE INDEX idx_form_drafts_user ON form_drafts(user_id);
CREATE INDEX idx_form_drafts_type ON form_drafts(form_type);
CREATE INDEX idx_form_drafts_expires ON form_drafts(expires_at);
```

**Key Features:**

- **JSONB Storage**: Stores any partial form data without schema validation
- **User-Scoped**: Each user has isolated drafts
- **Unique Constraint**: One draft per user per form type per entity
- **Automatic Expiration**: Drafts expire after 30 days by default
- **Efficient Queries**: Indexed on user_id, form_type, and expires_at

### Backend (NestJS)

#### Files Created

```
calendar-service/src/drafts/
├── drafts.module.ts           # Module registration
├── drafts.service.ts          # Business logic and database operations
├── drafts.controller.ts       # REST API endpoints
└── dto/
    └── drafts.dto.ts          # Request/response DTOs
```

#### API Endpoints

| Method   | Endpoint                                                     | Description                   |
| -------- | ------------------------------------------------------------ | ----------------------------- |
| `POST`   | `/drafts/save?userId={id}`                                   | Save or update a draft        |
| `GET`    | `/drafts?userId={id}&formType={type}&entityId={id?}`         | Get specific draft            |
| `GET`    | `/drafts/list?userId={id}`                                   | List all user's drafts        |
| `DELETE` | `/drafts/:id?userId={id}`                                    | Delete draft by ID            |
| `DELETE` | `/drafts/by-form?userId={id}&formType={type}&entityId={id?}` | Delete draft by form type     |
| `POST`   | `/drafts/cleanup`                                            | Admin: Cleanup expired drafts |

#### Example API Usage

**Save a Draft:**

```bash
curl -X POST 'http://localhost:3000/drafts/save?userId=1' \
  -H 'Content-Type: application/json' \
  -d '{
    "formType": "activity",
    "entityId": null,
    "draftData": {
      "title": "Incomplete Event",
      "startDate": "2026-01-15",
      "summary": "Work in progress..."
    }
  }'
```

**Get a Draft:**

```bash
curl 'http://localhost:3000/drafts?userId=1&formType=activity&entityId=null'
```

**List All Drafts:**

```bash
curl 'http://localhost:3000/drafts/list?userId=1'
```

**Delete a Draft:**

```bash
curl -X DELETE 'http://localhost:3000/drafts/123?userId=1'
```

### Frontend (React + TypeScript)

#### Files Created

```
calendar-ui/src/
├── api/
│   └── draftsApi.ts          # API client for draft operations
└── hooks/
    └── useAutoSave.ts        # React hook for autosave functionality
```

#### React Hook: `useAutoSave`

**Features:**

- ✅ Automatic debounced saving (default: 2 seconds)
- ✅ Load existing draft on mount
- ✅ Manual save function
- ✅ Delete draft functionality
- ✅ React Query integration for caching
- ✅ Loading and error states
- ✅ Last saved timestamp

**Usage Example:**

```tsx
import { useState, useEffect } from 'react';
import { useAutoSave } from '../hooks/useAutoSave';

function CreateActivityForm() {
  const [formData, setFormData] = useState({});
  const userId = 1; // TODO: Get from auth context

  const {
    existingDraft,
    isDraftLoading,
    isSaving,
    lastSaved,
    saveNow,
    deleteDraft,
  } = useAutoSave(userId, 'activity', formData, undefined, {
    debounceMs: 3000,
    onSaveSuccess: () => {
      toast.success('Draft saved');
    },
    onDraftLoaded: (draft) => {
      console.log('Draft loaded:', draft);
    },
  });

  // Load draft on mount
  useEffect(() => {
    if (existingDraft?.draftData) {
      setFormData(existingDraft.draftData);
    }
  }, [existingDraft]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Save the final activity
    await createActivity(formData);
    // Delete the draft after successful submission
    await deleteDraft();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="autosave-indicator">
        {isSaving && <span>💾 Saving...</span>}
        {lastSaved && !isSaving && (
          <span>✓ Saved at {lastSaved.toLocaleTimeString()}</span>
        )}
      </div>

      <input
        value={formData.title || ''}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Activity Title"
      />

      <textarea
        value={formData.summary || ''}
        onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
        placeholder="Summary"
      />

      <button type="submit">Create Activity</button>
      <button type="button" onClick={saveNow}>
        Save Draft Now
      </button>
      <button type="button" onClick={deleteDraft}>
        Discard Draft
      </button>
    </form>
  );
}
```

## Configuration Options

### Backend Configuration

**Draft Expiration:**

```typescript
// In drafts.service.ts
const expiresAt = new Date();
expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
```

### Frontend Configuration

**Debounce Timing:**

```typescript
useAutoSave(userId, formType, formData, entityId, {
  debounceMs: 2000, // Wait 2 seconds after user stops typing
  enabled: true, // Enable/disable autosave
});
```

## User Management Integration

Currently, the feature uses a temporary `userId` parameter. When user authentication is implemented:

### Backend Changes

1. **Add Authentication Guard:**

```typescript
// drafts.controller.ts
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(AuthGuard)
@Controller('drafts')
export class DraftsController {
  @Post('save')
  async saveDraft(
    @CurrentUser() user: User, // Get from auth token
    @Body() saveDto: SaveDraftDto
  ) {
    return this.draftsService.saveDraft(user.id, saveDto);
  }
}
```

### Frontend Changes

2. **Remove userId Parameter:**

```typescript
// Get userId from auth context
const { user } = useAuth();
const { existingDraft } = useAutoSave(user.id, 'activity', formData);
```

## Scheduled Cleanup Job

To automatically delete expired drafts, set up a cron job:

### Option 1: NestJS Schedule (Recommended)

```typescript
// drafts.service.ts
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class DraftsService {
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async scheduledCleanup() {
    const count = await this.cleanupExpiredDrafts();
    this.logger.log(`Cleaned up ${count} expired drafts`);
  }
}
```

### Option 2: Manual Cron Job

```bash
# Run daily at 2 AM
0 2 * * * curl -X POST http://localhost:3000/drafts/cleanup
```

## Testing

### Backend Tests

```typescript
// drafts.service.spec.ts
describe('DraftsService', () => {
  it('should save a new draft', async () => {
    const draft = await service.saveDraft(1, {
      formType: 'activity',
      draftData: { title: 'Test' },
    });
    expect(draft.id).toBeDefined();
  });

  it('should update existing draft', async () => {
    // First save
    await service.saveDraft(1, {
      formType: 'activity',
      draftData: { title: 'First' },
    });

    // Second save should update
    const updated = await service.saveDraft(1, {
      formType: 'activity',
      draftData: { title: 'Updated' },
    });

    expect(updated.draftData.title).toBe('Updated');
  });
});
```

### Frontend Tests

```typescript
// useAutoSave.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useAutoSave } from './useAutoSave';

it('should autosave after debounce period', async () => {
  const { result } = renderHook(() =>
    useAutoSave(1, 'activity', { title: 'Test' }, undefined, {
      debounceMs: 500,
    })
  );

  await waitFor(() => {
    expect(result.current.isSaving).toBe(true);
  });

  await waitFor(() => {
    expect(result.current.lastSaved).toBeTruthy();
  });
});
```

## Performance Considerations

### Database

- **JSONB Indexing**: Consider adding GIN indexes if searching within draftData
- **Partitioning**: For large-scale deployments, partition by user_id or created_at
- **Connection Pooling**: Ensure adequate database connection pool size

### Frontend

- **Debouncing**: Prevents excessive API calls (default: 2 seconds)
- **React Query Caching**: Reduces redundant network requests
- **Optimistic Updates**: Immediate UI feedback before server confirmation

### Network

- **Payload Size**: Monitor size of draftData for large forms
- **Compression**: Enable gzip compression on API responses
- **Rate Limiting**: Implement rate limits to prevent abuse

## Security Considerations

1. **User Isolation**: Drafts are strictly scoped to user_id
2. **Input Validation**: Validate formType and entityId parameters
3. **Rate Limiting**: Prevent spam by limiting saves per user per minute
4. **Data Sanitization**: Sanitize JSON data to prevent injection attacks
5. **Authorization**: Ensure users can only access their own drafts

## Monitoring and Logging

**Key Metrics to Track:**

- Number of drafts created per day
- Average draft age before deletion
- Draft save success/failure rate
- Number of expired drafts cleaned up
- Average draft size (bytes)

**Logging:**

```typescript
this.logger.log('Draft saved', {
  userId,
  formType,
  entityId,
  draftSize: JSON.stringify(draftData).length,
});
```

## Future Enhancements

### Version History

Track multiple versions of a draft:

```typescript
CREATE TABLE form_draft_versions (
  id SERIAL PRIMARY KEY,
  draft_id INTEGER REFERENCES form_drafts(id),
  version INTEGER NOT NULL,
  draft_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Conflict Resolution

Handle concurrent edits from multiple devices:

```typescript
interface Draft {
  version: number;
  lastModifiedBy: string;
  conflictsWith?: Draft[];
}
```

### Browser Sync

Sync with localStorage for offline support:

```typescript
// Save to localStorage immediately
localStorage.setItem(`draft-${formType}-${entityId}`, JSON.stringify(formData));

// Sync to server every 5 seconds
useEffect(() => {
  const interval = setInterval(() => syncToServer(), 5000);
  return () => clearInterval(interval);
}, []);
```

### Cross-Device Access

Show list of available drafts:

```tsx
function DraftsList() {
  const { data } = useQuery(['drafts', userId], () => listDrafts(userId));

  return (
    <ul>
      {data?.drafts.map((draft) => (
        <li key={draft.id}>
          {draft.formType} - Last updated:{' '}
          {new Date(draft.updatedAt).toLocaleString()}
          <button onClick={() => loadDraft(draft)}>Resume</button>
        </li>
      ))}
    </ul>
  );
}
```

## Troubleshooting

### Issue: Drafts not saving

- **Check**: Database connection is active
- **Check**: User has valid userId
- **Check**: FormData is not empty
- **Check**: Network connectivity

### Issue: Drafts not loading on mount

- **Check**: userId and formType are correctly passed
- **Check**: React Query cache settings
- **Check**: API endpoint is reachable

### Issue: Performance degradation

- **Check**: Number of active drafts per user
- **Check**: Size of draftData payloads
- **Check**: Database query performance
- **Check**: Expired drafts cleanup job is running

## Related Documentation

- [Database Schema](../../packages/database/README.md)
- [API Documentation](../API.md)
- [Testing Setup](../TESTING_SETUP.md)

## Migration Notes

**Schema Version:** 0003_quiet_black_cat.sql

**Database Migration:**

```bash
cd packages/database
npm run db:generate  # Generate migration
npm run db:push      # Apply to database
```

**Rollback:**

```sql
DROP TABLE IF EXISTS form_drafts CASCADE;
```
