/**
 * Authentication Context
 * Manages auth state with httpOnly cookie-based JWT authentication.
 * Token is stored in httpOnly cookie by backend, not accessible to JavaScript.
 */
import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import type { AuthUser, PermissionKey } from '@corpcal/shared';

import * as authApi from '../api/authApi';

export const LOGIN_MODAL_SESSION_KEY = 'corpcal_show_login_modal';

export interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  pendingLoginModal: boolean;
  login: (username: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  dismissLoginModal: () => void;
  hasPermission: (permissionKey: PermissionKey) => boolean;
  hasAnyPermission: (...permissionKeys: PermissionKey[]) => boolean;
  hasAllPermissions: (...permissionKeys: PermissionKey[]) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingLoginModal, setPendingLoginModal] = useState(
    () => sessionStorage.getItem(LOGIN_MODAL_SESSION_KEY) === '1'
  );

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
        // Detect Azure SSO post-login redirect (?login=1) and set the modal flag
        const params = new URLSearchParams(window.location.search);
        if (params.get('login') === '1') {
          sessionStorage.setItem(LOGIN_MODAL_SESSION_KEY, '1');
          setPendingLoginModal(true);
          params.delete('login');
          const newSearch = params.toString();
          const newUrl =
            window.location.pathname +
            (newSearch ? `?${newSearch}` : '') +
            window.location.hash;
          history.replaceState(null, '', newUrl);
        }
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
    sessionStorage.setItem(LOGIN_MODAL_SESSION_KEY, '1');
    setPendingLoginModal(true);
    setUser(response.user);
  }, []);

  /**
   * Logout - backend clears httpOnly cookie
   */
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      sessionStorage.removeItem(LOGIN_MODAL_SESSION_KEY);
      setPendingLoginModal(false);
      setUser(null);
    }
  }, []);

  const dismissLoginModal = useCallback(() => {
    sessionStorage.removeItem(LOGIN_MODAL_SESSION_KEY);
    setPendingLoginModal(false);
  }, []);

  /**
   * Check if user has a specific permission
   */
  const hasPermission = useCallback(
    (permissionKey: PermissionKey): boolean => {
      return user?.permissions?.includes(permissionKey) ?? false;
    },
    [user]
  );

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = useCallback(
    (...permissionKeys: PermissionKey[]): boolean => {
      if (!user?.permissions) return false;
      return permissionKeys.some((key) => user.permissions.includes(key));
    },
    [user]
  );

  /**
   * Check if user has all of the specified permissions
   */
  const hasAllPermissions = useCallback(
    (...permissionKeys: PermissionKey[]): boolean => {
      if (!user?.permissions) return false;
      return permissionKeys.every((key) => user.permissions.includes(key));
    },
    [user]
  );

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    pendingLoginModal,
    login,
    logout,
    refreshUser,
    dismissLoginModal,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
