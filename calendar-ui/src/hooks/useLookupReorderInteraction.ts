import { useCallback, useState } from 'react';

import {
  readLookupReorderInteraction,
  writeLookupReorderInteraction,
  type LookupReorderInteraction,
} from '@/lib/lookupReorderUiPreferences';

/** Reads and writes localStorage-backed lookup reorder UI mode (drag vs step). */
export function useLookupReorderInteraction(): [
  LookupReorderInteraction,
  (mode: LookupReorderInteraction) => void,
] {
  const [interaction, setInteractionState] = useState<LookupReorderInteraction>(
    () =>
      typeof window === 'undefined' ? 'step' : readLookupReorderInteraction()
  );

  const setInteraction = useCallback((mode: LookupReorderInteraction) => {
    setInteractionState(mode);
    writeLookupReorderInteraction(mode);
  }, []);

  return [interaction, setInteraction];
}
