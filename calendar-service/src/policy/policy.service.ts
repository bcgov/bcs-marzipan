import { BadRequestException, Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';

import {
  activities,
  activityCommsContacts,
  activityStatuses,
  permissions,
  rolePermissions,
  roles,
  teamPermissions,
  teams,
  userPermissions,
  users,
  userTeams,
  type UserPermissionEffect,
} from '@corpcal/database/schema';
import { ROLES_BYPASS_DATA_SCOPING } from '@corpcal/shared';

import type { DrizzleDbExecutor } from '../database/database.provider';
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
   * Load active per-user permission overrides (grants and denials).
   * Overrides are exceptions to role inheritance; see getEffectivePermissionsForUser.
   */
  async getUserPermissionOverrides(
    userId: number,
    executor?: DrizzleDbExecutor
  ): Promise<
    {
      key: string;
      displayName: string;
      effect: UserPermissionEffect;
    }[]
  > {
    const db = executor ?? this.databaseService.db;
    const rows = await db
      .select({
        key: permissions.key,
        displayName: permissions.displayName,
        effect: userPermissions.effect,
      })
      .from(userPermissions)
      .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
      .where(
        and(
          eq(userPermissions.userId, userId),
          eq(userPermissions.isActive, true)
        )
      )
      .orderBy(permissions.sortOrder);

    return rows.map((r) => ({
      key: r.key,
      displayName: r.displayName,
      effect: r.effect as UserPermissionEffect,
    }));
  }

  /**
   * Permissions admins may grant or deny for an individual user.
   * `system.*` keys are excluded defensively even if flagged in the database.
   */
  async getOverridablePermissions(executor?: DrizzleDbExecutor): Promise<
    {
      id: number;
      key: string;
      displayName: string;
      description: string | null;
    }[]
  > {
    const db = executor ?? this.databaseService.db;
    const rows = await db
      .select({
        id: permissions.id,
        key: permissions.key,
        displayName: permissions.displayName,
        description: permissions.description,
      })
      .from(permissions)
      .where(eq(permissions.allowUserOverride, true))
      .orderBy(permissions.sortOrder);

    return rows.filter((r) => !r.key.startsWith('system.'));
  }

  /**
   * Reject permission keys that are not flagged allow_user_override (or under `system.`).
   * Call before mutating user rows so invalid payloads fail without partial writes.
   * Returns the key->id map so callers can reuse it instead of re-querying.
   */
  async validateUserPermissionOverrideKeys(
    requested: { permissionKey: string }[],
    executor?: DrizzleDbExecutor
  ): Promise<Map<string, number>> {
    if (requested.length === 0) return new Map();

    const overridable = await this.getOverridablePermissions(executor);
    const idByKey = new Map(overridable.map((p) => [p.key, p.id]));

    const invalidKeys = requested
      .map((r) => r.permissionKey)
      .filter((key) => !idByKey.has(key));
    if (invalidKeys.length > 0) {
      throw new BadRequestException(
        `These permissions cannot be set per user: ${invalidKeys.join(', ')}`
      );
    }

    return idByKey;
  }

  /**
   * Replace a user's permission overrides with the supplied set.
   * Keys not flagged allow_user_override (or under `system.`) are rejected.
   * Returns the applied changes so callers can write an audit trail.
   */
  async syncUserPermissionOverrides(
    userId: number,
    requested: { permissionKey: string; effect: UserPermissionEffect | null }[],
    actorUserId: number,
    executor?: DrizzleDbExecutor
  ): Promise<
    {
      permissionKey: string;
      oldValue: UserPermissionEffect | null;
      newValue: UserPermissionEffect | null;
    }[]
  > {
    if (requested.length === 0) return [];

    const idByKey = await this.validateUserPermissionOverrideKeys(
      requested,
      executor
    );

    const existing = await this.getUserPermissionOverrides(userId, executor);
    const existingByKey = new Map(existing.map((o) => [o.key, o.effect]));

    const changes: {
      permissionKey: string;
      oldValue: UserPermissionEffect | null;
      newValue: UserPermissionEffect | null;
    }[] = [];
    const pendingWrites: {
      permissionKey: string;
      permissionId: number;
      oldValue: UserPermissionEffect | null;
      newValue: UserPermissionEffect | null;
    }[] = [];

    for (const item of requested) {
      const permissionId = idByKey.get(item.permissionKey);
      if (permissionId === undefined) continue;

      const oldValue = existingByKey.get(item.permissionKey) ?? null;
      if (oldValue === item.effect) continue;

      pendingWrites.push({
        permissionKey: item.permissionKey,
        permissionId,
        oldValue,
        newValue: item.effect,
      });
    }

    if (pendingWrites.length === 0) return [];

    const now = new Date();

    const applyWrites = async (tx: DrizzleDbExecutor): Promise<void> => {
      for (const item of pendingWrites) {
        if (item.newValue === null) {
          await tx
            .delete(userPermissions)
            .where(
              and(
                eq(userPermissions.userId, userId),
                eq(userPermissions.permissionId, item.permissionId)
              )
            );
        } else {
          await tx
            .insert(userPermissions)
            .values({
              userId,
              permissionId: item.permissionId,
              effect: item.newValue,
              isActive: true,
              createdBy: actorUserId,
              updatedBy: actorUserId,
            })
            .onConflictDoUpdate({
              target: [userPermissions.userId, userPermissions.permissionId],
              set: {
                effect: item.newValue,
                isActive: true,
                updatedAt: now,
                updatedBy: actorUserId,
              },
            });
        }

        changes.push({
          permissionKey: item.permissionKey,
          oldValue: item.oldValue,
          newValue: item.newValue,
        });
      }
    };

    if (executor) {
      await applyWrites(executor);
    } else {
      await this.databaseService.db.transaction(applyWrites);
    }

    return changes;
  }

  /**
   * Load active team IDs for a user (from user_teams where isActive = true).
   * Used for authorization/scoping decisions. Only active memberships grant access.
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
   * Effective permissions and bypass for a user.
   * Sources are unioned (user role + all team roles + team_permissions + user grants),
   * then per-user denials are subtracted. An explicit deny beats a grant from any source.
   * Overrides tune permission keys only; bypass still derives from role names.
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
    const [userPerms, teamPerms, userRoleName, overrides] = await Promise.all([
      this.getPermissionsForRole(userRoleId),
      this.getPermissionsForTeams(teamIds),
      this.getRoleName(userRoleId),
      this.getUserPermissionOverrides(userId),
    ]);

    const granted = overrides
      .filter((o) => o.effect === 'grant')
      .map((o) => o.key);
    const denied = new Set(
      overrides.filter((o) => o.effect === 'deny').map((o) => o.key)
    );

    const permissions = [
      ...new Set<string>([...userPerms, ...teamPerms, ...granted]),
    ].filter((key) => !denied.has(key));

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

  /**
   * Get the activity status name for an activity (e.g. 'deleted', 'delete_requested').
   * Used by CanRestoreActivityGuard to branch on status for permission checks.
   */
  async getActivityStatusNameForActivity(
    activityId: number
  ): Promise<string | null> {
    const [row] = await this.databaseService.db
      .select({ name: activityStatuses.name })
      .from(activities)
      .innerJoin(
        activityStatuses,
        eq(activities.activityStatusId, activityStatuses.id)
      )
      .where(eq(activities.id, activityId))
      .limit(1);

    return row?.name ?? null;
  }
}
