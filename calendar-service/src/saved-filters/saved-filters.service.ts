import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { desc, SQL } from 'drizzle-orm';

import { and, eq, schema, sql } from '@corpcal/database';
import {
  SAVED_FILTER_EMPTY_PAYLOAD_MESSAGE,
  savedFilterPayloadIsEmpty,
} from '@corpcal/shared/utils';

import { AppLogger } from '../common/logger/logger.service';
import { DatabaseService } from '../database/database.service';
import type {
  CreateSavedFilterBody,
  DuplicateSavedFilterBody,
  SavedFilterResponse,
  UpdateSavedFilterBody,
} from './dto/saved-filter.schema';

const { activitySavedFilters } = schema;

type SavedFilterRow = typeof activitySavedFilters.$inferSelect;
type SavedFilterScopeType = 'user' | 'team' | 'global';

interface ScopeResolution {
  scopeType: SavedFilterScopeType;
  scopeTeamId: number | null;
}

interface ScopeContext {
  teamIds?: number[];
}

@Injectable()
export class SavedFiltersService {
  private readonly logger = new AppLogger(SavedFiltersService.name);

  constructor(private readonly db: DatabaseService) {}

  async listByContext(
    userId: number,
    contextKey: string,
    teamIds: number[]
  ): Promise<SavedFilterResponse[]> {
    const conditions: SQL[] = [
      eq(activitySavedFilters.contextKey, contextKey),
      eq(activitySavedFilters.isActive, true),
    ];

    let rows: SavedFilterRow[];

    if (teamIds.length > 0) {
      const visibilityFilter = sql`(
        (${activitySavedFilters.scopeType} = 'user' AND ${activitySavedFilters.ownerUserId} = ${userId})
        OR
        (${activitySavedFilters.scopeType} = 'team' AND ${activitySavedFilters.scopeTeamId} IN (${sql.join(
          teamIds.map((id) => sql`${id}`),
          sql`, `
        )}))
        OR
        (${activitySavedFilters.scopeType} = 'global')
      )`;

      rows = await this.db.db
        .select()
        .from(activitySavedFilters)
        .where(and(...conditions, visibilityFilter))
        .orderBy(
          desc(activitySavedFilters.isDefault),
          activitySavedFilters.sortOrder,
          activitySavedFilters.name
        );
    } else {
      rows = await this.db.db
        .select()
        .from(activitySavedFilters)
        .where(
          and(
            ...conditions,
            sql`(
              (${activitySavedFilters.scopeType} = 'user' AND ${activitySavedFilters.ownerUserId} = ${userId})
              OR
              (${activitySavedFilters.scopeType} = 'global')
            )`
          )
        )
        .orderBy(
          desc(activitySavedFilters.isDefault),
          activitySavedFilters.sortOrder,
          activitySavedFilters.name
        );
    }

    return rows.map((row) => this.mapToResponse(row));
  }

  async create(
    userId: number,
    body: CreateSavedFilterBody,
    scopeContext?: ScopeContext
  ): Promise<SavedFilterResponse> {
    const trimmedName = body.name.trim();
    const resolvedScope = this.resolveScope({
      scopeType: body.scopeType,
      scopeTeamId: body.scopeTeamId,
      teamIds: scopeContext?.teamIds,
    });

    this.assertSavedFilterPayloadNotEmpty(body.filterState, body.searchKeyword);

    await this.assertNameUnique(
      userId,
      body.contextKey,
      trimmedName,
      resolvedScope
    );

    if (body.isDefault) {
      await this.clearDefaultForContext(userId, body.contextKey, resolvedScope);
    }

    const [row] = await this.db.db
      .insert(activitySavedFilters)
      .values({
        ownerUserId: userId,
        contextKey: body.contextKey,
        name: trimmedName,
        filterState: body.filterState,
        searchKeyword: body.searchKeyword ?? '',
        isDefault: body.isDefault ?? false,
        scopeType: resolvedScope.scopeType,
        scopeTeamId: resolvedScope.scopeTeamId,
      })
      .returning();

    this.logger.log(
      `Created saved filter ${row.id} "${trimmedName}" for user ${userId} in context ${body.contextKey}`
    );

    return this.mapToResponse(row);
  }

  async update(
    userId: number,
    filterId: number,
    body: UpdateSavedFilterBody,
    scopeContext?: ScopeContext
  ): Promise<SavedFilterResponse> {
    const existing = await this.findOwnedOrFail(userId, filterId);

    if (body.filterState !== undefined || body.searchKeyword !== undefined) {
      const nextFilterState =
        body.filterState !== undefined
          ? body.filterState
          : (existing.filterState as Record<string, unknown>);
      const nextSearchKeyword =
        body.searchKeyword !== undefined
          ? body.searchKeyword
          : existing.searchKeyword;
      this.assertSavedFilterPayloadNotEmpty(nextFilterState, nextSearchKeyword);
    }

    const resolvedScope = this.resolveScope({
      scopeType: body.scopeType ?? (existing.scopeType as SavedFilterScopeType),
      scopeTeamId:
        body.scopeTeamId !== undefined
          ? body.scopeTeamId
          : existing.scopeTeamId,
      teamIds: scopeContext?.teamIds,
    });

    if (body.name !== undefined) {
      const trimmedName = body.name.trim();
      if (trimmedName !== existing.name) {
        await this.assertNameUnique(
          userId,
          existing.contextKey,
          trimmedName,
          resolvedScope,
          filterId
        );
      }
    }

    if (body.isDefault === true) {
      await this.clearDefaultForContext(
        userId,
        existing.contextKey,
        resolvedScope
      );
    }

    const setClause: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) setClause.name = body.name.trim();
    if (body.filterState !== undefined)
      setClause.filterState = body.filterState;
    if (body.searchKeyword !== undefined)
      setClause.searchKeyword = body.searchKeyword;
    if (body.isDefault !== undefined) setClause.isDefault = body.isDefault;
    if (body.scopeType !== undefined)
      setClause.scopeType = resolvedScope.scopeType;
    if (body.scopeTeamId !== undefined)
      setClause.scopeTeamId = resolvedScope.scopeTeamId;

    const [row] = await this.db.db
      .update(activitySavedFilters)
      .set(setClause)
      .where(eq(activitySavedFilters.id, filterId))
      .returning();

    this.logger.log(`Updated saved filter ${filterId} for user ${userId}`);

    return this.mapToResponse(row);
  }

  async duplicate(
    userId: number,
    filterId: number,
    body: DuplicateSavedFilterBody
  ): Promise<SavedFilterResponse> {
    const existing = await this.findOwnedOrFail(userId, filterId);

    const baseName = body.name?.trim() || `${existing.name} (copy)`;
    const name = await this.generateUniqueName(
      userId,
      existing.contextKey,
      baseName,
      {
        scopeType: existing.scopeType as SavedFilterScopeType,
        scopeTeamId: existing.scopeTeamId,
      }
    );

    const [row] = await this.db.db
      .insert(activitySavedFilters)
      .values({
        ownerUserId: userId,
        contextKey: existing.contextKey,
        name,
        filterState: existing.filterState,
        searchKeyword: existing.searchKeyword,
        isDefault: false,
        scopeType: existing.scopeType,
        scopeTeamId: existing.scopeTeamId,
      })
      .returning();

    this.logger.log(
      `Duplicated saved filter ${filterId} as ${row.id} for user ${userId}`
    );

    return this.mapToResponse(row);
  }

  async remove(userId: number, filterId: number): Promise<void> {
    await this.findOwnedOrFail(userId, filterId);

    await this.db.db
      .update(activitySavedFilters)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(activitySavedFilters.id, filterId));

    this.logger.log(`Soft-deleted saved filter ${filterId} for user ${userId}`);
  }

  // ------------------------------------------------------------------
  // Internal helpers
  // ------------------------------------------------------------------

  private assertSavedFilterPayloadNotEmpty(
    filterState: Record<string, unknown>,
    searchKeyword: string | null | undefined
  ): void {
    if (savedFilterPayloadIsEmpty(filterState, searchKeyword)) {
      throw new BadRequestException(SAVED_FILTER_EMPTY_PAYLOAD_MESSAGE);
    }
  }

  private async findOwnedOrFail(
    userId: number,
    filterId: number
  ): Promise<SavedFilterRow> {
    const [row] = await this.db.db
      .select()
      .from(activitySavedFilters)
      .where(
        and(
          eq(activitySavedFilters.id, filterId),
          eq(activitySavedFilters.isActive, true)
        )
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Saved filter ${filterId} not found`);
    }

    if (row.ownerUserId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to modify this saved filter'
      );
    }

    return row;
  }

  private async assertNameUnique(
    userId: number,
    contextKey: string,
    name: string,
    scope: ScopeResolution,
    excludeId?: number
  ): Promise<void> {
    const lowerName = name.toLowerCase();

    const conditions: SQL[] = this.getNameMatchConditions(
      userId,
      contextKey,
      lowerName,
      scope
    );

    if (excludeId !== undefined) {
      conditions.push(sql`${activitySavedFilters.id} != ${excludeId}`);
    }

    const [existing] = await this.db.db
      .select({ id: activitySavedFilters.id })
      .from(activitySavedFilters)
      .where(and(...conditions))
      .limit(1);

    if (existing) {
      throw new ConflictException(
        `A saved filter named "${name}" already exists in this context`
      );
    }
  }

  private async clearDefaultForContext(
    userId: number,
    contextKey: string,
    scope: ScopeResolution
  ): Promise<void> {
    const conditions: SQL[] = [
      eq(activitySavedFilters.contextKey, contextKey),
      eq(activitySavedFilters.isDefault, true),
      eq(activitySavedFilters.isActive, true),
    ];
    if (scope.scopeType === 'user') {
      conditions.push(eq(activitySavedFilters.scopeType, 'user'));
      conditions.push(eq(activitySavedFilters.ownerUserId, userId));
    } else if (scope.scopeType === 'team') {
      conditions.push(eq(activitySavedFilters.scopeType, 'team'));
      conditions.push(eq(activitySavedFilters.scopeTeamId, scope.scopeTeamId!));
    } else {
      conditions.push(eq(activitySavedFilters.scopeType, 'global'));
    }

    await this.db.db
      .update(activitySavedFilters)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(and(...conditions));
  }

  private async generateUniqueName(
    userId: number,
    contextKey: string,
    baseName: string,
    scope: ScopeResolution
  ): Promise<string> {
    let candidate = baseName;
    let suffix = 2;
    const maxAttempts = 50;

    for (let i = 0; i < maxAttempts; i++) {
      const lowerCandidate = candidate.toLowerCase();
      const [existing] = await this.db.db
        .select({ id: activitySavedFilters.id })
        .from(activitySavedFilters)
        .where(
          and(
            ...this.getNameMatchConditions(
              userId,
              contextKey,
              lowerCandidate,
              scope
            )
          )
        )
        .limit(1);

      if (!existing) return candidate;

      const copyPattern = / \(copy(?: \d+)?\)$/;
      if (copyPattern.test(baseName)) {
        candidate = baseName.replace(copyPattern, ` (copy ${suffix})`);
      } else {
        candidate = `${baseName} (copy ${suffix})`;
      }
      suffix++;
    }

    return candidate;
  }

  private getNameMatchConditions(
    userId: number,
    contextKey: string,
    lowerName: string,
    scope: ScopeResolution
  ): SQL[] {
    const conditions: SQL[] = [
      eq(activitySavedFilters.contextKey, contextKey),
      eq(activitySavedFilters.isActive, true),
      sql`lower(${activitySavedFilters.name}) = ${lowerName}`,
    ];
    if (scope.scopeType === 'user') {
      conditions.push(eq(activitySavedFilters.scopeType, 'user'));
      conditions.push(eq(activitySavedFilters.ownerUserId, userId));
    } else if (scope.scopeType === 'team') {
      conditions.push(eq(activitySavedFilters.scopeType, 'team'));
      conditions.push(eq(activitySavedFilters.scopeTeamId, scope.scopeTeamId!));
    } else {
      conditions.push(eq(activitySavedFilters.scopeType, 'global'));
    }
    return conditions;
  }

  private resolveScope(input: {
    scopeType?: string;
    scopeTeamId?: number | null;
    teamIds?: number[];
  }): ScopeResolution {
    const scopeType = (input.scopeType ?? 'user') as SavedFilterScopeType;
    if (
      scopeType !== 'user' &&
      scopeType !== 'team' &&
      scopeType !== 'global'
    ) {
      throw new BadRequestException(`Invalid scopeType: ${input.scopeType}`);
    }

    if (scopeType === 'team') {
      if (input.scopeTeamId == null) {
        throw new BadRequestException(
          'scopeTeamId is required when scopeType is team'
        );
      }
      const teamIds = input.teamIds ?? [];
      if (!teamIds.includes(input.scopeTeamId)) {
        throw new ForbiddenException(
          'You can only share a filter with one of your teams'
        );
      }
      return { scopeType, scopeTeamId: input.scopeTeamId };
    }

    return { scopeType, scopeTeamId: null };
  }

  private mapToResponse(row: SavedFilterRow): SavedFilterResponse {
    return {
      id: row.id,
      ownerUserId: row.ownerUserId,
      contextKey: row.contextKey,
      name: row.name,
      filterState: row.filterState as Record<string, unknown>,
      searchKeyword: row.searchKeyword,
      isDefault: row.isDefault,
      sortOrder: row.sortOrder,
      scopeType: row.scopeType as SavedFilterScopeType,
      scopeTeamId: row.scopeTeamId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
