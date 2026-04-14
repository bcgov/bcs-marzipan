import { describe, expect, it } from 'vitest';

import {
  ACTIVITY_FIELD_SCOPE_CONFIG,
  ACTIVITY_FIELD_SCOPES,
  canEditActivityFieldScope,
  canViewActivityFieldScope,
  getEditableFieldScopes,
  getViewableFieldScopes,
} from './activity-field-scopes';
import { PERMISSIONS, SYSTEM_ROLES } from './constants';

const viewer = {
  permissions: ['activities.view'],
  roleName: SYSTEM_ROLES.VIEWER,
};
const editor = {
  permissions: ['activities.view', 'activities.edit'],
  roleName: SYSTEM_ROLES.EDITOR,
};
const advancedViewer = {
  permissions: ['activities.view'],
  roleName: SYSTEM_ROLES.ADVANCED_VIEWER,
};
const advancedEditor = {
  permissions: ['activities.view', 'activities.edit'],
  roleName: SYSTEM_ROLES.ADVANCED_EDITOR,
};
const admin = {
  permissions: [
    'activities.view',
    'activities.edit',
    ...ACTIVITY_FIELD_SCOPES.flatMap((s) => {
      const c = ACTIVITY_FIELD_SCOPE_CONFIG[s];
      return c.viewKey ? [c.viewKey, c.editKey] : [c.editKey];
    }),
  ],
  roleName: SYSTEM_ROLES.ADMIN,
};

const editorWithNotesGrant = {
  permissions: [
    'activities.view',
    'activities.edit',
    PERMISSIONS.ACTIVITIES.NOTES_VIEW,
    PERMISSIONS.ACTIVITIES.NOTES_EDIT,
  ],
  roleName: SYSTEM_ROLES.EDITOR,
};

const editorWithViewOnlyGrant = {
  permissions: [
    'activities.view',
    'activities.edit',
    PERMISSIONS.ACTIVITIES.NOTES_VIEW,
  ],
  roleName: SYSTEM_ROLES.EDITOR,
};

describe('canViewActivityFieldScope', () => {
  it('returns false for view-restricted scopes when Viewer lacks grants', () => {
    expect(canViewActivityFieldScope(viewer, 'notes')).toBe(false);
    expect(canViewActivityFieldScope(viewer, 'lookAhead')).toBe(false);
    expect(canViewActivityFieldScope(viewer, 'pitchStatus')).toBe(false);
  });

  it('returns true for translations and pitchDate without grants (no view permission)', () => {
    expect(canViewActivityFieldScope(viewer, 'translations')).toBe(true);
    expect(canViewActivityFieldScope(viewer, 'pitchDate')).toBe(true);
  });

  it('returns false for view-restricted scopes when Editor lacks grants', () => {
    expect(canViewActivityFieldScope(editor, 'notes')).toBe(false);
    expect(canViewActivityFieldScope(editor, 'lookAhead')).toBe(false);
    expect(canViewActivityFieldScope(editor, 'pitchStatus')).toBe(false);
  });

  it('returns true for translations and pitchDate when Editor lacks other grants', () => {
    expect(canViewActivityFieldScope(editor, 'translations')).toBe(true);
    expect(canViewActivityFieldScope(editor, 'pitchDate')).toBe(true);
  });

  it('returns true for Advanced Viewer (role bypass) without scope grants', () => {
    for (const scope of ACTIVITY_FIELD_SCOPES) {
      expect(canViewActivityFieldScope(advancedViewer, scope)).toBe(true);
    }
  });

  it('returns true for Advanced Editor (role bypass) without scope grants', () => {
    for (const scope of ACTIVITY_FIELD_SCOPES) {
      expect(canViewActivityFieldScope(advancedEditor, scope)).toBe(true);
    }
  });

  it('returns true for Admin with all grants', () => {
    for (const scope of ACTIVITY_FIELD_SCOPES) {
      expect(canViewActivityFieldScope(admin, scope)).toBe(true);
    }
  });

  it('returns true when user has .view grant', () => {
    expect(canViewActivityFieldScope(editorWithViewOnlyGrant, 'notes')).toBe(
      true
    );
  });

  it('returns true when user has .edit grant (edit implies view)', () => {
    expect(canViewActivityFieldScope(editorWithNotesGrant, 'notes')).toBe(true);
  });
});

describe('canEditActivityFieldScope', () => {
  it('returns false for Viewer without scope grants', () => {
    for (const scope of ACTIVITY_FIELD_SCOPES) {
      expect(canEditActivityFieldScope(viewer, scope)).toBe(false);
    }
  });

  it('returns false for Advanced Viewer (no edit role bypass)', () => {
    for (const scope of ACTIVITY_FIELD_SCOPES) {
      expect(canEditActivityFieldScope(advancedViewer, scope)).toBe(false);
    }
  });

  it('returns false for Advanced Editor without scope grants (no edit role bypass)', () => {
    for (const scope of ACTIVITY_FIELD_SCOPES) {
      expect(canEditActivityFieldScope(advancedEditor, scope)).toBe(false);
    }
  });

  it('returns true for Admin with all grants', () => {
    for (const scope of ACTIVITY_FIELD_SCOPES) {
      expect(canEditActivityFieldScope(admin, scope)).toBe(true);
    }
  });

  it('returns false when user only has .view grant', () => {
    expect(canEditActivityFieldScope(editorWithViewOnlyGrant, 'notes')).toBe(
      false
    );
  });

  it('returns true when user has .edit grant', () => {
    expect(canEditActivityFieldScope(editorWithNotesGrant, 'notes')).toBe(true);
  });
});

describe('getViewableFieldScopes', () => {
  it('returns only always-viewable scopes for Viewer without grants', () => {
    const result = getViewableFieldScopes(viewer);
    expect(result.has('translations')).toBe(true);
    expect(result.has('pitchDate')).toBe(true);
    expect(result.has('pitchStatus')).toBe(false);
    expect(result.size).toBe(2);
  });

  it('returns all scopes for Advanced Viewer', () => {
    expect(getViewableFieldScopes(advancedViewer).size).toBe(
      ACTIVITY_FIELD_SCOPES.length
    );
  });

  it('returns granted scopes plus always-viewable scopes for Editor', () => {
    const result = getViewableFieldScopes(editorWithNotesGrant);
    expect(result.has('notes')).toBe(true);
    expect(result.has('translations')).toBe(true);
    expect(result.has('pitchDate')).toBe(true);
    expect(result.size).toBe(3);
  });
});

describe('getEditableFieldScopes', () => {
  it('returns empty set for Advanced Viewer', () => {
    expect(getEditableFieldScopes(advancedViewer).size).toBe(0);
  });

  it('returns all scopes for Admin', () => {
    expect(getEditableFieldScopes(admin).size).toBe(
      ACTIVITY_FIELD_SCOPES.length
    );
  });

  it('returns only edit-granted scopes for Editor', () => {
    const result = getEditableFieldScopes(editorWithNotesGrant);
    expect(result.has('notes')).toBe(true);
    expect(result.size).toBe(1);
  });
});
