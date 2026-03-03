/**
 * Auth and RBAC shared types
 * Used by calendar-service and calendar-ui (and future MediaHub)
 */

export interface AuthUser {
  id: number;
  username: string;
  displayName: string;
  email: string;
  roleId: number;
  roleName: string;
  permissions: string[];
  teamIds: number[];
  /** When true, user sees all activities (from user role or any team role). Set at login. */
  bypassDataScoping?: boolean;
}

export interface Permission {
  key: string;
  displayName: string;
  category: string;
  subcategory?: string;
  description?: string;
  resource?: string;
  scope?: string; // Optional: scope/context (e.g., field name, filter name, report name)
  action?: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  isSystem: boolean;
  isActive: boolean;
}
