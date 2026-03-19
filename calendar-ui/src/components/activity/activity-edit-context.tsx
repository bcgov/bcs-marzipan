/**
 * Inline Edit Pattern for Activity Forms
 *
 * The activity form is always interactive -- controls must NOT use `disabled`
 * for edit-gating. The edit lock is acquired optimistically on the first value
 * change detected by `form.watch()` in ActivityPage.
 *
 * `readOnly` from this context is `true` only when another user holds the
 * edit lock (`lockState === 'locked-by-other'`). Use it to prevent
 * interaction in that case.
 *
 * For new fields: add the field normally with no special disabled/readOnly
 * wiring. If you need to disable a field for a business rule (e.g. venue
 * fields disabled when "Venue TBD" is checked), use a local `disabled` prop
 * unrelated to edit state.
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
