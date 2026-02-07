/**
 * Authentication context and type.
 * Kept in a separate file so AuthProvider can live in a component-only file for Fast Refresh.
 */
import { createContext } from 'react';
import type { AuthUser } from '@corpcal/shared';

export interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (permissionKey: string) => boolean;
  hasAnyPermission: (...permissionKeys: string[]) => boolean;
  hasAllPermissions: (...permissionKeys: string[]) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
