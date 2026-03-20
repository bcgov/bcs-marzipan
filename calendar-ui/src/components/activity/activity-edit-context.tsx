/**
 * Inline edit pattern for activity forms (edit page).
 *
 * On {@link ActivityPage}, users who are allowed to edit may change values
 * before holding the edit lock; the lock is acquired optimistically on the
 * first real change ({@link useEditLockIntent}).
 *
 * `readOnly` is true when:
 * - Another user holds the edit lock, or
 * - The current user may not edit this activity (API `canEdit` false, or
 *   delete-requested/deleted without permission to edit in that state), or
 * - The activity is in a blocked status and the user cannot edit in that state.
 *
 * For new fields: wire `readOnly` from {@link useActivityEdit} for standard
 * controls. Use a local `disabled` for field-specific rules (e.g. venue when
 * "Venue TBD").
 */
import { createContext, useContext, type ReactNode } from 'react';

export type ActivityEditContextValue = {
  readOnly: boolean;
};

const defaultValue: ActivityEditContextValue = {
  readOnly: false,
};

const ActivityEditContext =
  createContext<ActivityEditContextValue>(defaultValue);

export function ActivityEditProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: ActivityEditContextValue;
}): React.ReactElement {
  return (
    <ActivityEditContext.Provider value={value}>
      {children}
    </ActivityEditContext.Provider>
  );
}

export function useActivityEdit(): ActivityEditContextValue {
  return useContext(ActivityEditContext);
}
