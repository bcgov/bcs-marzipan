import { useCallback, useState } from 'react';

import {
  DEFAULT_ACTIVITY_GRID_LAYOUT_PREFERENCES,
  readActivityGridLayoutPreferences,
  writeActivityGridLayoutPreferences,
  type ActivityGridLayoutPreferences,
} from '@/lib/activityTableLayoutPreferences';

export interface UseActivityGridLayoutPreferencesResult {
  getColumnOrder: () => string[];
  setColumnOrder: (order: string[]) => void;
  getColumnSizing: () => Record<string, number>;
  setColumnSizing: (sizing: Record<string, number>) => void;
}

/** Reads and writes sessionStorage-backed Grid A column order and widths. */
export function useActivityGridLayoutPreferences(): UseActivityGridLayoutPreferencesResult {
  const [preferences, setPreferencesState] =
    useState<ActivityGridLayoutPreferences>(() =>
      typeof window === 'undefined'
        ? DEFAULT_ACTIVITY_GRID_LAYOUT_PREFERENCES
        : readActivityGridLayoutPreferences()
    );

  const updatePreferences = useCallback(
    (
      updater: (
        current: ActivityGridLayoutPreferences
      ) => ActivityGridLayoutPreferences
    ) => {
      setPreferencesState((current) => {
        const next = updater(current);
        writeActivityGridLayoutPreferences(next);
        return next;
      });
    },
    []
  );

  const setColumnOrder = useCallback(
    (order: string[]) => {
      updatePreferences((current) => ({ ...current, columnOrder: order }));
    },
    [updatePreferences]
  );

  const setColumnSizing = useCallback(
    (sizing: Record<string, number>) => {
      updatePreferences((current) => ({ ...current, columnSizing: sizing }));
    },
    [updatePreferences]
  );

  const getColumnOrder = useCallback(
    () => preferences.columnOrder,
    [preferences.columnOrder]
  );

  const getColumnSizing = useCallback(
    () => preferences.columnSizing,
    [preferences.columnSizing]
  );

  return {
    getColumnOrder,
    setColumnOrder,
    getColumnSizing,
    setColumnSizing,
  };
}
