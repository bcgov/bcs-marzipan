import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, inArray, ne, sql } from 'drizzle-orm';

import {
  activities,
  activityCommsContacts,
  activityStatuses,
  roles,
  teams,
  userHistory,
  users,
  userSettings,
  userTeams,
} from '@corpcal/database/schema';
import type { ActivityStatusName } from '@corpcal/shared';
import type {
  AddUserToTeamBody,
  CreateUserBody,
  HistoryChange,
  TransferActivitiesBody,
  UpdateUserBody,
  UpdateUserSettingsBody,
  UpdateUserTeamRoleBody,
  UserDetail,
  UserHistoryEntry,
  UserListItem,
} from '@corpcal/shared/api/types';

import { ActivityHistoryService } from '../activities/services/activity-history.service';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly activityHistoryService: ActivityHistoryService
  ) {}

  private async recordUserHistory(
    userId: number,
    changedByUserId: number,
    actionType: string,
    changes?: HistoryChange[],
    notes?: string | null
  ): Promise<void> {
    await this.databaseService.db.insert(userHistory).values({
      userId,
      changedByUserId,
      actionType,
      changes: changes ? changes : null,
      notes: notes ?? null,
    });
  }

  async create(
    dto: CreateUserBody,
    createdByUserId: number
  ): Promise<UserDetail> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const [existingByEmail] = await this.databaseService.db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          sql`lower(${users.adEmail}) = ${normalizedEmail}`,
          eq(users.isActive, true)
        )
      )
      .limit(1);

    if (existingByEmail) {
      throw new ConflictException('A user with this email already exists.');
    }

    const [roleRow] = await this.databaseService.db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.id, dto.roleId))
      .limit(1);

    if (!roleRow) {
      throw new BadRequestException('Invalid role');
    }

    const [inserted] = await this.databaseService.db
      .insert(users)
      .values({
        roleId: dto.roleId,
        adEmail: normalizedEmail,
        adDisplayName: dto.displayName?.trim() || null,
        isActive: true,
        status: 'pending',
        createdBy: createdByUserId,
        createdDateTime: new Date(),
      })
      .returning({ id: users.id });

    const userId = inserted.id;

    await this.recordUserHistory(userId, createdByUserId, 'created', [
      { field: 'roleId', oldValue: null, newValue: dto.roleId },
    ]);

    if (dto.teams && dto.teams.length > 0) {
      const uniqueTeams = Array.from(
        new Map(dto.teams.map((t) => [t.teamId, t])).values()
      );
      const teamIds = uniqueTeams.map((t) => t.teamId);
      const existingTeams = await this.databaseService.db
        .select({ id: teams.id })
        .from(teams)
        .where(inArray(teams.id, teamIds));
      const existingTeamIds = new Set(existingTeams.map((t) => t.id));
      const missing = teamIds.filter((id) => !existingTeamIds.has(id));
      if (missing.length > 0) {
        throw new BadRequestException(
          `Invalid team ID(s): ${missing.join(', ')}`
        );
      }
      for (const teamEntry of uniqueTeams) {
        await this.addUserToTeam(
          userId,
          { teamId: teamEntry.teamId, role: teamEntry.role },
          createdByUserId
        );
      }
    }

    const created = await this.findOne(userId);
    if (!created) throw new NotFoundException('User not found');
    return created;
  }

  async findAll(
    search?: string,
    teamIds?: number[],
    roleIds?: number[]
  ): Promise<UserListItem[]> {
    const conditions = [];
    if (search?.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      conditions.push(
        sql`(lower(${users.adDisplayName}) like ${term} OR lower(${users.adUsername}) like ${term} OR lower(${users.adEmail}) like ${term})`
      );
    }
    if (roleIds?.length) {
      conditions.push(inArray(users.roleId, roleIds));
    }
    if (teamIds && teamIds.length > 0) {
      const filterTeamIds = teamIds;
      const userIdsInTeams = await this.databaseService.db
        .selectDistinct({ userId: userTeams.userId })
        .from(userTeams)
        .where(
          and(
            inArray(userTeams.teamId, filterTeamIds),
            eq(userTeams.isActive, true)
          )
        );
      const ids = userIdsInTeams.map((r) => r.userId);
      if (ids.length === 0) return [];
      conditions.push(inArray(users.id, ids));
    }

    const userRows = await this.databaseService.db
      .select({
        id: users.id,
        adUsername: users.adUsername,
        adDisplayName: users.adDisplayName,
        adEmail: users.adEmail,
        roleId: users.roleId,
        isActive: users.isActive,
        lastUpdatedDateTime: users.lastUpdatedDateTime,
      })
      .from(users)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(users.adDisplayName, users.adUsername);

    const roleRows = await this.databaseService.db
      .select({ id: roles.id, name: roles.name })
      .from(roles);
    const roleMap = new Map(roleRows.map((r) => [r.id, r.name]));

    const teamRows = await this.databaseService.db
      .select({
        userId: userTeams.userId,
        teamId: userTeams.teamId,
        role: userTeams.role,
      })
      .from(userTeams)
      .where(eq(userTeams.isActive, true));

    const distinctTeamIds = [...new Set(teamRows.map((t) => t.teamId))];
    const teamNameRows =
      distinctTeamIds.length > 0
        ? await this.databaseService.db
            .select({ id: teams.id, name: teams.name })
            .from(teams)
            .where(inArray(teams.id, distinctTeamIds))
        : [];
    const teamNameMap = new Map(teamNameRows.map((t) => [t.id, t.name]));

    const teamsByUser = new Map<
      number,
      { teamId: number; teamName: string; role: string }[]
    >();
    for (const t of teamRows) {
      const list = teamsByUser.get(t.userId) ?? [];
      list.push({
        teamId: t.teamId,
        teamName: teamNameMap.get(t.teamId) ?? `Team ${t.teamId}`,
        role: t.role,
      });
      teamsByUser.set(t.userId, list);
    }

    return userRows.map((u) => ({
      id: u.id,
      adUsername: u.adUsername,
      adDisplayName: u.adDisplayName,
      adEmail: u.adEmail,
      roleId: u.roleId,
      roleName: roleMap.get(u.roleId) ?? 'Unknown',
      isActive: u.isActive,
      teams: teamsByUser.get(u.id) ?? [],
      lastUpdatedDateTime: u.lastUpdatedDateTime
        ? u.lastUpdatedDateTime instanceof Date
          ? u.lastUpdatedDateTime.toISOString()
          : String(u.lastUpdatedDateTime)
        : null,
    }));
  }

  async findOne(id: number): Promise<UserDetail | null> {
    const [u] = await this.databaseService.db
      .select({
        id: users.id,
        adUsername: users.adUsername,
        adDisplayName: users.adDisplayName,
        adEmail: users.adEmail,
        roleId: users.roleId,
        isActive: users.isActive,
        notes: users.notes,
        flagColour: userSettings.flagColour,
        directLoginEnabled: userSettings.directLoginEnabled,
        adJobTitle: users.adJobTitle,
        adPhone: users.adPhone,
        lastLoginDateTime: users.lastLoginDateTime,
      })
      .from(users)
      .leftJoin(userSettings, eq(userSettings.userId, users.id))
      .where(eq(users.id, id))
      .limit(1);

    if (!u) return null;

    const [roleRow] = await this.databaseService.db
      .select({ name: roles.name })
      .from(roles)
      .where(eq(roles.id, u.roleId))
      .limit(1);

    const teamRows = await this.databaseService.db
      .select({
        teamId: userTeams.teamId,
        role: userTeams.role,
      })
      .from(userTeams)
      .where(and(eq(userTeams.userId, id), eq(userTeams.isActive, true)));

    const teamIds = teamRows.map((t) => t.teamId);
    const teamNameRows =
      teamIds.length > 0
        ? await this.databaseService.db
            .select({ id: teams.id, name: teams.name })
            .from(teams)
            .where(inArray(teams.id, teamIds))
        : [];
    const teamNameMap = new Map(teamNameRows.map((t) => [t.id, t.name]));

    return {
      ...u,
      flagColour: u.flagColour ?? null,
      directLoginEnabled: u.directLoginEnabled ?? undefined,
      jobTitle: u.adJobTitle ?? null,
      phone: u.adPhone ?? null,
      lastLoginDateTime: u.lastLoginDateTime
        ? u.lastLoginDateTime instanceof Date
          ? u.lastLoginDateTime.toISOString()
          : String(u.lastLoginDateTime)
        : null,
      roleName: roleRow?.name ?? 'Unknown',
      teams: teamRows.map((t) => ({
        teamId: t.teamId,
        teamName: teamNameMap.get(t.teamId) ?? `Team ${t.teamId}`,
        role: t.role,
      })),
    };
  }

  /**
   * Upsert per-user settings (flag colour, etc.).
   * Uses INSERT … ON CONFLICT to avoid a separate select.
   */
  async updateUserSettings(
    id: number,
    dto: UpdateUserSettingsBody,
    changedByUserId: number
  ): Promise<UserDetail> {
    const existing = await this.findOne(id);
    if (!existing) throw new NotFoundException('User not found');

    await this.databaseService.db
      .insert(userSettings)
      .values({
        userId: id,
        flagColour: dto.flagColour ?? null,
        directLoginEnabled:
          dto.directLoginEnabled ?? existing.directLoginEnabled ?? false,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          flagColour: dto.flagColour ?? null,
          directLoginEnabled:
            dto.directLoginEnabled ?? existing.directLoginEnabled ?? false,
          updatedAt: new Date(),
        },
      });

    const changes = [] as HistoryChange[];
    if (
      dto.flagColour !== undefined &&
      dto.flagColour !== existing.flagColour
    ) {
      changes.push({
        field: 'flagColour',
        oldValue: existing.flagColour,
        newValue: dto.flagColour,
      });
    }
    if (
      dto.directLoginEnabled !== undefined &&
      dto.directLoginEnabled !== existing.directLoginEnabled
    ) {
      changes.push({
        field: 'directLoginEnabled',
        oldValue: existing.directLoginEnabled,
        newValue: dto.directLoginEnabled,
      });
    }

    if (changes.length > 0) {
      await this.recordUserHistory(
        id,
        changedByUserId,
        'settings_updated',
        changes
      );
    }

    const updated = await this.findOne(id);
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }

  async update(
    id: number,
    dto: UpdateUserBody,
    changedByUserId: number
  ): Promise<UserDetail> {
    const existing = await this.findOne(id);
    if (!existing) throw new NotFoundException('User not found');

    const changes: HistoryChange[] = [];
    const updates: Partial<typeof users.$inferInsert> = {};

    if (dto.roleId !== undefined && dto.roleId !== existing.roleId) {
      updates.roleId = dto.roleId;
      changes.push({
        field: 'roleId',
        oldValue: existing.roleId,
        newValue: dto.roleId,
      });
    }
    if (dto.isActive !== undefined && dto.isActive !== existing.isActive) {
      updates.isActive = dto.isActive;
      changes.push({
        field: 'isActive',
        oldValue: existing.isActive,
        newValue: dto.isActive,
      });
    }
    if (dto.notes !== undefined && dto.notes !== existing.notes) {
      updates.notes = dto.notes;
      changes.push({
        field: 'notes',
        oldValue: existing.notes,
        newValue: dto.notes,
      });
    }

    if (
      dto.displayName !== undefined &&
      dto.displayName !== existing.adDisplayName
    ) {
      updates.adDisplayName = dto.displayName;
      changes.push({
        field: 'adDisplayName',
        oldValue: existing.adDisplayName,
        newValue: dto.displayName,
      });
    }
    if (dto.email !== undefined && dto.email !== existing.adEmail) {
      updates.adEmail = dto.email;
      changes.push({
        field: 'adEmail',
        oldValue: existing.adEmail,
        newValue: dto.email,
      });
    }
    if (dto.phone !== undefined && dto.phone !== existing.phone) {
      updates.adPhone = dto.phone;
      changes.push({
        field: 'adPhone',
        oldValue: existing.phone ?? null,
        newValue: dto.phone,
      });
    }
    if (dto.jobTitle !== undefined && dto.jobTitle !== existing.jobTitle) {
      updates.adJobTitle = dto.jobTitle;
      changes.push({
        field: 'adJobTitle',
        oldValue: existing.jobTitle ?? null,
        newValue: dto.jobTitle,
      });
    }

    if (Object.keys(updates).length === 0) return existing;

    updates.lastUpdatedBy = changedByUserId;
    updates.lastUpdatedDateTime = new Date();

    await this.databaseService.db
      .update(users)
      .set(updates)
      .where(eq(users.id, id));

    const actionType =
      updates.isActive === false
        ? 'deactivated'
        : updates.isActive === true
          ? 'activated'
          : updates.roleId !== undefined
            ? 'role_changed'
            : 'updated';
    await this.recordUserHistory(
      id,
      changedByUserId,
      actionType,
      changes.length ? changes : undefined
    );

    const updated = await this.findOne(id);
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }

  async addUserToTeam(
    userId: number,
    dto: AddUserToTeamBody,
    changedByUserId: number
  ): Promise<void> {
    const user = await this.findOne(userId);
    if (!user) throw new NotFoundException('User not found');

    const [existing] = await this.databaseService.db
      .select()
      .from(userTeams)
      .where(
        and(
          eq(userTeams.userId, userId),
          eq(userTeams.teamId, dto.teamId),
          eq(userTeams.isActive, true)
        )
      )
      .limit(1);

    if (existing) throw new ConflictException('User is already in this team');

    await this.databaseService.db.insert(userTeams).values({
      userId,
      teamId: dto.teamId,
      role: dto.role,
    });

    await this.recordUserHistory(
      userId,
      changedByUserId,
      'team_added',
      [
        { field: 'teamId', oldValue: null, newValue: dto.teamId },
        { field: 'teamRole', oldValue: null, newValue: dto.role },
      ],
      dto.notes ?? null
    );
  }

  async removeUserFromTeam(
    userId: number,
    teamId: number,
    changedByUserId: number
  ): Promise<void> {
    const [row] = await this.databaseService.db
      .select({ role: userTeams.role })
      .from(userTeams)
      .where(
        and(
          eq(userTeams.userId, userId),
          eq(userTeams.teamId, teamId),
          eq(userTeams.isActive, true)
        )
      )
      .limit(1);

    if (!row) throw new NotFoundException('User is not in this team');

    await this.databaseService.db
      .update(userTeams)
      .set({ isActive: false })
      .where(and(eq(userTeams.userId, userId), eq(userTeams.teamId, teamId)));

    await this.recordUserHistory(userId, changedByUserId, 'team_removed', [
      { field: 'teamId', oldValue: teamId, newValue: null },
      { field: 'teamRole', oldValue: row.role, newValue: null },
    ]);
  }

  async updateUserTeamRole(
    userId: number,
    teamId: number,
    dto: UpdateUserTeamRoleBody,
    changedByUserId: number
  ): Promise<void> {
    const [row] = await this.databaseService.db
      .select({ role: userTeams.role })
      .from(userTeams)
      .where(
        and(
          eq(userTeams.userId, userId),
          eq(userTeams.teamId, teamId),
          eq(userTeams.isActive, true)
        )
      )
      .limit(1);

    if (!row) throw new NotFoundException('User is not in this team');
    if (row.role === dto.role) return;

    await this.databaseService.db
      .update(userTeams)
      .set({ role: dto.role })
      .where(and(eq(userTeams.userId, userId), eq(userTeams.teamId, teamId)));

    await this.recordUserHistory(
      userId,
      changedByUserId,
      'team_role_changed',
      [
        { field: 'teamId', oldValue: teamId, newValue: teamId },
        { field: 'teamRole', oldValue: row.role, newValue: dto.role },
      ],
      dto.notes ?? null
    );
  }

  async getUserHistory(userId: number): Promise<UserHistoryEntry[]> {
    const entries = await this.databaseService.db
      .select({
        id: userHistory.id,
        userId: userHistory.userId,
        changedByUserId: userHistory.changedByUserId,
        actionType: userHistory.actionType,
        changes: userHistory.changes,
        notes: userHistory.notes,
        timestamp: userHistory.timestamp,
      })
      .from(userHistory)
      .where(eq(userHistory.userId, userId))
      .orderBy(desc(userHistory.timestamp));

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
      changerRows.map((r) => [
        r.id,
        r.adDisplayName || r.adUsername || `User ${r.id}`,
      ])
    );

    return entries.map((e) => ({
      ...e,
      changes: (e.changes as UserHistoryEntry['changes']) ?? null,
      timestamp:
        e.timestamp instanceof Date
          ? e.timestamp.toISOString()
          : String(e.timestamp),
      changedByUserName: changerMap.get(e.changedByUserId),
    }));
  }

  /**
   * Returns activities associated with the user (comms lead or contact).
   * Excludes deleted activities. Used for transfer dialog and "my activities" filters.
   */
  async getActivitiesForUser(
    userId: number
  ): Promise<{ id: number; label: string; value: number }[]> {
    const [deletedStatus] = await this.databaseService.db
      .select({ id: activityStatuses.id })
      .from(activityStatuses)
      .where(eq(activityStatuses.name, 'deleted' satisfies ActivityStatusName))
      .limit(1);

    const conditions = [eq(activityCommsContacts.userId, userId)];
    if (deletedStatus?.id != null) {
      conditions.push(ne(activities.activityStatusId, deletedStatus.id));
    }

    const rows = await this.databaseService.db
      .selectDistinct({
        id: activities.id,
        title: activities.title,
      })
      .from(activityCommsContacts)
      .innerJoin(
        activities,
        eq(activityCommsContacts.activityId, activities.id)
      )
      .where(and(...conditions))
      .orderBy(activities.title);

    return rows.map((r) => ({
      id: r.id,
      label: r.title ?? `Activity ${r.id}`,
      value: r.id,
    }));
  }

  async transferActivities(
    sourceUserId: number,
    dto: TransferActivitiesBody,
    changedByUserId: number
  ): Promise<{ transferredCount: number }> {
    if (sourceUserId === dto.targetUserId)
      throw new BadRequestException('Source and target user must be different');

    if (!dto.transferCommsLead && !dto.transferCommsContact)
      throw new BadRequestException(
        'At least one of transferCommsLead or transferCommsContact must be true'
      );

    const leadFilter = dto.transferCommsLead && !dto.transferCommsContact;
    const contactFilter = dto.transferCommsContact && !dto.transferCommsLead;

    let activityIds = dto.activityIds;
    if (!activityIds || activityIds.length === 0) {
      const conditions = [eq(activityCommsContacts.userId, sourceUserId)];
      if (leadFilter) conditions.push(eq(activityCommsContacts.isLead, true));
      if (contactFilter)
        conditions.push(eq(activityCommsContacts.isLead, false));

      const rows = await this.databaseService.db
        .selectDistinct({ activityId: activityCommsContacts.activityId })
        .from(activityCommsContacts)
        .where(and(...conditions));
      activityIds = rows.map((r) => r.activityId);
    }

    if (activityIds.length === 0) {
      await this.recordUserHistory(
        sourceUserId,
        changedByUserId,
        'activities_transferred',
        [
          {
            field: 'targetUserId',
            oldValue: null,
            newValue: dto.targetUserId,
          },
          { field: 'activityCount', oldValue: null, newValue: 0 },
        ],
        dto.notes ?? null
      );
      return { transferredCount: 0 };
    }

    const updateConditions = [
      eq(activityCommsContacts.userId, sourceUserId),
      inArray(activityCommsContacts.activityId, activityIds),
    ];
    if (leadFilter)
      updateConditions.push(eq(activityCommsContacts.isLead, true));
    if (contactFilter)
      updateConditions.push(eq(activityCommsContacts.isLead, false));

    const sourceRows = await this.databaseService.db
      .select({
        activityId: activityCommsContacts.activityId,
        isLead: activityCommsContacts.isLead,
      })
      .from(activityCommsContacts)
      .where(and(...updateConditions));

    if (sourceRows.length === 0) {
      await this.recordUserHistory(
        sourceUserId,
        changedByUserId,
        'activities_transferred',
        [
          {
            field: 'targetUserId',
            oldValue: null,
            newValue: dto.targetUserId,
          },
          { field: 'activityCount', oldValue: null, newValue: 0 },
        ],
        dto.notes ?? null
      );
      return { transferredCount: 0 };
    }

    const userRowsForHistory = await this.databaseService.db
      .select({
        id: users.id,
        adDisplayName: users.adDisplayName,
        adUsername: users.adUsername,
      })
      .from(users)
      .where(inArray(users.id, [sourceUserId, dto.targetUserId]));

    const displayNameById = new Map(
      userRowsForHistory.map((u) => [
        u.id,
        u.adDisplayName || u.adUsername || `User ${u.id}`,
      ])
    );
    const sourceDisplayName =
      displayNameById.get(sourceUserId) ?? `User ${sourceUserId}`;
    const targetDisplayName =
      displayNameById.get(dto.targetUserId) ?? `User ${dto.targetUserId}`;

    const trimmedTransferNote = dto.notes?.trim() ?? '';
    const activityTitleById = new Map<number, string>();
    if (trimmedTransferNote.length > 0) {
      const leadActivityIds = [
        ...new Set(sourceRows.filter((r) => r.isLead).map((r) => r.activityId)),
      ];
      if (leadActivityIds.length > 0) {
        const titleRows = await this.databaseService.db
          .select({ id: activities.id, title: activities.title })
          .from(activities)
          .where(inArray(activities.id, leadActivityIds));
        for (const r of titleRows) {
          const label = r.title?.trim() || `Activity ${r.id}`;
          activityTitleById.set(r.id, label);
        }
      }
    }

    const transferredCount = await this.databaseService.db.transaction(
      async (tx) => {
        let count = 0;
        for (const row of sourceRows) {
          const [targetRow] = await tx
            .select({
              isLead: activityCommsContacts.isLead,
            })
            .from(activityCommsContacts)
            .where(
              and(
                eq(activityCommsContacts.activityId, row.activityId),
                eq(activityCommsContacts.userId, dto.targetUserId)
              )
            )
            .limit(1);

          if (targetRow) {
            await tx
              .delete(activityCommsContacts)
              .where(
                and(
                  eq(activityCommsContacts.activityId, row.activityId),
                  eq(activityCommsContacts.userId, sourceUserId)
                )
              );
            await tx
              .update(activityCommsContacts)
              .set({
                isLead: row.isLead || targetRow.isLead,
              })
              .where(
                and(
                  eq(activityCommsContacts.activityId, row.activityId),
                  eq(activityCommsContacts.userId, dto.targetUserId)
                )
              );
          } else {
            await tx
              .update(activityCommsContacts)
              .set({ userId: dto.targetUserId })
              .where(
                and(
                  eq(activityCommsContacts.activityId, row.activityId),
                  eq(activityCommsContacts.userId, sourceUserId)
                )
              );
          }

          if (row.isLead) {
            let historyNotes: string | undefined;
            if (trimmedTransferNote.length > 0) {
              historyNotes = `${trimmedTransferNote}`;
            }

            await this.activityHistoryService.recordChange(
              row.activityId,
              changedByUserId,
              'comms_lead_transferred',
              [
                {
                  field: 'commsContactLeadId',
                  oldValue: sourceDisplayName,
                  newValue: targetDisplayName,
                },
              ],
              historyNotes,
              tx
            );
          }

          count += 1;
        }
        return count;
      }
    );

    await this.recordUserHistory(
      sourceUserId,
      changedByUserId,
      'activities_transferred',
      [
        { field: 'targetUserId', oldValue: null, newValue: dto.targetUserId },
        { field: 'activityCount', oldValue: null, newValue: transferredCount },
        { field: 'activityIds', oldValue: null, newValue: activityIds },
      ],
      dto.notes ?? null
    );

    return { transferredCount };
  }
}
