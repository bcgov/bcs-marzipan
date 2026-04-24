import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';

import {
  ministries,
  permissions,
  rolePermissions,
  teamHistory,
  teams,
  users,
  userTeams,
} from '@corpcal/database/schema';
import type {
  CommsContactCandidate,
  CreateTeamBody,
  HistoryChange,
  TeamDetail,
  TeamHistoryEntry,
  TeamListItem,
  UpdateTeamBody,
} from '@corpcal/shared/api/types';

import { DatabaseService } from '../database/database.service';

@Injectable()
export class TeamsService {
  constructor(private readonly databaseService: DatabaseService) {}

  private async recordTeamHistory(
    teamId: number,
    changedByUserId: number,
    actionType: 'created' | 'updated',
    changes?: HistoryChange[],
    notes?: string | null
  ): Promise<void> {
    await this.databaseService.db.insert(teamHistory).values({
      teamId,
      changedByUserId,
      actionType,
      changes: changes ?? null,
      notes: notes ?? null,
    });
  }

  /**
   * Teams the current user can choose as lead team when creating/editing an activity.
   * Without activities.create.any: only the user's teams. With it: all active teams (so any activity's lead team can be displayed and selected).
   */
  async findLeadOptions(
    userTeamIds: number[],
    hasCreateAny: boolean
  ): Promise<TeamListItem[]> {
    let teamIds: number[];
    if (hasCreateAny) {
      const rows = await this.databaseService.db
        .select({ id: teams.id })
        .from(teams)
        .where(eq(teams.isActive, true));
      teamIds = rows.map((r) => r.id);
    } else {
      if (userTeamIds.length === 0) return [];
      teamIds = userTeamIds;
    }
    if (teamIds.length === 0) return [];
    return this.findManyByIds(teamIds);
  }

  /**
   * Active members of a team whose role grants `activities.edit`.
   * Shared by comms candidate list and eligible-id set.
   */
  private async fetchCommsEligibleUsersForTeam(teamId: number): Promise<
    Array<{
      id: number;
      adDisplayName: string | null;
      adUsername: string | null;
    }>
  > {
    return this.databaseService.db
      .select({
        id: users.id,
        adDisplayName: users.adDisplayName,
        adUsername: users.adUsername,
      })
      .from(userTeams)
      .innerJoin(users, eq(users.id, userTeams.userId))
      .innerJoin(
        rolePermissions,
        and(
          eq(rolePermissions.roleId, users.roleId),
          eq(rolePermissions.isActive, true)
        )
      )
      .innerJoin(
        permissions,
        and(
          eq(permissions.id, rolePermissions.permissionId),
          eq(permissions.key, 'activities.edit')
        )
      )
      .where(
        and(
          eq(userTeams.teamId, teamId),
          eq(userTeams.isActive, true),
          eq(users.isActive, true)
        )
      );
  }

  /**
   * Active members of a team whose role grants activities.edit.
   * Used to populate the Comms contacts dropdown.
   */
  async findCommsContactCandidates(
    teamId: number,
    callerTeamIds: number[],
    hasCreateAny: boolean
  ): Promise<CommsContactCandidate[]> {
    if (!hasCreateAny && !callerTeamIds.includes(teamId)) {
      throw new ForbiddenException(
        'You may only view comms contact candidates for teams you belong to.'
      );
    }

    const rows = await this.fetchCommsEligibleUsersForTeam(teamId);
    const sorted = [...rows].sort((a, b) => {
      const sa = a.adDisplayName ?? a.adUsername ?? '';
      const sb = b.adDisplayName ?? b.adUsername ?? '';
      const byName = sa.localeCompare(sb, undefined, { sensitivity: 'base' });
      if (byName !== 0) return byName;
      return a.id - b.id;
    });

    return sorted.map((u) => {
      const label = u.adDisplayName ?? u.adUsername ?? `User ${u.id}`;
      return { id: u.id, label, value: u.id };
    });
  }

  /**
   * Returns the set of user IDs that are eligible comms contacts for the given team
   * (active team member + role grants activities.edit).
   */
  async getEligibleCommsUserIds(teamId: number): Promise<Set<number>> {
    const rows = await this.fetchCommsEligibleUsersForTeam(teamId);
    return new Set(rows.map((r) => r.id));
  }

  private async findManyByIds(teamIds: number[]): Promise<TeamListItem[]> {
    const teamRows = await this.databaseService.db
      .select({
        id: teams.id,
        name: teams.name,
        displayName: teams.displayName,
        abbreviation: teams.abbreviation,
        description: teams.description,
        sortOrder: teams.sortOrder,
        isActive: teams.isActive,
        roleId: teams.roleId,
        ministryId: teams.ministryId,
      })
      .from(teams)
      .where(and(inArray(teams.id, teamIds), eq(teams.isActive, true)))
      .orderBy(asc(teams.sortOrder), teams.name);

    const memberCounts = await this.databaseService.db
      .select({
        teamId: userTeams.teamId,
        count: sql<number>`count(*)::int`,
      })
      .from(userTeams)
      .where(
        and(inArray(userTeams.teamId, teamIds), eq(userTeams.isActive, true))
      )
      .groupBy(userTeams.teamId);
    const memberMap = new Map(memberCounts.map((m) => [m.teamId, m.count]));

    const ministryIds = [
      ...new Set(
        teamRows
          .map((t) => t.ministryId)
          .filter((id): id is number => id != null)
      ),
    ];
    const ministryNameRows =
      ministryIds.length > 0
        ? await this.databaseService.db
            .select({
              id: ministries.id,
              displayName: ministries.displayName,
            })
            .from(ministries)
            .where(inArray(ministries.id, ministryIds))
        : [];
    const ministryMap = new Map(
      ministryNameRows.map((m) => [m.id, m.displayName])
    );

    return teamRows.map((t) => ({
      ...t,
      memberCount: memberMap.get(t.id) ?? 0,
      ministryName:
        t.ministryId != null ? (ministryMap.get(t.ministryId) ?? null) : null,
    }));
  }

  async findAll(activeOnly = true): Promise<TeamListItem[]> {
    const teamRows = await this.databaseService.db
      .select({
        id: teams.id,
        name: teams.name,
        displayName: teams.displayName,
        abbreviation: teams.abbreviation,
        description: teams.description,
        sortOrder: teams.sortOrder,
        isActive: teams.isActive,
        roleId: teams.roleId,
        ministryId: teams.ministryId,
      })
      .from(teams)
      .where(activeOnly ? eq(teams.isActive, true) : undefined)
      .orderBy(asc(teams.sortOrder), teams.name);

    const teamIds = teamRows.map((t) => t.id);
    if (teamIds.length === 0) return [];

    const memberCounts = await this.databaseService.db
      .select({
        teamId: userTeams.teamId,
        count: sql<number>`count(*)::int`,
      })
      .from(userTeams)
      .where(
        and(inArray(userTeams.teamId, teamIds), eq(userTeams.isActive, true))
      )
      .groupBy(userTeams.teamId);

    const memberMap = new Map(memberCounts.map((m) => [m.teamId, m.count]));

    const ministryIds = [
      ...new Set(
        teamRows
          .map((t) => t.ministryId)
          .filter((id): id is number => id != null)
      ),
    ];
    const ministryNameRows =
      ministryIds.length > 0
        ? await this.databaseService.db
            .select({
              id: ministries.id,
              displayName: ministries.displayName,
            })
            .from(ministries)
            .where(inArray(ministries.id, ministryIds))
        : [];
    const ministryMap = new Map(
      ministryNameRows.map((m) => [m.id, m.displayName])
    );

    return teamRows.map((t) => ({
      ...t,
      memberCount: memberMap.get(t.id) ?? 0,
      ministryName:
        t.ministryId != null ? (ministryMap.get(t.ministryId) ?? null) : null,
    }));
  }

  async findOne(id: number): Promise<TeamDetail | null> {
    const [t] = await this.databaseService.db
      .select({
        id: teams.id,
        name: teams.name,
        displayName: teams.displayName,
        abbreviation: teams.abbreviation,
        description: teams.description,
        sortOrder: teams.sortOrder,
        isActive: teams.isActive,
        roleId: teams.roleId,
        ministryId: teams.ministryId,
      })
      .from(teams)
      .where(eq(teams.id, id))
      .limit(1);

    if (!t) return null;

    const memberRows = await this.databaseService.db
      .select({
        userId: userTeams.userId,
        role: userTeams.role,
      })
      .from(userTeams)
      .where(and(eq(userTeams.teamId, id), eq(userTeams.isActive, true)));

    const userIds = memberRows.map((m) => m.userId);

    const userRows =
      userIds.length > 0
        ? await this.databaseService.db
            .select({
              id: users.id,
              adDisplayName: users.adDisplayName,
              adUsername: users.adUsername,
            })
            .from(users)
            .where(inArray(users.id, userIds))
        : [];
    const userMap = new Map(
      userRows.map((u) => [
        u.id,
        u.adDisplayName || u.adUsername || `User ${u.id}`,
      ])
    );

    let ministryName: string | null = null;
    if (t.ministryId != null) {
      const [m] = await this.databaseService.db
        .select({ displayName: ministries.displayName })
        .from(ministries)
        .where(eq(ministries.id, t.ministryId))
        .limit(1);
      ministryName = m?.displayName ?? null;
    }

    return {
      ...t,
      ministryName,
      memberCount: memberRows.length,
      members: memberRows.map((m) => ({
        userId: m.userId,
        userName: userMap.get(m.userId) ?? `User ${m.userId}`,
        role: m.role,
      })),
    };
  }

  async create(dto: CreateTeamBody, createdBy: number): Promise<TeamDetail> {
    const [inserted] = await this.databaseService.db
      .insert(teams)
      .values({
        name: dto.name,
        abbreviation: dto.abbreviation,
        displayName: dto.displayName ?? null,
        description: dto.description ?? null,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
        roleId: dto.roleId ?? null,
        ministryId: dto.ministryId ?? null,
        createdBy,
        lastUpdatedBy: createdBy,
      })
      .returning();

    const changes: HistoryChange[] = [];
    if (dto.ministryId != null) {
      changes.push({
        field: 'ministryId',
        oldValue: null,
        newValue: dto.ministryId,
      });
    }
    await this.recordTeamHistory(
      inserted.id,
      createdBy,
      'created',
      changes.length > 0 ? changes : undefined,
      dto.notes ?? null
    );

    const detail = await this.findOne(inserted.id);
    if (!detail) throw new NotFoundException('Team not found after create');
    return detail;
  }

  async update(
    id: number,
    dto: UpdateTeamBody,
    lastUpdatedBy: number
  ): Promise<TeamDetail> {
    const existing = await this.findOne(id);
    if (!existing) throw new NotFoundException('Team not found');

    const updates: Partial<typeof teams.$inferInsert> = {};
    if (dto.name !== undefined) updates.name = dto.name;
    if (dto.abbreviation !== undefined) updates.abbreviation = dto.abbreviation;
    if (dto.displayName !== undefined) updates.displayName = dto.displayName;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.sortOrder !== undefined) updates.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) updates.isActive = dto.isActive;
    if (dto.roleId !== undefined) updates.roleId = dto.roleId;
    if (dto.ministryId !== undefined)
      updates.ministryId = dto.ministryId ?? null;

    if (Object.keys(updates).length > 0) {
      updates.lastUpdatedBy = lastUpdatedBy;
      updates.lastUpdatedDateTime = new Date();
      await this.databaseService.db
        .update(teams)
        .set(updates)
        .where(eq(teams.id, id));
    }

    const changes: HistoryChange[] = [];
    if (dto.name !== undefined && dto.name !== existing.name) {
      changes.push({
        field: 'name',
        oldValue: existing.name,
        newValue: dto.name,
      });
    }
    if (
      dto.abbreviation !== undefined &&
      dto.abbreviation !== existing.abbreviation
    ) {
      changes.push({
        field: 'abbreviation',
        oldValue: existing.abbreviation,
        newValue: dto.abbreviation,
      });
    }
    if (
      dto.displayName !== undefined &&
      dto.displayName !== existing.displayName
    ) {
      changes.push({
        field: 'displayName',
        oldValue: existing.displayName,
        newValue: dto.displayName,
      });
    }
    if (
      dto.description !== undefined &&
      dto.description !== existing.description
    ) {
      changes.push({
        field: 'description',
        oldValue: existing.description,
        newValue: dto.description,
      });
    }
    if (dto.sortOrder !== undefined && dto.sortOrder !== existing.sortOrder) {
      changes.push({
        field: 'sortOrder',
        oldValue: existing.sortOrder,
        newValue: dto.sortOrder,
      });
    }
    if (dto.isActive !== undefined && dto.isActive !== existing.isActive) {
      changes.push({
        field: 'isActive',
        oldValue: existing.isActive,
        newValue: dto.isActive,
      });
    }
    if (
      dto.roleId !== undefined &&
      dto.roleId !== existing.roleId &&
      (dto.roleId ?? null) !== (existing.roleId ?? null)
    ) {
      changes.push({
        field: 'roleId',
        oldValue: existing.roleId ?? null,
        newValue: dto.roleId ?? null,
      });
    }
    if (
      dto.ministryId !== undefined &&
      (dto.ministryId ?? null) !== (existing.ministryId ?? null)
    ) {
      changes.push({
        field: 'ministryId',
        oldValue: existing.ministryId ?? null,
        newValue: dto.ministryId ?? null,
      });
    }

    if (changes.length > 0) {
      await this.recordTeamHistory(
        id,
        lastUpdatedBy,
        'updated',
        changes,
        dto.notes ?? null
      );
    }

    const updated = await this.findOne(id);
    if (!updated) throw new NotFoundException('Team not found');
    return updated;
  }

  async getTeamHistory(teamId: number): Promise<TeamHistoryEntry[]> {
    const exists = await this.findOne(teamId);
    if (!exists) throw new NotFoundException('Team not found');

    const entries = await this.databaseService.db
      .select({
        id: teamHistory.id,
        teamId: teamHistory.teamId,
        changedByUserId: teamHistory.changedByUserId,
        actionType: teamHistory.actionType,
        changes: teamHistory.changes,
        notes: teamHistory.notes,
        timestamp: teamHistory.timestamp,
      })
      .from(teamHistory)
      .where(eq(teamHistory.teamId, teamId))
      .orderBy(desc(teamHistory.timestamp));

    const changerIds = [...new Set(entries.map((e) => e.changedByUserId))];
    const changerRows =
      changerIds.length > 0
        ? await this.databaseService.db
            .select({
              id: users.id,
              adDisplayName: users.adDisplayName,
              adUsername: users.adUsername,
            })
            .from(users)
            .where(inArray(users.id, changerIds))
        : [];
    const changerMap = new Map(
      changerRows.map((u) => [
        u.id,
        u.adDisplayName || u.adUsername || `User ${u.id}`,
      ])
    );

    return entries.map((e) => ({
      id: e.id,
      teamId: e.teamId,
      changedByUserId: e.changedByUserId,
      actionType: e.actionType,
      changes: (e.changes as TeamHistoryEntry['changes']) ?? null,
      notes: e.notes,
      timestamp:
        e.timestamp instanceof Date
          ? e.timestamp.toISOString()
          : String(e.timestamp),
      changedByUserName: changerMap.get(e.changedByUserId),
    }));
  }
}
