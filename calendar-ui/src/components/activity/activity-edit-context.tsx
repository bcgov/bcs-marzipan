import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';

export type ActivityEditContextValue = {
  isEditing: boolean;
  readOnly: boolean;
  fieldToActivate: string | null;
  clearFieldToActivate: () => void;
};

const noop = () => {};

const defaultValue: ActivityEditContextValue = {
  isEditing: false,
  readOnly: true,
  fieldToActivate: null,
  clearFieldToActivate: noop,
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

/**
 * Returns true once when fieldToActivate matches, then auto-clears.
 * Components that need to open a popover/select after click-to-edit consume this.
 */
export function useFieldActivation(
  fieldName: string,
  onActivate: () => void,
  options?: { enabled?: boolean }
): void {
  const { isEditing, readOnly, fieldToActivate, clearFieldToActivate } =
    useActivityEdit();
  const enabled = options?.enabled ?? true;
  const onActivateRef = useRef(onActivate);
  onActivateRef.current = onActivate;

  useEffect(() => {
    if (!enabled || !isEditing || readOnly) return;
    if (fieldToActivate !== fieldName) return;
    onActivateRef.current();
    clearFieldToActivate();
  }, [
    fieldName,
    fieldToActivate,
    isEditing,
    readOnly,
    enabled,
    clearFieldToActivate,
  ]);
}
