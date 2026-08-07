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
  activityFlags,
  activityStatuses,
  ministries,
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
  RemoveUserFromTeamBody,
  TransferActivitiesBody,
  UpdateUserBody,
  UpdateUserSettingsBody,
  UpdateUserTeamRoleBody,
  UserDetail,
  UserHistoryEntry,
  UserListItem,
} from '@corpcal/shared/api/types';

import { ActivityHistoryService } from '../activities/services/activity-history.service';
import { ActivityUtilsService } from '../activities/services/activity-utils.service';
import type { DrizzleDbExecutor } from '../database/database.provider';
import { DatabaseService } from '../database/database.service';
import { TeamsService } from '../teams/teams.service';

/** A single comms-contact row scoped to a user + lead team, used by transfer/removal flows. */
interface ScopedCommsRow {
  activityId: number;
  isLead: boolean;
}

/** Resolved lead-team context (abbreviation, ministry) used to recompute displayId on cross-team moves. */
interface CrossTeamContext {
  teamAbbreviation: string | null;
  leadMinistryId: number | null;
  ministryAbbreviation: string | null;
}

const GOV_BC_EMAIL_SUFFIX = '@gov.bc.ca';
const IDIR_USERNAME_PATTERN = /^[^\s@]+$/;

@Injectable()
export class UsersService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly activityHistoryService: ActivityHistoryService,
    private readonly activityUtilsService: ActivityUtilsService,
    private readonly teamsService: TeamsService
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
    const idirUsername = dto.idirUsername.trim();

    if (!normalizedEmail.endsWith(GOV_BC_EMAIL_SUFFIX)) {
      throw new BadRequestException('Email must be a @gov.bc.ca address');
    }

    if (!idirUsername) {
      throw new BadRequestException('IDIR username is required');
    }

    if (!IDIR_USERNAME_PATTERN.test(idirUsername)) {
      throw new BadRequestException(
        'IDIR username must not contain spaces or @'
      );
    }

    const normalizedIdirUsername = idirUsername.toUpperCase();

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
        adUsername: normalizedIdirUsername,
        adEmail: normalizedEmail,
        adDisplayName: dto.displayName?.trim() || null,
        adJobTitle: dto.adJobTitle?.trim() || null,
        adPhone: dto.adPhone?.trim() || null,
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
    let normalizedUpdateEmail: string | null | undefined;
    if (dto.email !== undefined) {
      normalizedUpdateEmail = dto.email?.trim().toLowerCase() ?? null;

      if (!normalizedUpdateEmail) {
        throw new BadRequestException('Email is required');
      }

      if (!normalizedUpdateEmail.endsWith(GOV_BC_EMAIL_SUFFIX)) {
        throw new BadRequestException('Email must be a @gov.bc.ca address');
      }
    }

    if (dto.email !== undefined) {
      if (normalizedUpdateEmail !== existing.adEmail) {
        updates.adEmail = normalizedUpdateEmail;
        changes.push({
          field: 'adEmail',
          oldValue: existing.adEmail,
          newValue: normalizedUpdateEmail,
        });
      }
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
        and(eq(userTeams.userId, userId), eq(userTeams.teamId, dto.teamId))
      )
      .limit(1);

    if (existing?.isActive) {
      throw new ConflictException('User is already in this team');
    }

    if (existing && !existing.isActive) {
      await this.databaseService.db
        .update(userTeams)
        .set({ isActive: true, role: dto.role, timestamp: new Date() })
        .where(
          and(eq(userTeams.userId, userId), eq(userTeams.teamId, dto.teamId))
        );
    } else {
      await this.databaseService.db.insert(userTeams).values({
        userId,
        teamId: dto.teamId,
        role: dto.role,
      });
    }

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

  /**
   * Removes a user from a team.
   *
   * Always deletes the user's `activity_flags` for this team (`assigneeId =
   * userId`, `teamId`), regardless of comms — flags are per-team assignments
   * that have no meaning once the user is no longer on the team.
   *
   * If the user has active comms-contact rows scoped to this team
   * (`leadTeamId === teamId`), `dto.targetUserId` is required and those
   * activities are transferred in `removal` mode (non-lead comms are always
   * transferred-or-deleted, never left in place — see
   * `applyActivityCommsChanges`). Everything runs in one transaction.
   */
  async removeUserFromTeam(
    userId: number,
    teamId: number,
    changedByUserId: number,
    dto?: RemoveUserFromTeamBody
  ): Promise<{ transferredCount: number }> {
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

    const includeNonLead = dto?.includeNonLead ?? false;
    const toTeamId = dto?.toTeamId ?? teamId;
    const targetUserId = dto?.targetUserId ?? null;

    const scopedRows = await this.getScopedCommsRows(userId, teamId);

    if (scopedRows.length > 0 && targetUserId == null) {
      throw new BadRequestException(
        'This user has comms assignments on activities led by this team. ' +
          'Provide targetUserId to transfer them before removal.'
      );
    }

    let sourceDisplayName = '';
    let targetDisplayName: string | null = null;
    let crossTeamContext: CrossTeamContext | null = null;
    let eligibleSourceOnToTeam = new Set<number>();
    const crossTeam = toTeamId !== teamId;

    if (scopedRows.length > 0) {
      const eligibleOnToTeam =
        await this.teamsService.getEligibleCommsUserIds(toTeamId);
      this.validateTransferTarget(
        scopedRows,
        targetUserId,
        includeNonLead,
        eligibleOnToTeam
      );
      eligibleSourceOnToTeam = eligibleOnToTeam;

      const displayNameById = await this.getDisplayNamesById([
        userId,
        targetUserId!,
      ]);
      sourceDisplayName = displayNameById.get(userId) ?? `User ${userId}`;
      targetDisplayName =
        displayNameById.get(targetUserId!) ?? `User ${targetUserId}`;

      if (crossTeam) {
        crossTeamContext = await this.resolveCrossTeamContext(toTeamId);
      }
    }

    const transferredCount = await this.databaseService.db.transaction(
      async (tx) => {
        let count = 0;
        if (scopedRows.length > 0) {
          count = await this.applyActivityCommsChanges(tx, {
            sourceUserId: userId,
            targetUserId,
            fromTeamId: teamId,
            toTeamId,
            rows: scopedRows,
            includeNonLead,
            mode: 'removal',
            changedByUserId,
            notes: dto?.notes,
            sourceDisplayName,
            targetDisplayName,
            crossTeamContext,
            eligibleSourceOnToTeam,
          });
        }

        // Flags are per-team assignments; always clear them on removal (Option A),
        // independent of whether the user had any comms assignments to transfer.
        await tx
          .delete(activityFlags)
          .where(
            and(
              eq(activityFlags.assigneeId, userId),
              eq(activityFlags.teamId, teamId)
            )
          );

        await tx
          .update(userTeams)
          .set({ isActive: false })
          .where(
            and(eq(userTeams.userId, userId), eq(userTeams.teamId, teamId))
          );

        return count;
      }
    );

    const historyChanges: HistoryChange[] = [
      { field: 'teamId', oldValue: teamId, newValue: null },
      { field: 'teamRole', oldValue: row.role, newValue: null },
    ];
    if (transferredCount > 0) {
      historyChanges.push({
        field: 'activityCount',
        oldValue: null,
        newValue: transferredCount,
      });
    }

    await this.recordUserHistory(
      userId,
      changedByUserId,
      'team_removed',
      historyChanges,
      dto?.notes ?? null
    );

    return { transferredCount };
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
   *
   * When `fromTeamId` is provided, the list is scoped to activities where
   * `leadTeamId === fromTeamId` — the set used by the transfer-activities and
   * team-removal flows. Each row includes `isLead` so callers can distinguish
   * lead vs. non-lead (contact) comms assignments.
   */
  async getActivitiesForUser(
    userId: number,
    fromTeamId?: number
  ): Promise<{ id: number; label: string; value: number; isLead: boolean }[]> {
    const [deletedStatus] = await this.databaseService.db
      .select({ id: activityStatuses.id })
      .from(activityStatuses)
      .where(eq(activityStatuses.name, 'deleted' satisfies ActivityStatusName))
      .limit(1);

    const conditions = [
      eq(activityCommsContacts.userId, userId),
      eq(activityCommsContacts.isActive, true),
    ];
    if (fromTeamId != null) {
      conditions.push(eq(activities.leadTeamId, fromTeamId));
    }
    if (deletedStatus?.id != null) {
      conditions.push(ne(activities.activityStatusId, deletedStatus.id));
    }

    const rows = await this.databaseService.db
      .select({
        id: activities.id,
        title: activities.title,
        isLead: activityCommsContacts.isLead,
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
      isLead: r.isLead,
    }));
  }

  /**
   * Returns the source user's active comms-contact rows scoped to activities
   * whose `leadTeamId === leadTeamId`. This is the eligible set for both
   * `transferActivities` (fromTeamId) and `removeUserFromTeam` (team being removed).
   */
  private async getScopedCommsRows(
    userId: number,
    leadTeamId: number
  ): Promise<ScopedCommsRow[]> {
    const [deletedStatus] = await this.databaseService.db
      .select({ id: activityStatuses.id })
      .from(activityStatuses)
      .where(eq(activityStatuses.name, 'deleted' satisfies ActivityStatusName))
      .limit(1);

    const conditions = [
      eq(activityCommsContacts.userId, userId),
      eq(activityCommsContacts.isActive, true),
      eq(activities.leadTeamId, leadTeamId),
    ];
    if (deletedStatus?.id != null) {
      conditions.push(ne(activities.activityStatusId, deletedStatus.id));
    }

    return this.databaseService.db
      .select({
        activityId: activityCommsContacts.activityId,
        isLead: activityCommsContacts.isLead,
      })
      .from(activityCommsContacts)
      .innerJoin(
        activities,
        eq(activityCommsContacts.activityId, activities.id)
      )
      .where(and(...conditions));
  }

  /** Resolves display names for history entries in a single query. */
  private async getDisplayNamesById(
    userIds: number[]
  ): Promise<Map<number, string>> {
    const uniqueIds = Array.from(new Set(userIds));
    const rows = await this.databaseService.db
      .select({
        id: users.id,
        adDisplayName: users.adDisplayName,
        adUsername: users.adUsername,
      })
      .from(users)
      .where(inArray(users.id, uniqueIds));

    return new Map(
      rows.map((u) => [u.id, u.adDisplayName || u.adUsername || `User ${u.id}`])
    );
  }

  /**
   * Resolves the team abbreviation and ministry context for a target lead team,
   * mirroring the lookup `ActivitiesService.update` performs when `leadTeamId`
   * changes, so displayId/ministry inheritance stay consistent across both paths.
   */
  private async resolveCrossTeamContext(
    toTeamId: number
  ): Promise<CrossTeamContext> {
    const [teamRow] = await this.databaseService.db
      .select({
        abbreviation: teams.abbreviation,
        ministryId: teams.ministryId,
      })
      .from(teams)
      .where(eq(teams.id, toTeamId))
      .limit(1);

    if (!teamRow) {
      throw new BadRequestException(`Team with ID ${toTeamId} not found`);
    }

    let ministryAbbreviation: string | null = null;
    if (teamRow.ministryId != null) {
      const [ministry] = await this.databaseService.db
        .select({ abbreviation: ministries.abbreviation })
        .from(ministries)
        .where(eq(ministries.id, teamRow.ministryId))
        .limit(1);
      ministryAbbreviation = ministry?.abbreviation ?? null;
    }

    return {
      teamAbbreviation: teamRow.abbreviation ?? null,
      leadMinistryId: teamRow.ministryId ?? null,
      ministryAbbreviation,
    };
  }

  /**
   * Validates that the target user is an eligible comms contact for the
   * effective lead team, but only when comms will actually move to them
   * (lead comms always move; non-lead only when `includeNonLead` is true).
   */
  private validateTransferTarget(
    rows: ScopedCommsRow[],
    targetUserId: number | null,
    includeNonLead: boolean,
    eligibleOnToTeam: Set<number>
  ): void {
    const willReceiveComms = rows.some((r) => r.isLead || includeNonLead);
    if (!willReceiveComms) return;

    if (targetUserId == null) {
      throw new BadRequestException(
        'targetUserId is required to transfer comms assignments.'
      );
    }
    if (!eligibleOnToTeam.has(targetUserId)) {
      throw new BadRequestException(
        `Target user ${targetUserId} is not an eligible comms contact for the destination team. ` +
          'Target must be an active member of that team with activities.edit permission.'
      );
    }
  }

  /**
   * Transfers a single comms-contact row from source to target user, merging
   * with any existing target row (OR'ing `isLead`) to avoid unique-key conflicts.
   */
  private async transferSingleCommsRow(
    tx: DrizzleDbExecutor,
    activityId: number,
    sourceUserId: number,
    targetUserId: number,
    isLead: boolean
  ): Promise<void> {
    const [targetRow] = await tx
      .select({ isLead: activityCommsContacts.isLead })
      .from(activityCommsContacts)
      .where(
        and(
          eq(activityCommsContacts.activityId, activityId),
          eq(activityCommsContacts.userId, targetUserId)
        )
      )
      .limit(1);

    if (targetRow) {
      await tx
        .delete(activityCommsContacts)
        .where(
          and(
            eq(activityCommsContacts.activityId, activityId),
            eq(activityCommsContacts.userId, sourceUserId)
          )
        );
      await tx
        .update(activityCommsContacts)
        .set({ isLead: isLead || targetRow.isLead, isActive: true })
        .where(
          and(
            eq(activityCommsContacts.activityId, activityId),
            eq(activityCommsContacts.userId, targetUserId)
          )
        );
    } else {
      await tx
        .update(activityCommsContacts)
        .set({ userId: targetUserId, isActive: true })
        .where(
          and(
            eq(activityCommsContacts.activityId, activityId),
            eq(activityCommsContacts.userId, sourceUserId)
          )
        );
    }
  }

  /**
   * Core per-activity engine shared by `transferActivities` (mode: 'transfer')
   * and `removeUserFromTeam` (mode: 'removal'). Must run inside a transaction.
   *
   * Rules (see docs/spec for full rationale):
   * - Lead comms always transfer to `targetUserId` when in scope/selected.
   * - Non-lead comms transfer when `includeNonLead` is true.
   * - Non-lead comms when `includeNonLead` is false:
   *   - mode 'removal': always deleted (the user is leaving the team, so
   *     leaving them attached would violate lead-team comms eligibility).
   *   - mode 'transfer', same team: left as-is (no action).
   *   - mode 'transfer', cross-team: left as-is if the source user remains
   *     comms-eligible on the new lead team, otherwise deleted.
   * - When `toTeamId !== fromTeamId`, each affected activity's `leadTeamId`
   *   (and derived `leadMinistryId`/`displayId`) moves with it, matching the
   *   Activity Form's lead-team-change behavior.
   */
  private async applyActivityCommsChanges(
    tx: DrizzleDbExecutor,
    params: {
      sourceUserId: number;
      targetUserId: number | null;
      fromTeamId: number;
      toTeamId: number;
      rows: ScopedCommsRow[];
      includeNonLead: boolean;
      mode: 'transfer' | 'removal';
      changedByUserId: number;
      notes?: string;
      sourceDisplayName: string;
      targetDisplayName: string | null;
      crossTeamContext: CrossTeamContext | null;
      eligibleSourceOnToTeam: Set<number>;
    }
  ): Promise<number> {
    const {
      sourceUserId,
      targetUserId,
      fromTeamId,
      toTeamId,
      rows,
      includeNonLead,
      mode,
      changedByUserId,
      notes,
      sourceDisplayName,
      targetDisplayName,
      crossTeamContext,
      eligibleSourceOnToTeam,
    } = params;

    const crossTeam = toTeamId !== fromTeamId;
    const trimmedNotes = notes?.trim() || undefined;
    let count = 0;

    for (const row of rows) {
      let actionTaken = false;

      if (crossTeam && crossTeamContext) {
        const displayId =
          this.activityUtilsService.computeDisplayIdFromLeadContext({
            activityId: row.activityId,
            leadMinistryId: crossTeamContext.leadMinistryId,
            ministryAbbreviation: crossTeamContext.ministryAbbreviation,
            teamAbbreviation: crossTeamContext.teamAbbreviation,
          });

        await tx
          .update(activities)
          .set({
            leadTeamId: toTeamId,
            leadMinistryId: crossTeamContext.leadMinistryId,
            displayId,
            lastUpdatedDateTime: new Date(),
            lastUpdatedBy: changedByUserId,
          })
          .where(eq(activities.id, row.activityId));

        await this.activityHistoryService.recordChange(
          row.activityId,
          changedByUserId,
          'lead_team_changed',
          [{ field: 'leadTeamId', oldValue: fromTeamId, newValue: toTeamId }],
          trimmedNotes,
          tx
        );

        actionTaken = true;
      }

      if (row.isLead) {
        // targetUserId presence guaranteed by validateTransferTarget when any row is lead.
        await this.transferSingleCommsRow(
          tx,
          row.activityId,
          sourceUserId,
          targetUserId!,
          row.isLead
        );
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
          trimmedNotes,
          tx
        );
        actionTaken = true;
      } else if (includeNonLead) {
        await this.transferSingleCommsRow(
          tx,
          row.activityId,
          sourceUserId,
          targetUserId!,
          row.isLead
        );
        actionTaken = true;
      } else if (
        mode === 'removal' ||
        (crossTeam && !eligibleSourceOnToTeam.has(sourceUserId))
      ) {
        await tx
          .delete(activityCommsContacts)
          .where(
            and(
              eq(activityCommsContacts.activityId, row.activityId),
              eq(activityCommsContacts.userId, sourceUserId)
            )
          );
        actionTaken = true;
      }
      // else: transfer mode, non-lead unchecked, source remains comms-eligible -> keep, no action.

      if (actionTaken) count += 1;
    }

    return count;
  }

  /**
   * Returns per-user activity counts for the supplied user IDs.
   * Excludes deleted activities and inactive comms contact rows (matches
   * getActivitiesForUser behavior).
   */
  async getActivityCountsForUsers(
    userIds: number[]
  ): Promise<{ userId: number; activityCount: number }[]> {
    const uniqueUserIds = Array.from(
      new Set(userIds.filter((id) => Number.isInteger(id) && id > 0))
    );
    if (uniqueUserIds.length === 0) return [];

    const [deletedStatus] = await this.databaseService.db
      .select({ id: activityStatuses.id })
      .from(activityStatuses)
      .where(eq(activityStatuses.name, 'deleted' satisfies ActivityStatusName))
      .limit(1);

    const conditions = [
      inArray(activityCommsContacts.userId, uniqueUserIds),
      eq(activityCommsContacts.isActive, true),
    ];
    if (deletedStatus?.id != null) {
      conditions.push(ne(activities.activityStatusId, deletedStatus.id));
    }

    const rows = await this.databaseService.db
      .select({
        userId: activityCommsContacts.userId,
        activityCount: sql<number>`cast(count(distinct ${activityCommsContacts.activityId}) as int)`,
      })
      .from(activityCommsContacts)
      .innerJoin(
        activities,
        eq(activityCommsContacts.activityId, activities.id)
      )
      .where(and(...conditions))
      .groupBy(activityCommsContacts.userId);

    const countByUserId = new Map<number, number>(
      rows.map((row) => [row.userId, Number(row.activityCount) || 0])
    );

    return uniqueUserIds.map((userId) => ({
      userId,
      activityCount: countByUserId.get(userId) ?? 0,
    }));
  }

  /** Ensures the source user is an active member of `teamId` before team-scoped transfer. */
  private async assertSourceUserOnTeam(
    userId: number,
    teamId: number
  ): Promise<void> {
    const [row] = await this.databaseService.db
      .select({ userId: userTeams.userId })
      .from(userTeams)
      .where(
        and(
          eq(userTeams.userId, userId),
          eq(userTeams.teamId, teamId),
          eq(userTeams.isActive, true)
        )
      )
      .limit(1);

    if (!row) {
      throw new BadRequestException(
        `User ${userId} is not an active member of team ${teamId}.`
      );
    }
  }

  /**
   * Mirrors `applyActivityCommsChanges` to detect whether a scoped row would
   * produce any side effect (comms move, delete, or cross-team lead update).
   */
  private commsChangeWouldApply(
    row: ScopedCommsRow,
    params: {
      includeNonLead: boolean;
      mode: 'transfer' | 'removal';
      crossTeam: boolean;
    }
  ): boolean {
    const { includeNonLead, mode, crossTeam } = params;

    if (crossTeam) return true;
    if (row.isLead) return true;
    if (includeNonLead) return true;
    if (mode === 'removal') return true;
    return false;
  }

  /**
   * Transfers activity comms assignments from `sourceUserId` to `dto.targetUserId`.
   *
   * Scope is every activity where the source user has an active comms row and
   * `activities.leadTeamId === dto.fromTeamId`; `dto.activityIds`, if given,
   * must be a subset of that scope. See `applyActivityCommsChanges` for the
   * per-activity lead/non-lead and cross-team rules.
   */
  async transferActivities(
    sourceUserId: number,
    dto: TransferActivitiesBody,
    changedByUserId: number
  ): Promise<{ transferredCount: number }> {
    if (sourceUserId === dto.targetUserId) {
      throw new BadRequestException('Source and target user must be different');
    }

    const fromTeamId = dto.fromTeamId;
    const toTeamId = dto.toTeamId ?? fromTeamId;

    await this.assertSourceUserOnTeam(sourceUserId, fromTeamId);

    const scopedRows = await this.getScopedCommsRows(sourceUserId, fromTeamId);
    const scopedIds = new Set(scopedRows.map((r) => r.activityId));

    if (scopedIds.size === 0) {
      throw new BadRequestException(
        'No comms assignments are in scope for this user and team.'
      );
    }

    let activityIds: number[];
    if (dto.activityIds === undefined) {
      activityIds = Array.from(scopedIds);
    } else if (dto.activityIds.length === 0) {
      throw new BadRequestException(
        'activityIds must include at least one activity when provided.'
      );
    } else {
      const invalidIds = dto.activityIds.filter((id) => !scopedIds.has(id));
      if (invalidIds.length > 0) {
        throw new BadRequestException(
          `Activities [${invalidIds.join(', ')}] are not eligible for transfer from team ${fromTeamId}.`
        );
      }
      activityIds = dto.activityIds;
    }

    const rowsToProcess = scopedRows.filter((r) =>
      activityIds.includes(r.activityId)
    );

    const crossTeam = toTeamId !== fromTeamId;
    const eligibleOnToTeam =
      await this.teamsService.getEligibleCommsUserIds(toTeamId);
    this.validateTransferTarget(
      rowsToProcess,
      dto.targetUserId,
      dto.includeNonLead,
      eligibleOnToTeam
    );

    if (
      !rowsToProcess.some((row) =>
        this.commsChangeWouldApply(row, {
          includeNonLead: dto.includeNonLead,
          mode: 'transfer',
          crossTeam,
        })
      )
    ) {
      throw new BadRequestException(
        'No comms assignments would change for the selected activities and options.'
      );
    }

    const displayNameById = await this.getDisplayNamesById([
      sourceUserId,
      dto.targetUserId,
    ]);
    const sourceDisplayName =
      displayNameById.get(sourceUserId) ?? `User ${sourceUserId}`;
    const targetDisplayName =
      displayNameById.get(dto.targetUserId) ?? `User ${dto.targetUserId}`;

    const crossTeamContext = crossTeam
      ? await this.resolveCrossTeamContext(toTeamId)
      : null;

    const transferredCount = await this.databaseService.db.transaction((tx) =>
      this.applyActivityCommsChanges(tx, {
        sourceUserId,
        targetUserId: dto.targetUserId,
        fromTeamId,
        toTeamId,
        rows: rowsToProcess,
        includeNonLead: dto.includeNonLead,
        mode: 'transfer',
        changedByUserId,
        notes: dto.notes,
        sourceDisplayName,
        targetDisplayName,
        crossTeamContext,
        eligibleSourceOnToTeam: eligibleOnToTeam,
      })
    );

    await this.recordUserHistory(
      sourceUserId,
      changedByUserId,
      'activities_transferred',
      [
        { field: 'targetUserId', oldValue: null, newValue: dto.targetUserId },
        { field: 'fromTeamId', oldValue: null, newValue: fromTeamId },
        { field: 'toTeamId', oldValue: null, newValue: toTeamId },
        { field: 'activityCount', oldValue: null, newValue: transferredCount },
        { field: 'activityIds', oldValue: null, newValue: activityIds },
      ],
      dto.notes ?? null
    );

    return { transferredCount };
  }
}
