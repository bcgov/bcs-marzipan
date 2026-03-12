/**
 * Permission-based conditional rendering components
 * Use to show/hide UI elements based on user permissions
 */
import type { ReactNode } from 'react';

import type { PermissionKey } from '@corpcal/shared';
import { useAnyPermission, usePermission } from '@/hooks/usePermissions';

interface PermissionGateProps {
  /** Permission key to check (e.g., 'activities.create') */
  permission: PermissionKey;
  /** Content to render if user has permission */
  children: ReactNode;
  /** Optional content to render if user lacks permission */
  fallback?: ReactNode;
}

/**
 * Conditionally render children based on a single permission
 * @example
 * <PermissionGate permission={PERMISSIONS.ACTIVITIES.DELETE}>
 *   <DeleteButton />
 * </PermissionGate>
 */
export function PermissionGate({
  permission,
  children,
  fallback = null,
}: PermissionGateProps) {
  const hasPermission = usePermission(permission);
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}

interface AnyPermissionGateProps {
  /** Permission keys to check - user needs at least one */
  permissions: PermissionKey[];
  /** Content to render if user has any permission */
  children: ReactNode;
  /** Optional content to render if user lacks all permissions */
  fallback?: ReactNode;
}

/**
 * Conditionally render children if user has ANY of the specified permissions
 * @example
 * <AnyPermissionGate permissions={[PERMISSIONS.ACTIVITIES.EDIT, PERMISSIONS.ACTIVITIES.DELETE]}>
 *   <ActionButtons />
 * </AnyPermissionGate>
 */
export function AnyPermissionGate({
  permissions,
  children,
  fallback = null,
}: AnyPermissionGateProps) {
  const hasAny = useAnyPermission(...permissions);
  return hasAny ? <>{children}</> : <>{fallback}</>;
}
