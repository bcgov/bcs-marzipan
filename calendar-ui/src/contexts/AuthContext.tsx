/**
 * Authentication Provider
 * Manages auth state with httpOnly cookie-based JWT authentication.
 * Token is stored in httpOnly cookie by backend, not accessible to JavaScript.
 */
import { useState, useEffect, useCallback, type ReactNode } from 'react';
import * as authApi from '../api/authApi';
import { AuthContext } from './AuthContext.context';
import type { AuthContextType } from './AuthContext.context';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Refresh user by calling GET /auth/me
   * Uses httpOnly cookie automatically sent by browser
   */
  const refreshUser = useCallback(async () => {
    try {
      const userData = await authApi.getCurrentUser();
      setUser(userData);
    } catch {
      // No valid session - user is not authenticated
      setUser(null);
    }
  }, []);

  /**
   * Initialize auth state on mount
   * Checks if there's a valid session via httpOnly cookie
   */
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        await refreshUser();
      } finally {
        setIsLoading(false);
      }
    };
    void initAuth();
  }, [refreshUser]);

  /**
   * Login with username and optional password
   * Backend sets httpOnly cookie on success
   */
  const login = useCallback(async (username: string, password?: string) => {
    const response = await authApi.login({ username, password });
    setUser(response.user);
  }, []);

  /**
   * Logout - backend clears httpOnly cookie
   */
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  /**
   * Check if user has a specific permission
   */
  const hasPermission = useCallback(
    (permissionKey: string): boolean => {
      return user?.permissions?.includes(permissionKey) ?? false;
    },
    [user]
  );

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = useCallback(
    (...permissionKeys: string[]): boolean => {
      if (!user?.permissions) return false;
      return permissionKeys.some((key) => user.permissions.includes(key));
    },
    [user]
  );

  /**
   * Check if user has all of the specified permissions
   */
  const hasAllPermissions = useCallback(
    (...permissionKeys: string[]): boolean => {
      if (!user?.permissions) return false;
      return permissionKeys.every((key) => user.permissions.includes(key));
    },
    [user]
  );

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
