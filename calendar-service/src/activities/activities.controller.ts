import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  HYDRATION_PROFILES,
  PERMISSIONS,
  type AuthUser,
} from '@corpcal/shared';
import type {
  ActivityListItem,
  ActivityResponse,
  GlobalActivityHistoryEntry,
} from '@corpcal/shared/api';
import {
  addActivityHistoryNoteRequestSchema,
  bulkUnshareActivitiesRequestSchema,
  bulkUpdateActivitiesRequestSchema,
  cloneActivityRequestSchema,
  createActivityRequestSchema,
  filterActivitiesQuerySchema,
  globalActivityHistoryQuerySchema,
  hardDeleteRequestBodySchema,
  requestDeleteRequestSchema,
  restoreRequestSchema,
  softDeleteRequestSchema,
  updateActivityRequestSchema,
  type AddActivityHistoryNoteRequest,
  type BulkUnshareActivitiesRequest,
  type BulkUnshareActivitiesResult,
  type BulkUpdateActivitiesRequest,
  type CloneActivityRequest,
  type CreateActivityRequest,
  type FilterActivitiesQueryParams,
  type GlobalActivityHistoryQuery,
  type HardDeleteRequest,
  type RequestDeleteRequest,
  type RestoreRequest,
  type SoftDeleteRequest,
  type UpdateActivityRequest,
} from '@corpcal/shared/schemas';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  ActivityArrayResponseWrapperDto,
  ActivityHistoryEntryResponseWrapperDto,
  ActivityHistoryResponseWrapperDto,
  ActivityResponseWrapperDto,
  AddActivityHistoryNoteDto,
  BulkUnshareActivitiesDto,
  BulkUpdateActivitiesDto,
  CloneActivityDto,
  CreateActivityDto,
  GlobalActivityHistoryPageResponseWrapperDto,
  RequestDeleteDto,
  RestoreDto,
  SoftDeleteDto,
  UpdateActivityDto,
} from '../common/dto';
import { AppLogger } from '../common/logger/logger.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ApiZodQueries } from '../common/swagger/zod-query.openapi';
import { RequestContext } from '../policy/decorators/request-context.decorator';
import {
  RequireAnyPermission,
  RequirePermission,
} from '../policy/decorators/require-permission.decorator';
import type { RequestContext as RequestContextType } from '../policy/dto/user-context.dto';
import { CanCloneActivityGuard } from '../policy/guards/can-clone-activity.guard';
import { CanDeleteActivityGuard } from '../policy/guards/can-delete-activity.guard';
import { CanEditActivityGuard } from '../policy/guards/can-edit-activity.guard';
import { CanRequestDeleteActivityGuard } from '../policy/guards/can-request-delete-activity.guard';
import { CanRestoreActivityGuard } from '../policy/guards/can-restore-activity.guard';
import {
  CanUnshareActivityTeamGuard,
  canUnshareTeam,
} from '../policy/guards/can-unshare-activity-team.guard';
import { ActivityResponseRedactionInterceptor } from './interceptors/activity-response-redaction.interceptor';
import { ActivitiesService } from './services/activities.service';
import { hasActivityFindAllFilterFields } from './services/activity-find-all-filters';

@ApiTags('activities')
@Controller('activities')
@UseInterceptors(ActivityResponseRedactionInterceptor)
export class ActivitiesController {
  private readonly logger = new AppLogger(ActivitiesController.name);

  constructor(private readonly activitiesService: ActivitiesService) {}

  @ApiOperation({
    summary: 'Create activity',
    description:
      'Creates a new calendar activity with related junction table records. All required fields must be provided.',
  })
  @ApiBody({ type: CreateActivityDto })
  @ApiResponse({
    status: 201,
    description: 'Activity created successfully',
    type: ActivityResponseWrapperDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
  })
  @RequirePermission('activities.create')
  @Post()
  async create(
    @Body(new ZodValidationPipe(createActivityRequestSchema))
    body: CreateActivityRequest,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: ActivityResponse }> {
    this.logger.debug(
      `Create activity request received: ${JSON.stringify(body)}`
    );

    const result = await this.activitiesService.create(body, user.id, {
      roleName: user.roleName,
      permissions: user.permissions,
      teamIds: user.teamIds,
    });
    return {
      success: true,
      data: result,
    };
  }

  @ApiOperation({
    summary: 'Clone activity',
    description:
      'Creates a new activity using an existing activity as a template. ' +
      'Title and schedule come from the request body. Optional advanced fields ' +
      'are copied or reset based on `includeFieldPaths` (see request schema: ' +
      'when the property is omitted, the allow-list is not applied). ' +
      'Initial status follows the same rules as create: **New** by default, or ' +
      '**Reviewed** when the user has `activities.review` and `markAsReviewed` ' +
      'is true. Users without review permission do not get Reviewed from this flag. ' +
      'Provenance is recorded in history on the new activity (created) and the ' +
      'source (cloned), including optional `activityHistoryNotes` on both.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Source activity ID',
    example: 1,
  })
  @ApiBody({ type: CloneActivityDto })
  @ApiResponse({
    status: 201,
    description: 'Activity cloned successfully',
    type: ActivityResponseWrapperDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
  })
  @ApiResponse({
    status: 403,
    description:
      'User cannot clone this activity (lacks edit eligibility on the source, ' +
      'or source is in a blocked status and user lacks activities.delete.any).',
  })
  @ApiResponse({
    status: 404,
    description: 'Source activity not found',
  })
  @RequirePermission('activities.create')
  @UseGuards(CanCloneActivityGuard)
  @Post(':id/clone')
  async clone(
    @Param('id', ParseIntPipe) sourceId: number,
    @Body(new ZodValidationPipe(cloneActivityRequestSchema))
    body: CloneActivityRequest,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: ActivityResponse }> {
    const result = await this.activitiesService.clone(sourceId, body, user.id, {
      roleName: user.roleName,
      permissions: user.permissions,
      teamIds: user.teamIds,
    });
    return {
      success: true,
      data: result,
    };
  }

  @ApiOperation({
    summary: 'Get all activities',
    description:
      'Retrieves all activities with optional filtering and pagination. Supports filtering by title, dates, status, ministry, city, and flags.',
  })
  @ApiResponse({
    status: 200,
    description: 'Activities retrieved successfully',
    type: ActivityArrayResponseWrapperDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
  })
  @ApiZodQueries(filterActivitiesQuerySchema)
  @RequirePermission('activities.view')
  @Get()
  async findAll(
    @Query(new ZodValidationPipe(filterActivitiesQuerySchema))
    query: FilterActivitiesQueryParams,
    @RequestContext() ctx: RequestContextType
  ): Promise<{ success: boolean; data: ActivityListItem[] }> {
    // query is now validated and typed by ZodValidationPipe
    // filterActivitiesQuerySchema has defaults for page/limit, so query will always have those
    // Check if there are any actual filter fields (excluding pagination defaults)
    const hasFilters = hasActivityFindAllFilterFields(query);
    const filters = hasFilters ? query : undefined;
    const results = await this.activitiesService.findAll(filters, ctx, {
      profile: {
        ...HYDRATION_PROFILES.list,
        includeReviewDiff: true,
      },
      outputShape: 'list',
      includeEditLocks: true,
    });
    return {
      success: true,
      data: results,
    };
  }

  @ApiOperation({
    summary: 'Get global activity history',
    description:
      'Retrieves activity history entries across all activities visible to the current user.',
  })
  @ApiZodQueries(globalActivityHistoryQuerySchema)
  @ApiResponse({
    status: 200,
    description: 'Global activity history retrieved successfully',
    type: GlobalActivityHistoryPageResponseWrapperDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
  })
  @RequirePermission('activities.view')
  @Get('global-history')
  async getGlobalHistory(
    @Query(new ZodValidationPipe(globalActivityHistoryQuerySchema))
    queryParams: GlobalActivityHistoryQuery,
    @RequestContext() ctx?: RequestContextType
  ): Promise<{
    success: boolean;
    data: {
      items: GlobalActivityHistoryEntry[];
      page: number;
      pageSize: number;
      hasNext: boolean;
      totalItems: number;
    };
  }> {
    const result = await this.activitiesService.getGlobalHistoryPaged(
      {
        startDate: queryParams.startDate,
        endDate: queryParams.endDate,
        page: queryParams.page,
        pageSize: queryParams.pageSize,
        query: queryParams.query,
        order: queryParams.order,
        userId: queryParams.userId,
        userIds: queryParams.userIds,
        actionTypes: queryParams.actionTypes,
        categoryNames: queryParams.categories,
        leadTeamIds: queryParams.leadTeamIds,
      },
      ctx
    );

    return {
      success: true,
      data: result,
    };
  }

  @ApiOperation({
    summary: 'Get activity by ID',
    description: 'Retrieves a single activity by its ID with all related data.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Activity ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Activity found',
    type: ActivityResponseWrapperDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Activity not found',
  })
  @RequirePermission('activities.view')
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @RequestContext() ctx: RequestContextType
  ): Promise<{ success: boolean; data: ActivityResponse }> {
    const result = await this.activitiesService.findOne(id, ctx);
    return {
      success: true,
      data: result,
    };
  }

  @ApiOperation({
    summary: 'Update activity (partial update)',
    description:
      'Partially updates an activity. Only provided fields will be updated. All fields are optional.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Activity ID',
    example: 1,
  })
  @ApiBody({ type: UpdateActivityDto })
  @ApiResponse({
    status: 200,
    description: 'Activity updated successfully',
    type: ActivityResponseWrapperDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
  })
  @ApiResponse({
    status: 404,
    description: 'Activity not found',
  })
  @RequirePermission('activities.edit')
  @UseGuards(CanEditActivityGuard)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateActivityRequestSchema))
    body: UpdateActivityRequest,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: ActivityResponse }> {
    const result = await this.activitiesService.update(id, body, user.id, {
      roleName: user.roleName,
      permissions: user.permissions,
      teamIds: user.teamIds,
    });
    return {
      success: true,
      data: result,
    };
  }

  @ApiOperation({
    summary: 'Bulk update activities',
    description:
      'Marks selected activities reviewed or changes their pitch-required status without acquiring individual edit locks. Requires activities.bulkUpdate and the permission required for the selected operation.',
  })
  @ApiBody({ type: BulkUpdateActivitiesDto })
  @ApiResponse({
    status: 200,
    description: 'Activities updated successfully',
    type: ActivityArrayResponseWrapperDto,
  })
  @RequirePermission(PERMISSIONS.ACTIVITIES.BULK_UPDATE)
  @Post('bulk-update')
  async bulkUpdate(
    @Body(new ZodValidationPipe(bulkUpdateActivitiesRequestSchema))
    body: BulkUpdateActivitiesRequest,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: ActivityResponse[] }> {
    const result = await this.activitiesService.bulkUpdate(body, user.id, {
      roleName: user.roleName,
      permissions: user.permissions,
      teamIds: user.teamIds,
    });
    return { success: true, data: result };
  }

  @ApiOperation({
    summary: 'Bulk unshare activities from a team',
    description:
      "Removes one team from several activities' Shared With lists. Requires activities.unshare and membership of the team (or activities.unshare.all). Activities that are not shared with the team, or are locked by another user, are reported as skipped rather than failing the batch.",
  })
  @ApiBody({ type: BulkUnshareActivitiesDto })
  @ApiResponse({
    status: 200,
    description:
      'Per-activity outcomes and a summary of updated/skipped counts',
  })
  @ApiResponse({
    status: 403,
    description: 'Caller may not unshare the requested team',
  })
  @RequireAnyPermission(
    PERMISSIONS.ACTIVITIES.UNSHARE,
    PERMISSIONS.ACTIVITIES.UNSHARE_ALL
  )
  @Post('bulk-unshare')
  async bulkUnshare(
    @Body(new ZodValidationPipe(bulkUnshareActivitiesRequestSchema))
    body: BulkUnshareActivitiesRequest,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: BulkUnshareActivitiesResult }> {
    // Team eligibility is enforced here rather than by CanUnshareActivityTeamGuard,
    // which reads teamId from the route params.
    if (!canUnshareTeam(user, body.teamId)) {
      throw new ForbiddenException(
        'You may only unshare an activity from a team you belong to.'
      );
    }

    const result = await this.activitiesService.bulkUnshareTeam(
      body.activityIds,
      body.teamId,
      user.id
    );
    return { success: true, data: result };
  }

  @ApiOperation({
    summary: 'Soft delete activity',
    description:
      'Soft deletes an activity by marking it as deleted. Requires a reason for audit purposes. The activity is not permanently removed.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Activity ID',
    example: 1,
  })
  @ApiBody({ type: SoftDeleteDto })
  @ApiResponse({
    status: 200,
    description: 'Activity soft deleted successfully',
    type: ActivityResponseWrapperDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed - reason too short or missing',
  })
  @ApiResponse({
    status: 404,
    description: 'Activity not found',
  })
  @UseGuards(CanDeleteActivityGuard)
  @Delete(':id/soft-delete')
  async softDelete(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(softDeleteRequestSchema))
    body: SoftDeleteRequest,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: ActivityResponse }> {
    const result = await this.activitiesService.softDelete(
      id,
      body.reason,
      user.id,
      { permissions: user.permissions, teamIds: user.teamIds }
    );
    return {
      success: true,
      data: result,
    };
  }

  @ApiOperation({
    summary: 'Request delete (comms contacts)',
    description:
      'Sets activity status to delete_requested. Only comms contacts on the activity may call this. Not allowed when status is already delete_requested or deleted.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Activity ID',
    example: 1,
  })
  @ApiBody({ type: RequestDeleteDto })
  @ApiResponse({
    status: 200,
    description: 'Activity status set to delete requested',
    type: ActivityResponseWrapperDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed - reason too short or missing',
  })
  @ApiResponse({
    status: 404,
    description: 'Activity not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Activity is already delete_requested or deleted',
  })
  @UseGuards(CanRequestDeleteActivityGuard)
  @Post(':id/request-delete')
  async requestDelete(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(requestDeleteRequestSchema))
    body: RequestDeleteRequest,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: ActivityResponse }> {
    const result = await this.activitiesService.requestDelete(
      id,
      body.reason,
      user.id
    );
    return {
      success: true,
      data: result,
    };
  }

  @ApiOperation({
    summary: 'Restore activity',
    description:
      'Restores an activity from delete_requested or deleted to its previous status. Deleted: requires activities.delete.any. Delete requested: requires activities.requestDelete, activities.delete, or activities.delete.any plus comms contact, lead-team member, or admin/sysAdmin.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Activity ID',
    example: 1,
  })
  @ApiBody({ type: RestoreDto })
  @ApiResponse({
    status: 200,
    description: 'Activity restored',
    type: ActivityResponseWrapperDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Activity is not in delete_requested or deleted status',
  })
  @ApiResponse({
    status: 404,
    description: 'Activity not found',
  })
  @UseGuards(CanRestoreActivityGuard)
  @Post(':id/restore')
  async restore(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(restoreRequestSchema)) body: RestoreRequest,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: ActivityResponse }> {
    this.logger.log(`Restore requested for activity ${id} by user ${user.id}`);
    const result = await this.activitiesService.restore(
      id,
      user.id,
      body.note,
      { roleName: user.roleName }
    );
    this.logger.log(
      `Activity ${id} restored to status "${result.activityStatus ?? 'unknown'}"`
    );
    return {
      success: true,
      data: result,
    };
  }

  @ApiOperation({
    summary: 'Get activity history',
    description:
      'Retrieves the change history for an activity, including all modifications and who made them.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Activity ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Activity history retrieved successfully',
    type: ActivityHistoryResponseWrapperDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Activity not found',
  })
  @RequirePermission('activities.view')
  @Get(':id/history')
  async getHistory(
    @Param('id', ParseIntPipe) id: number,
    @RequestContext() ctx: RequestContextType
  ): Promise<{
    success: boolean;
    data: Awaited<ReturnType<ActivitiesService['getHistory']>>;
  }> {
    const result = await this.activitiesService.getHistory(id, ctx);
    return {
      success: true,
      data: result,
    };
  }

  @ApiOperation({
    summary: 'Add activity history note',
    description:
      'Adds a standalone note to the activity history timeline without changing activity fields.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Activity ID',
    example: 1,
  })
  @ApiBody({ type: AddActivityHistoryNoteDto })
  @ApiResponse({
    status: 201,
    description: 'Activity history note added successfully',
    type: ActivityHistoryEntryResponseWrapperDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Activity not found',
  })
  @RequirePermission('activities.edit')
  @UseGuards(CanEditActivityGuard)
  @Post(':id/history/notes')
  async addHistoryNote(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(addActivityHistoryNoteRequestSchema))
    body: AddActivityHistoryNoteRequest,
    @CurrentUser() user: AuthUser,
    @RequestContext() ctx: RequestContextType
  ): Promise<{
    success: boolean;
    data: Awaited<ReturnType<ActivitiesService['addHistoryNote']>>;
  }> {
    const result = await this.activitiesService.addHistoryNote(
      id,
      body.note,
      user.id,
      ctx
    );
    return {
      success: true,
      data: result,
    };
  }

  @ApiOperation({
    summary: 'Delete activity (hard delete)',
    description:
      'Permanently deletes an activity from the database. This action cannot be undone. Use soft delete for safer removal.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Activity ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Activity permanently deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Activity not found',
  })
  @ApiBody({
    required: false,
    description: 'Optional reason for audit (stored in deletion_audit).',
    schema: { type: 'object', properties: { reason: { type: 'string' } } },
  })
  @UseGuards(CanDeleteActivityGuard)
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(hardDeleteRequestBodySchema))
    body: HardDeleteRequest = {}
  ): Promise<{ message: string }> {
    return this.activitiesService.remove(
      id,
      user.id,
      {
        permissions: user.permissions,
        teamIds: user.teamIds,
      },
      { reason: body.reason }
    );
  }

  @ApiOperation({
    summary: 'Unshare an activity from a team',
    description:
      "Removes a single team from an activity's Shared With list. Only the team's own members (or a bypass role) may remove it.",
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Activity ID',
    example: 1,
  })
  @ApiParam({
    name: 'teamId',
    type: Number,
    description: 'Team ID to remove from the Shared With list',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Activity unshared from team successfully',
    type: ActivityResponseWrapperDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Activity is not currently shared with that team',
  })
  @ApiResponse({
    status: 404,
    description: 'Activity not found',
  })
  @RequireAnyPermission(
    PERMISSIONS.ACTIVITIES.UNSHARE,
    PERMISSIONS.ACTIVITIES.UNSHARE_ALL
  )
  @UseGuards(CanUnshareActivityTeamGuard)
  @Delete(':id/shared-with/:teamId')
  async unshareTeam(
    @Param('id', ParseIntPipe) id: number,
    @Param('teamId', ParseIntPipe) teamId: number,
    @CurrentUser() user: AuthUser,
    @RequestContext() ctx: RequestContextType
  ): Promise<{ success: boolean; data: ActivityResponse }> {
    const result = await this.activitiesService.unshareTeam(
      id,
      teamId,
      user.id,
      ctx
    );
    return {
      success: true,
      data: result,
    };
  }
}
