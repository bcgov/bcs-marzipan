import { describe, expect, it } from 'vitest';

import {
  ACTIVITY_HISTORY_NON_TRACKED_FIELDS,
  normalizeHistoryChanges,
  normalizeHistoryFieldKey,
  redactActivityHistoryChanges,
} from './activity-history-fields';

const viewerWithoutNotes = {
  permissions: [],
  roleName: 'Viewer',
};

const editorWithNotes = {
  permissions: ['activities.notes.view'],
  roleName: 'Editor',
};

describe('activity-history-fields', () => {
  it('normalizes legacy field aliases to canonical keys', () => {
    expect(normalizeHistoryFieldKey('categories')).toBe('categoryIds');
    expect(normalizeHistoryFieldKey('tags')).toBe('tagIds');
    expect(normalizeHistoryFieldKey('sharedWith')).toBe('sharedWithTeamIds');
    expect(normalizeHistoryFieldKey('title')).toBe('title');
  });

  it('drops non-tracked audit and meta fields', () => {
    expect(normalizeHistoryFieldKey('lastUpdatedBy')).toBeNull();
    expect(normalizeHistoryFieldKey('displayId')).toBeNull();
    expect(normalizeHistoryFieldKey('clonedFromActivityId')).toBeNull();
    expect(ACTIVITY_HISTORY_NON_TRACKED_FIELDS.has('lastUpdatedBy')).toBe(true);
  });

  it('dedupes normalized changes by canonical field', () => {
    const result = normalizeHistoryChanges([
      { field: 'categories', oldValue: [1], newValue: [2] },
      { field: 'categoryIds', oldValue: [1], newValue: [3] },
      { field: 'lastUpdatedBy', oldValue: 1, newValue: 2 },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]?.field).toBe('categoryIds');
  });

  it('redacts scoped fields the user cannot view', () => {
    const changes = [
      { field: 'title', oldValue: 'A', newValue: 'B' },
      { field: 'notes', oldValue: 'secret', newValue: 'updated' },
    ];
    expect(redactActivityHistoryChanges(changes, viewerWithoutNotes)).toEqual([
      { field: 'title', oldValue: 'A', newValue: 'B' },
    ]);
    expect(redactActivityHistoryChanges(changes, editorWithNotes)).toHaveLength(
      2
    );
  });
});
