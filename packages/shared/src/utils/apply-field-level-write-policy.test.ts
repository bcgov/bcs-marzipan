import { describe, expect, it } from 'vitest';

import { SYSTEM_ROLES } from '../auth/constants';
import { applyFieldLevelWritePolicy } from './apply-field-level-write-policy';

const viewerNoGrants = {
  permissions: ['activities.view'],
  roleName: SYSTEM_ROLES.VIEWER,
};
const editorWithNotesEdit = {
  permissions: ['activities.view', 'activities.notes.edit'],
  roleName: SYSTEM_ROLES.EDITOR,
};
const adminWithAll = {
  permissions: [
    'activities.view',
    'activities.notes.edit',
    'activities.lookAhead.edit',
    'activities.translations.edit',
    'activities.pitchStatus.edit',
    'activities.pitchDate.edit',
  ],
  roleName: SYSTEM_ROLES.ADMIN,
};

describe('applyFieldLevelWritePolicy', () => {
  it('strips all restricted fields for Viewer without grants', () => {
    const dto: Record<string, unknown> = {
      title: 'Keep me',
      notes: 'Strip me',
      dateStatusId: 1,
      timeStatusId: 1,
      lookAheadStatus: 'new',
      lookAheadSection: 'events',
      translationsRequiredStatusId: 1,
      translationLanguageIds: [1, 2],
      pitchRequiredStatusId: 1,
      pitchDate: '2025-01-01',
    };

    const stripped = applyFieldLevelWritePolicy(dto, viewerNoGrants);

    expect(dto.title).toBe('Keep me');
    expect(dto.notes).toBeUndefined();
    expect(dto.dateStatusId).toBe(1);
    expect(dto.timeStatusId).toBe(1);
    expect(dto.lookAheadStatus).toBeUndefined();
    expect(dto.lookAheadSection).toBeUndefined();
    expect(dto.translationsRequiredStatusId).toBeUndefined();
    expect(dto.translationLanguageIds).toBeUndefined();
    expect(dto.pitchRequiredStatusId).toBeUndefined();
    expect(dto.pitchDate).toBeUndefined();
    expect(stripped).toHaveLength(5);
  });

  it('preserves fields the user can edit', () => {
    const dto: Record<string, unknown> = {
      title: 'Keep me',
      notes: 'I should stay',
      dateStatusId: 1,
    };

    const stripped = applyFieldLevelWritePolicy(dto, editorWithNotesEdit);

    expect(dto.notes).toBe('I should stay');
    expect(dto.dateStatusId).toBe(1);
    expect(stripped).not.toContain('notes');
    expect(stripped).toHaveLength(0);
  });

  it('returns empty array when user has all edit grants', () => {
    const dto: Record<string, unknown> = {
      notes: 'keep',
      dateStatusId: 1,
      timeStatusId: 1,
    };

    const stripped = applyFieldLevelWritePolicy(dto, adminWithAll);

    expect(dto.notes).toBe('keep');
    expect(dto.dateStatusId).toBe(1);
    expect(stripped).toHaveLength(0);
  });

  it('does not strip fields that are not in the dto and returns no scopes when nothing was removed', () => {
    const dto: Record<string, unknown> = { title: 'Only title' };

    const stripped = applyFieldLevelWritePolicy(dto, viewerNoGrants);

    expect(dto.title).toBe('Only title');
    expect(stripped).toHaveLength(0);
  });
});
