import type { ReactNode } from 'react';

import { useLiveActivitySync } from '@/hooks/useLiveActivitySync';

import {
  LiveActivitySyncContext,
  type LiveActivitySyncContextValue,
} from './LiveActivitySyncContext.context';

interface LiveActivitySyncProviderProps {
  children: ReactNode;
}

/**
 * Single app-shell Socket.IO subscriber for activity table + report refresh.
 * Mount once under authenticated layout so routes share one connection.
 */
export function LiveActivitySyncProvider({
  children,
}: LiveActivitySyncProviderProps) {
  const { isSocketConnected } = useLiveActivitySync();

  const value: LiveActivitySyncContextValue = { isSocketConnected };

  return (
    <LiveActivitySyncContext.Provider value={value}>
      {children}
    </LiveActivitySyncContext.Provider>
  );
}
