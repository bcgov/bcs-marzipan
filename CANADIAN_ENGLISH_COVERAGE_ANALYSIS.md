# Canadian English Spellcheck Coverage Analysis

## Overview

While we've successfully added `lang='en-CA'` to all text input and textarea form fields, there are several areas where Canadian English text content exists but is **not** currently subject to browser spellchecking. This document identifies those areas.

## Areas WITHOUT Canadian English Spellcheck Support

### 1. ✅ Form Inputs (COVERED)

**Status:** All form inputs now have `lang='en-CA'`

- Text inputs (via `<Input>` component)
- Textarea fields (via `<Textarea>` component)
- Combobox search inputs (via `InputGroupInput`)
- Freeform combobox inputs
- Address autocomplete inputs
- Rich text field link dialog inputs

---

### 2. ❌ Rich Text Editor (TipTap)

**File:** `calendar-ui/src/components/ui/rich-text-field.tsx`

**Issue:** The TipTap/ProseMirror editor does not have `lang='en-CA'` configured

- `EditorContent` component renders without language attribute
- User-editable content area lacks spellcheck language configuration
- Affects activity description fields and other rich text areas

**Recommendation:**

```typescript
// In rich-text-field.tsx, add lang attribute to editor container
<div className="...">
  <EditorContent
    editor={editor}
    lang="en-CA"  // Add this
    onBlur={() => onBlur()}
  />
</div>

// Also configure TipTap extensions if available
editorProps: {
  attributes: {
    ...(id ? { id } : {}),
    lang: 'en-CA',  // Add language attribute
    // ... existing classes
  },
}
```

---

### 3. ❌ Content Editable Banner Editor

**File:** `calendar-ui/src/components/admin/BannerSettingsAdmin.tsx`

**Issue:** The `contentEditable` div for banner HTML editing has no language attribute

```tsx
<div
  id="banner-content"
  ref={contentRef}
  contentEditable={canManage}  // ← No lang attribute
  suppressContentEditableWarning
  onInput={...}
/>
```

**Recommendation:**

```tsx
<div
  id="banner-content"
  ref={contentRef}
  contentEditable={canManage}
  lang="en-CA"  // Add this
  suppressContentEditableWarning
  onInput={...}
/>
```

---

### 4. ❌ Read-Only Display Areas

**Files:** Various components with `.innerHTML`, `.textContent` display

- Activity descriptions (read-only view)
- History entries
- Report previews
- Banner content displays

**Issue:** These are not editable, so spellcheck is not applicable, but if users need to select/copy text with spell-aware selection, language context would help.

---

### 5. ❌ Hardcoded UI Text & Error Messages

**Files:**

- `calendar-ui/src/lib/error-messages.ts`
- `calendar-ui/src/schemas/`
- Component label text (placeholders, tooltips, aria-labels)

**Examples:**

```typescript
// error-messages.ts
export const DEFAULT_ERROR_MESSAGE =
  'An unexpected error occurred. Please try again.';
export const ACCESS_DENIED_MESSAGE =
  'You do not have permission to access this resource.';
```

**Issue:** Static UI strings are not subject to spell-checking. These are hardcoded English text that cannot be spell-checked at runtime. A future localization system could mark these for review.

---

### 6. ❌ Backend Validation Messages

**Files:** `calendar-service/src/**/*.ts`

- Validation error messages in Zod schemas
- HTTP exception messages
- Guard rejection messages

**Example:**

```typescript
// calendar-service/src/policy/guards/can-edit-activity.guard.ts
throw new ForbiddenException('User cannot edit this activity');
```

**Issue:** These are backend-generated English strings not subject to browser spell-checking. They would need:

1. Manual review for Canadian English compliance
2. API response localization if i18n is implemented

---

### 7. ❌ Database-stored Content

**Areas:**

- Lookup values (categories, tags, venues)
- Activity titles and descriptions (but these are edited via form inputs with lang='en-CA')
- Historical audit messages
- System-generated notifications

**Issue:** Content stored in the database was created without language context. Future imports/migrations might need to consider language-aware processing.

---

### 8. ❌ Form Labels and Placeholders (Generated Content)

**Files:** Files generating dynamic form labels

- `activity-form-labels.ts`
- `activity-form-section-labels.ts`

**Issue:** While form input controls have `lang='en-CA'`, the labels and help text around them don't. Labels are often static strings in React components.

**Example:**

```typescript
// activity-form-section-labels.ts
export const ACTIVITY_FORM_SECTION_LABELS = {
  overview: 'Activity Overview',
  comms: 'Communications',
  // ... etc
};
```

These labels are read-only and not editable, but for consistency, they could reference a centralized English text configuration reviewed for Canadian spelling.

---

### 9. ❌ Shared Package Schemas & Types

**File:** `packages/shared/schemas/*.ts`

**Issue:** Validation messages and type descriptions in shared schemas used by both frontend and backend contain English text without language context.

```typescript
// packages/shared/schemas/activity.schema.ts
ACTIVITY_SUMMARY_MAX_LENGTH,
ACTIVITY_BRIEF_RICH_TEXT_MAX_LENGTH,
// ... etc
```

---

### 10. ❌ Documentation & Comments

**Files:** Throughout codebase

- README files
- Inline code comments
- JSDoc comments
- Architecture documentation

**Issue:** Not user-facing, but internal documentation may contain Canadian spelling expectations.

---

## Summary Table

| Area                   | Type             | Current Status       | User-Facing | Impact   |
| ---------------------- | ---------------- | -------------------- | ----------- | -------- |
| Text Input Fields      | Form Input       | ✅ Has lang='en-CA'  | Yes         | Direct   |
| Textarea Fields        | Form Input       | ✅ Has lang='en-CA'  | Yes         | Direct   |
| Combobox Inputs        | Form Input       | ✅ Has lang='en-CA'  | Yes         | Direct   |
| TipTap Rich Editor     | Content Editable | ❌ No lang attribute | Yes         | **HIGH** |
| Banner Editor          | Content Editable | ❌ No lang attribute | Yes         | High     |
| Read-Only Text         | Display          | N/A (not editable)   | Yes         | Low      |
| UI Labels/Placeholders | Display          | N/A (static text)    | Yes         | Low      |
| Error Messages         | Backend String   | N/A (hardcoded)      | Yes         | Medium   |
| Database Content       | Stored Data      | N/A (no context)     | Indirect    | Low      |
| Documentation          | Code/Docs        | N/A (internal)       | No          | None     |

---

## Recommendations (Priority Order)

### 🔴 HIGH PRIORITY

1. **Add `lang='en-CA'` to TipTap EditorContent** - Affects rich text editing for activity descriptions
   - Impact: Users creating/editing activities with rich text formatting
   - Effort: Low (~5 lines)

2. **Add `lang='en-CA'` to Banner Content Editor** - Affects admin banner management
   - Impact: Admins creating system banners
   - Effort: Low (~1 line)

### 🟡 MEDIUM PRIORITY

3. **Audit error message strings** - Review for Canadian spelling compliance
   - Files: `calendar-ui/src/lib/error-messages.ts`, backend validation schemas
   - Examples: Check for "honour", "colour", "centre", "licence", etc.
   - Effort: Medium (requires manual review)

4. **Create localization strategy** - Plan for i18n that respects language context
   - Future: Separate locale files for en-CA, en-US, fr-CA, etc.
   - Effort: High (architectural)

### 🟢 LOW PRIORITY

5. **Document Canadian English conventions** - Create style guide for contributors
   - File: New `docs/CANADIAN_ENGLISH.md`
   - Examples: Common spelling differences, terminology
   - Effort: Low

6. **Add lang attribute to form labels** - For consistency (not strictly necessary)
   - Wrapping label elements with lang attribute
   - Effort: Low (but high impact - many files)

---

## Verification Checklist

- [ ] User tests TipTap editor for spell-check suggestions
- [ ] User tests banner content editor for spell-check suggestions
- [ ] Review error message strings for Canadian spelling
- [ ] Test with browser spell-checker (Chrome, Firefox, Edge)
- [ ] Document any Canadian English differences found during testing
- [ ] Create task for localization if planned

---

## Notes

- **Browser Behavior:** Different browsers (Chrome, Firefox, Safari, Edge) have varying levels of spellcheck support for HTML5 attributes
- **Testing:** Spell-check functionality is browser-dependent; test on target browsers
- **Scope:** This analysis focuses on runtime spell-checking, not content review or translation
- **Future:** If implementing i18n/localization, ensure language context is preserved throughout the data pipeline
