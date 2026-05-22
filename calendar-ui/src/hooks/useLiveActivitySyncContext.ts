import { useContext } from 'react';

import {
  LiveActivitySyncContext,
  type LiveActivitySyncContextValue,
} from '@/contexts/LiveActivitySyncContext.context';

/**
 * Reads shared live activity sync state from {@link LiveActivitySyncProvider}.
 */
export function useLiveActivitySyncContext(): LiveActivitySyncContextValue {
  const context = useContext(LiveActivitySyncContext);
  if (!context) {
    throw new Error(
      'useLiveActivitySyncContext must be used within LiveActivitySyncProvider'
    );
  }
  return context;
}
