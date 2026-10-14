import { afterEach, describe, expect, it } from 'vitest';

import {
  ACTIVITY_GRID_STORAGE_KEY,
  DEFAULT_ACTIVITY_GRID_LAYOUT_PREFERENCES,
  normalizeActivityGridLayoutPreferences,
  readActivityGridLayoutPreferences,
  reconcileColumnOrder,
  writeActivityGridLayoutPreferences,
} from './activityTableLayoutPreferences';

describe('activityTableLayoutPreferences', () => {
  afterEach(() => {
    window.sessionStorage.clear();
  });

  it('round-trips column order and sizing through sessionStorage', () => {
    const prefs = {
      columnOrder: [
        'select',
        'summary',
        'overview',
        'scheduling',
        'materials',
        'status',
      ],
      columnSizing: { summary: 420 },
    };

    writeActivityGridLayoutPreferences(prefs);
    expect(readActivityGridLayoutPreferences()).toEqual(prefs);
  });

  it('normalizes invalid stored values to defaults', () => {
    expect(
      normalizeActivityGridLayoutPreferences({
        columnOrder: [1, 2],
        columnSizing: { summary: 'wide' },
      })
    ).toEqual(DEFAULT_ACTIVITY_GRID_LAYOUT_PREFERENCES);
  });

  it('migrates legacy A/B/C variant preferences to Grid A column prefs', () => {
    expect(
      normalizeActivityGridLayoutPreferences({
        variant: 'B',
        columnOrder: {
          A: ['select', 'summary'],
          B: ['select', 'contact'],
        },
        columnSizing: {
          A: { summary: 420 },
          B: { contact: 210 },
        },
      })
    ).toEqual({
      columnOrder: ['select', 'summary'],
      columnSizing: { summary: 420 },
    });
  });

  it('reconciles stored column order with defaults', () => {
    const defaultOrder = [
      'select',
      'overview',
      'summary',
      'scheduling',
      'materials',
      'status',
    ];
    expect(reconcileColumnOrder(['summary', 'overview'], defaultOrder)).toEqual(
      ['select', 'summary', 'overview', 'scheduling', 'materials', 'status']
    );
  });

  it('returns defaults when sessionStorage is empty', () => {
    window.sessionStorage.removeItem(ACTIVITY_GRID_STORAGE_KEY);
    expect(readActivityGridLayoutPreferences()).toEqual(
      DEFAULT_ACTIVITY_GRID_LAYOUT_PREFERENCES
    );
  });
});
