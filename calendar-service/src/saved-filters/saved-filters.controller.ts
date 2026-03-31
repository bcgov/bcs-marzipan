import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { PERMISSIONS, type AuthUser } from '@corpcal/shared';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AppLogger } from '../common/logger/logger.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { RequirePermission } from '../policy/decorators/require-permission.decorator';
import {
  CreateSavedFilterDto,
  DuplicateSavedFilterDto,
  SavedFilterListResponseDto,
  SavedFilterResponseDto,
  SetMyDefaultSavedFilterDto,
  UpdateSavedFilterDto,
} from './dto/saved-filter.dto';
import {
  createSavedFilterBodySchema,
  duplicateSavedFilterBodySchema,
  savedFilterQuerySchema,
  setMyDefaultSavedFilterBodySchema,
  updateSavedFilterBodySchema,
} from './dto/saved-filter.schema';
import { SavedFiltersService } from './saved-filters.service';

@ApiTags('activity-saved-filters')
@Controller('activity-saved-filters')
export class SavedFiltersController {
  private readonly logger = new AppLogger(SavedFiltersController.name);

  constructor(private readonly savedFiltersService: SavedFiltersService) {}

  @ApiOperation({
    summary: 'List saved filters for a context',
    description:
      'Returns saved filters owned by the current user (and team-shared filters visible to the user) for the given context key.',
  })
  @ApiQuery({
    name: 'contextKey',
    required: true,
    type: String,
    description:
      'Activity list context key (e.g. "all", "my-activities", "ministry:team:5")',
  })
  @ApiResponse({
    status: 200,
    description: 'Saved filters retrieved',
    type: SavedFilterListResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Missing or invalid contextKey query parameter',
  })
  @RequirePermission('savedFilters.view')
  @Get()
  async list(
    @CurrentUser() user: AuthUser,
    @Query('contextKey') contextKey: string | undefined
  ): Promise<{ success: boolean; data: SavedFilterListResponseDto }> {
    const trimmed = typeof contextKey === 'string' ? contextKey.trim() : '';
    const parsed = savedFilterQuerySchema.safeParse({ contextKey: trimmed });
    if (!parsed.success) {
      throw new BadRequestException(
        'Query parameter contextKey is required and must be 1–100 characters.'
      );
    }
    const { filters, defaultSavedFilterId } =
      await this.savedFiltersService.listByContext(
        user.id,
        parsed.data.contextKey,
        user.teamIds ?? []
      );
    return {
      success: true,
      data: { filters, count: filters.length, defaultSavedFilterId },
    };
  }

  @ApiOperation({
    summary: 'Create a saved filter',
    description:
      'Creates a new saved filter for the current user in the specified context.',
  })
  @ApiBody({ type: CreateSavedFilterDto })
  @ApiResponse({
    status: 201,
    description: 'Saved filter created',
    type: SavedFilterResponseDto,
  })
  @RequirePermission('savedFilters.create')
  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createSavedFilterBodySchema))
    body: CreateSavedFilterDto
  ): Promise<{ success: boolean; data: SavedFilterResponseDto }> {
    try {
      this.assertScopePermission(user, body.scopeType);
      this.logger.log(
        `Creating saved filter "${body.name}" for user ${user.id}`
      );
      const data = await this.savedFiltersService.create(user.id, body, {
        teamIds: user.teamIds ?? [],
      });
      return { success: true, data };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to create saved filter: ${message}`);
      throw error;
    }
  }

  @ApiOperation({
    summary: 'Set or clear my default saved filter for a context',
    description:
      'Persists which saved filter is applied on load for this user and activity list tab. Does not modify shared preset rows.',
  })
  @ApiBody({ type: SetMyDefaultSavedFilterDto })
  @ApiResponse({
    status: 200,
    description: 'Default updated',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            defaultSavedFilterId: { type: 'number', nullable: true },
          },
        },
      },
    },
  })
  @RequirePermission('savedFilters.view')
  @Patch('my-default')
  async setMyDefault(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(setMyDefaultSavedFilterBodySchema))
    body: SetMyDefaultSavedFilterDto
  ): Promise<{
    success: boolean;
    data: { defaultSavedFilterId: number | null };
  }> {
    const data = await this.savedFiltersService.setMyDefault(
      user.id,
      body.contextKey,
      body.savedFilterId,
      user.teamIds ?? []
    );
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Update a saved filter',
    description:
      'Updates name, filter payload, search keyword, or sharing scope of a saved filter.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateSavedFilterDto })
  @ApiResponse({
    status: 200,
    description: 'Saved filter updated',
    type: SavedFilterResponseDto,
  })
  @RequirePermission('savedFilters.edit')
  @Patch(':id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateSavedFilterBodySchema))
    body: UpdateSavedFilterDto
  ): Promise<{ success: boolean; data: SavedFilterResponseDto }> {
    this.assertScopePermission(user, body.scopeType);
    this.logger.log(`Updating saved filter ${id} for user ${user.id}`);
    const data = await this.savedFiltersService.update(user.id, id, body, {
      teamIds: user.teamIds ?? [],
    });
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Duplicate a saved filter',
    description:
      'Creates a copy of an existing saved filter with a unique name.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: DuplicateSavedFilterDto })
  @ApiResponse({
    status: 201,
    description: 'Saved filter duplicated',
    type: SavedFilterResponseDto,
  })
  @RequirePermission('savedFilters.create')
  @Post(':id/duplicate')
  async duplicate(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(duplicateSavedFilterBodySchema))
    body: DuplicateSavedFilterDto
  ): Promise<{ success: boolean; data: SavedFilterResponseDto }> {
    this.logger.log(`Duplicating saved filter ${id} for user ${user.id}`);
    const { scopeType, row } =
      await this.savedFiltersService.getOwnedFilterForDuplicate(user.id, id);
    this.assertScopePermission(user, scopeType);
    const data = await this.savedFiltersService.duplicate(user.id, body, row);
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Delete a saved filter',
    description: 'Soft-deletes a saved filter owned by the current user.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Saved filter deleted' })
  @RequirePermission('savedFilters.delete')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number
  ): Promise<void> {
    this.logger.log(`Deleting saved filter ${id} for user ${user.id}`);
    await this.savedFiltersService.remove(user.id, id);
  }

  private assertScopePermission(user: AuthUser, scopeType?: string): void {
    if (!scopeType || scopeType === 'user') return;

    if (scopeType === 'team') {
      if (!user.permissions.includes(PERMISSIONS.SAVED_FILTERS.SHARE_TEAM)) {
        throw new ForbiddenException(
          'You do not have permission to share saved filters with your team.'
        );
      }
      return;
    }

    if (scopeType === 'global') {
      if (!user.permissions.includes(PERMISSIONS.SAVED_FILTERS.SHARE_GLOBAL)) {
        throw new ForbiddenException(
          'You do not have permission to share saved filters with all users.'
        );
      }
      return;
    }

    throw new ForbiddenException(`Invalid scope type: ${scopeType}`);
  }
}
