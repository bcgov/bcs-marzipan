/**
 * Authentication hook
 * Provides access to auth context and permission checking utilities
 */
import { useContext } from 'react';

import { AuthContext, type AuthContextType } from '../contexts/AuthContext';

/**
 * Hook to access authentication state and methods
 * @throws Error if used outside of AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
