import { createContext } from 'react';

export interface LiveActivitySyncContextValue {
  isSocketConnected: boolean;
}

export const LiveActivitySyncContext = createContext<
  LiveActivitySyncContextValue | undefined
>(undefined);
