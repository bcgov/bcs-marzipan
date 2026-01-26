import { Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import {
  rolePermissions,
  permissions,
  roles,
  userTeams,
} from '@corpcal/database/schema';
import { DatabaseService } from '../database/database.service';
import { SYSTEM_ROLES } from '@corpcal/shared';

@Injectable()
export class PolicyService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Load enabled permission keys for a role
   */
  async getPermissionsForRole(roleId: number): Promise<string[]> {
    const rows = await this.databaseService.db
      .select({ key: permissions.key })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(
        and(
          eq(rolePermissions.roleId, roleId),
          eq(rolePermissions.isActive, true)
        )
      );

    return rows.map((r) => r.key);
  }

  /**
   * Load team IDs for a user (from user_teams)
   */
  async getTeamIdsForUser(userId: number): Promise<number[]> {
    const rows = await this.databaseService.db
      .select({ teamId: userTeams.teamId })
      .from(userTeams)
      .where(and(eq(userTeams.userId, userId), eq(userTeams.isActive, true)));

    return rows.map((r) => r.teamId);
  }

  /**
   * Get role name by role id
   */
  async getRoleName(roleId: number): Promise<string | null> {
    const [row] = await this.databaseService.db
      .select({ name: roles.name })
      .from(roles)
      .where(eq(roles.id, roleId))
      .limit(1);

    return row?.name ?? null;
  }

  /**
   * Check if a role bypasses team-based data scoping (Advanced, Admin, System Admin)
   */
  bypassesDataScoping(roleName: string): boolean {
    return (
      roleName === SYSTEM_ROLES.ADVANCED ||
      roleName === SYSTEM_ROLES.ADMIN ||
      roleName === SYSTEM_ROLES.SYSTEM_ADMIN
    );
  }

  /**
   * Check if user has a specific permission (sync; assumes permissions array is already loaded)
   */
  hasPermission(userPermissions: string[], permissionKey: string): boolean {
    return userPermissions.includes(permissionKey);
  }

  /**
   * Check if user has any of the given permissions
   */
  hasAnyPermission(
    userPermissions: string[],
    permissionKeys: string[]
  ): boolean {
    if (permissionKeys.length === 0) return true;
    return permissionKeys.some((key) => userPermissions.includes(key));
  }

  /**
   * Check if user has all of the given permissions
   */
  hasAllPermissions(
    userPermissions: string[],
    permissionKeys: string[]
  ): boolean {
    return permissionKeys.every((key) => userPermissions.includes(key));
  }
}
