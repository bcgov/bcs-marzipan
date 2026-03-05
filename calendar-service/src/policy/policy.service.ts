import { Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';

import {
  activities,
  activityCommsContacts,
  permissions,
  rolePermissions,
  roles,
  teamPermissions,
  teams,
  users,
  userTeams,
} from '@corpcal/database/schema';
import { ROLES_BYPASS_DATA_SCOPING } from '@corpcal/shared';

import { DatabaseService } from '../database/database.service';

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
   * Load permission keys granted by the given teams (each team's role + team_permissions).
   */
  async getPermissionsForTeams(teamIds: number[]): Promise<string[]> {
    if (teamIds.length === 0) return [];

    const teamRows = await this.databaseService.db
      .select({ id: teams.id, roleId: teams.roleId })
      .from(teams)
      .where(inArray(teams.id, teamIds));

    const roleIds = [
      ...new Set(
        teamRows.map((t) => t.roleId).filter((id): id is number => id != null)
      ),
    ];

    const teamPermRows = await this.databaseService.db
      .select({ key: permissions.key })
      .from(teamPermissions)
      .innerJoin(permissions, eq(teamPermissions.permissionId, permissions.id))
      .where(
        and(
          inArray(teamPermissions.teamId, teamIds),
          eq(teamPermissions.isActive, true)
        )
      );

    const rolePermKeys = await Promise.all(
      roleIds.map((roleId) => this.getPermissionsForRole(roleId))
    );
    const flatRoleKeys = rolePermKeys.flat();
    const teamPermKeys = teamPermRows.map((r) => r.key);
    return [...new Set([...flatRoleKeys, ...teamPermKeys])];
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
   * Effective permissions and bypass for a user (user role + all team roles + team_permissions).
   */
  async getEffectivePermissionsForUser(
    userId: number
  ): Promise<{ permissions: string[]; bypass: boolean }> {
    const [userRow, teamIds] = await Promise.all([
      this.databaseService.db
        .select({ roleId: roles.id })
        .from(roles)
        .innerJoin(users, eq(users.roleId, roles.id))
        .where(eq(users.id, userId))
        .limit(1)
        .then((rows) => rows[0]),
      this.getTeamIdsForUser(userId),
    ]);

    if (!userRow) {
      return { permissions: [], bypass: false };
    }

    const userRoleId = userRow.roleId;
    const [userPerms, teamPerms, userRoleName] = await Promise.all([
      this.getPermissionsForRole(userRoleId),
      this.getPermissionsForTeams(teamIds),
      this.getRoleName(userRoleId),
    ]);

    const permissions = [...new Set<string>([...userPerms, ...teamPerms])];

    let bypass = this.bypassesDataScoping(userRoleName ?? '');

    if (!bypass && teamIds.length > 0) {
      const teamRows = await this.databaseService.db
        .select({ roleId: teams.roleId })
        .from(teams)
        .where(inArray(teams.id, teamIds));
      for (const t of teamRows) {
        if (t.roleId == null) continue;
        const teamRoleName = await this.getRoleName(t.roleId);
        if (teamRoleName && this.bypassesDataScoping(teamRoleName)) {
          bypass = true;
          break;
        }
      }
    }

    return { permissions, bypass };
  }

  /**
   * Check if a role bypasses team-based data scoping (Advanced Viewer, Advanced Editor, Admin, System Admin)
   */
  bypassesDataScoping(roleName: string): boolean {
    return ROLES_BYPASS_DATA_SCOPING.includes(roleName);
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

  /**
   * Check if the user is the comms lead for the given activity.
   * Used for delete authorization: comms lead may delete their activity.
   */
  async isCommsLeadForActivity(
    activityId: number,
    userId: number
  ): Promise<boolean> {
    const [row] = await this.databaseService.db
      .select({ userId: activityCommsContacts.userId })
      .from(activityCommsContacts)
      .where(
        and(
          eq(activityCommsContacts.activityId, activityId),
          eq(activityCommsContacts.userId, userId),
          eq(activityCommsContacts.isLead, true),
          eq(activityCommsContacts.isActive, true)
        )
      )
      .limit(1);

    return !!row;
  }

  /**
   * Check if the user is any comms contact (lead or not) for the given activity.
   * Used for request-delete and restore: only comms contacts can request delete or restore.
   */
  async isCommsContactForActivity(
    activityId: number,
    userId: number
  ): Promise<boolean> {
    const [row] = await this.databaseService.db
      .select({ userId: activityCommsContacts.userId })
      .from(activityCommsContacts)
      .where(
        and(
          eq(activityCommsContacts.activityId, activityId),
          eq(activityCommsContacts.userId, userId),
          eq(activityCommsContacts.isActive, true)
        )
      )
      .limit(1);

    return !!row;
  }

  /**
   * Get the lead team ID for an activity. Used to allow lead-team members to request delete.
   */
  async getLeadTeamIdForActivity(activityId: number): Promise<number | null> {
    const [row] = await this.databaseService.db
      .select({ leadTeamId: activities.leadTeamId })
      .from(activities)
      .where(eq(activities.id, activityId))
      .limit(1);

    return row?.leadTeamId ?? null;
  }
}
