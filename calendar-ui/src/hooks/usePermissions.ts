/**
 * Permission checking hooks
 * Convenience hooks for checking user permissions
 */
import type { PermissionKey } from '@corpcal/shared';
import { useAuth } from './useAuth';

/**
 * Check if user has a specific permission
 * @param permissionKey - The permission key to check (e.g., 'activities.create')
 * @returns true if user has the permission
 */
export function usePermission(permissionKey: PermissionKey): boolean {
  const { hasPermission } = useAuth();
  return hasPermission(permissionKey);
}

/**
 * Check if user has any of the specified permissions
 * @param permissionKeys - Permission keys to check
 * @returns true if user has at least one of the permissions
 */
export function useAnyPermission(...permissionKeys: PermissionKey[]): boolean {
  const { hasAnyPermission } = useAuth();
  return hasAnyPermission(...permissionKeys);
}

/**
 * Check if user has all of the specified permissions
 * @param permissionKeys - Permission keys to check
 * @returns true if user has all of the permissions
 */
export function useAllPermissions(...permissionKeys: PermissionKey[]): boolean {
  const { hasAllPermissions } = useAuth();
  return hasAllPermissions(...permissionKeys);
}
