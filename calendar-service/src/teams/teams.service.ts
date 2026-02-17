import { Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';

import {
  ministries,
  teamHistory,
  teamMinistries,
  teams,
  users,
  userTeams,
} from '@corpcal/database/schema';
import type {
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

  async findAll(activeOnly = true): Promise<TeamListItem[]> {
    const teamRows = await this.databaseService.db
      .select({
        id: teams.id,
        name: teams.name,
        displayName: teams.displayName,
        description: teams.description,
        isActive: teams.isActive,
      })
      .from(teams)
      .where(activeOnly ? eq(teams.isActive, true) : undefined)
      .orderBy(teams.name);

    const teamIds = teamRows.map((t) => t.id);
    if (teamIds.length === 0) return [];

    const [memberCounts, ministryCounts] = await Promise.all([
      this.databaseService.db
        .select({
          teamId: userTeams.teamId,
          count: sql<number>`count(*)::int`,
        })
        .from(userTeams)
        .where(
          and(inArray(userTeams.teamId, teamIds), eq(userTeams.isActive, true))
        )
        .groupBy(userTeams.teamId),
      this.databaseService.db
        .select({
          teamId: teamMinistries.teamId,
          count: sql<number>`count(*)::int`,
        })
        .from(teamMinistries)
        .where(
          and(
            inArray(teamMinistries.teamId, teamIds),
            eq(teamMinistries.isActive, true)
          )
        )
        .groupBy(teamMinistries.teamId),
    ]);

    const memberMap = new Map(memberCounts.map((m) => [m.teamId, m.count]));
    const ministryMap = new Map(ministryCounts.map((m) => [m.teamId, m.count]));

    return teamRows.map((t) => ({
      ...t,
      memberCount: memberMap.get(t.id) ?? 0,
      ministryCount: ministryMap.get(t.id) ?? 0,
    }));
  }

  async findOne(id: number): Promise<TeamDetail | null> {
    const [t] = await this.databaseService.db
      .select({
        id: teams.id,
        name: teams.name,
        displayName: teams.displayName,
        description: teams.description,
        isActive: teams.isActive,
      })
      .from(teams)
      .where(eq(teams.id, id))
      .limit(1);

    if (!t) return null;

    const [memberRows, ministryRows] = await Promise.all([
      this.databaseService.db
        .select({
          userId: userTeams.userId,
          role: userTeams.role,
        })
        .from(userTeams)
        .where(and(eq(userTeams.teamId, id), eq(userTeams.isActive, true))),
      this.databaseService.db
        .select({ ministryId: teamMinistries.ministryId })
        .from(teamMinistries)
        .where(
          and(eq(teamMinistries.teamId, id), eq(teamMinistries.isActive, true))
        ),
    ]);

    const userIds = memberRows.map((m) => m.userId);
    const ministryIds = ministryRows.map((m) => m.ministryId);

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

    return {
      ...t,
      memberCount: memberRows.length,
      ministryCount: ministryRows.length,
      members: memberRows.map((m) => ({
        userId: m.userId,
        userName: userMap.get(m.userId) ?? `User ${m.userId}`,
        role: m.role,
      })),
      ministries: ministryRows.map((m) => ({
        ministryId: m.ministryId,
        ministryName: ministryMap.get(m.ministryId) ?? String(m.ministryId),
      })),
    };
  }

  async create(dto: CreateTeamBody, createdBy: number): Promise<TeamListItem> {
    const [inserted] = await this.databaseService.db
      .insert(teams)
      .values({
        name: dto.name,
        displayName: dto.displayName ?? null,
        description: dto.description ?? null,
        isActive: dto.isActive ?? true,
        createdBy,
        lastUpdatedBy: createdBy,
      })
      .returning();

    const ministryIdStrs = dto.ministryIds?.filter((id) => id?.trim()) ?? [];
    const ministryIds = ministryIdStrs
      .map((id) => parseInt(id, 10))
      .filter((n) => !Number.isNaN(n));
    if (ministryIds.length > 0) {
      await this.databaseService.db.insert(teamMinistries).values(
        ministryIds.map((ministryId) => ({
          teamId: inserted.id,
          ministryId,
        }))
      );
    }

    const changes: HistoryChange[] = [];
    if (ministryIdStrs.length > 0) {
      changes.push({
        field: 'ministryIds',
        oldValue: null,
        newValue: ministryIdStrs,
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
    if (dto.displayName !== undefined) updates.displayName = dto.displayName;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.isActive !== undefined) updates.isActive = dto.isActive;

    const previousMinistryIds = existing.ministries
      .map((m) => m.ministryId)
      .sort((a, b) => a - b);
    let newMinistryIds: string[] | null = null;
    if (dto.ministryIds !== undefined) {
      newMinistryIds = dto.ministryIds.filter((mid) => mid?.trim());
      await this.databaseService.db
        .update(teamMinistries)
        .set({ isActive: false })
        .where(eq(teamMinistries.teamId, id));
      const ministryIdsNum = newMinistryIds
        .map((mid) => parseInt(mid, 10))
        .filter((n) => !Number.isNaN(n));
      for (const ministryId of ministryIdsNum) {
        await this.databaseService.db
          .insert(teamMinistries)
          .values({ teamId: id, ministryId, isActive: true })
          .onConflictDoUpdate({
            target: [teamMinistries.teamId, teamMinistries.ministryId],
            set: { isActive: true },
          });
      }
    }

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
    if (dto.isActive !== undefined && dto.isActive !== existing.isActive) {
      changes.push({
        field: 'isActive',
        oldValue: existing.isActive,
        newValue: dto.isActive,
      });
    }
    if (newMinistryIds !== null) {
      const sortedNewNum = newMinistryIds
        .map((mid) => parseInt(mid, 10))
        .filter((n) => !Number.isNaN(n))
        .sort((a, b) => a - b);
      if (
        previousMinistryIds.length !== sortedNewNum.length ||
        previousMinistryIds.some((id, i) => id !== sortedNewNum[i])
      ) {
        changes.push({
          field: 'ministryIds',
          oldValue: previousMinistryIds,
          newValue: newMinistryIds,
        });
      }
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
