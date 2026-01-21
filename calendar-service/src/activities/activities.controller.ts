import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
  Query,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { ActivitiesService } from './services/activities.service';
import {
  createActivityRequestSchema,
  updateActivityRequestSchema,
  filterActivitiesQuerySchema,
  softDeleteRequestSchema,
  updateCategoriesSchema,
  updateThemesSchema,
  updateTagsSchema,
  updateSharedWithSchema,
} from '@corpcal/shared/schemas';
import type { ActivityResponse } from '@corpcal/shared/api';
import type {
  CreateActivityRequest,
  UpdateActivityRequest,
  FilterActivitiesQueryParams,
  SoftDeleteRequest,
} from '@corpcal/shared/schemas';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AppLogger } from '../common/logger/logger.service';
import type { Category } from '@corpcal/database/types';
import {
  CreateActivityDto,
  UpdateActivityDto,
  SoftDeleteDto,
  ActivityResponseWrapperDto,
  ActivityArrayResponseWrapperDto,
  UpdateCategoriesDto,
  UpdateThemesDto,
  UpdateTagsDto,
  UpdateSharedWithDto,
} from '../common/dto';

@ApiTags('activities')
@Controller('activities')
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
  @Post()
  @UsePipes(new ZodValidationPipe(createActivityRequestSchema))
  async create(
    @Body() body: CreateActivityRequest
  ): Promise<{ success: boolean; data: ActivityResponse }> {
    this.logger.debug(
      `Create activity request received: ${JSON.stringify(body)}`
    );

    // body is now validated and typed by ZodValidationPipe
    const result = await this.activitiesService.create(body);
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
  @Get()
  async findAll(
    @Query(new ZodValidationPipe(filterActivitiesQuerySchema))
    query: FilterActivitiesQueryParams
  ): Promise<{ success: boolean; data: ActivityResponse[] }> {
    // query is now validated and typed by ZodValidationPipe
    // filterActivitiesQuerySchema has defaults for page/limit, so query will always have those
    // Check if there are any actual filter fields (excluding pagination defaults)
    // TODO: refine to only use necessary filters (filtering will happen on the frontend)
    const hasFilters =
      query.title !== undefined ||
      query.startDateFrom !== undefined ||
      query.startDateTo !== undefined ||
      query.endDateFrom !== undefined ||
      query.endDateTo !== undefined ||
      query.activityStatusId !== undefined ||
      query.leadMinistryId !== undefined ||
      query.city !== undefined ||
      query.isIssue !== undefined;
    const filters = hasFilters ? query : undefined;
    const results = await this.activitiesService.findAll(filters);
    return {
      success: true,
      data: results,
    };
  }

  @ApiOperation({
    summary: 'Get all activity categories',
    description:
      'Retrieves all available activity categories for use in forms and filters.',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    type: ActivityArrayResponseWrapperDto,
  })
  @Get('categories')
  async fetchCategories(): Promise<{
    success: boolean;
    data: Category[];
  }> {
    // TODO: Retrieve user teams from authentication context when user team retrieval is implemented
    // For now, passing undefined returns only global categories
    const userTeams: number[] | undefined = undefined;
    const results = await this.activitiesService.fetchCategories(userTeams);
    return {
      success: true,
      data: results,
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
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number
  ): Promise<{ success: boolean; data: ActivityResponse }> {
    const result = await this.activitiesService.findOne(id);
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
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateActivityRequestSchema))
    body: UpdateActivityRequest
  ): Promise<{ success: boolean; data: ActivityResponse }> {
    // body is now validated and typed by ZodValidationPipe
    const result = await this.activitiesService.update(id, body);
    return {
      success: true,
      data: result,
    };
  }

  @ApiOperation({
    summary: 'Update activity (full update)',
    description:
      'Fully updates an activity. All fields must be provided (same schema as create).',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Activity ID',
    example: 1,
  })
  @ApiBody({ type: CreateActivityDto })
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
  @Put(':id')
  async put(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(createActivityRequestSchema))
    body: CreateActivityRequest
  ): Promise<{ success: boolean; data: ActivityResponse }> {
    // PUT uses createActivityRequestSchema (all fields) but calls update
    // This ensures all fields are provided for a full update
    const result = await this.activitiesService.update(id, body);
    return {
      success: true,
      data: result,
    };
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
  @Delete(':id/soft-delete')
  async softDelete(
    @Param('id', ParseIntPipe) id: number,
    // Note: False positives - ESLint has type resolution limitations with Zod v4's type inference.
    // The schema is properly typed and validated at runtime by ZodValidationPipe.

    @Body(new ZodValidationPipe(softDeleteRequestSchema))
    body: SoftDeleteRequest
  ): Promise<{ success: boolean; data: ActivityResponse }> {
    // TODO: Get current user ID from auth context
    const currentUserId = 1;
    const result = await this.activitiesService.softDelete(
      id,

      body.reason,
      currentUserId
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
    type: ActivityArrayResponseWrapperDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Activity not found',
  })
  @Get(':id/history')
  async getHistory(@Param('id', ParseIntPipe) id: number): Promise<{
    success: boolean;
    data: Awaited<ReturnType<ActivitiesService['getHistory']>>;
  }> {
    const result = await this.activitiesService.getHistory(id);
    return {
      success: true,
      data: result,
    };
  }

  @ApiOperation({
    summary: 'Cancel changes - revert to published state',
    description:
      'Reverts an activity to its last published state, discarding any unpublished changes.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Activity ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Changes cancelled, activity reverted to published state',
    type: ActivityResponseWrapperDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Activity not found',
  })
  @Post(':id/cancel-changes')
  async cancelChanges(
    @Param('id', ParseIntPipe) id: number
  ): Promise<{ success: boolean; data: ActivityResponse }> {
    // TODO: Get current user ID from auth context
    const currentUserId = 1;
    const result = await this.activitiesService.cancelChanges(
      id,
      currentUserId
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
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number
  ): Promise<{ message: string }> {
    return this.activitiesService.remove(id);
  }

  @ApiOperation({
    summary: 'Update activity categories',
    description:
      'Updates the categories associated with an activity. Replaces all existing categories.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Activity ID',
    example: 1,
  })
  @ApiBody({ type: UpdateCategoriesDto })
  @ApiResponse({
    status: 200,
    description: 'Categories updated successfully',
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
  @Put(':id/categories')
  async updateCategories(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateCategoriesSchema))
    body: { categoryIds: number[] }
  ): Promise<{ success: boolean; data: ActivityResponse }> {
    const result = await this.activitiesService.updateCategories(
      id,
      body.categoryIds
    );
    return {
      success: true,
      data: result,
    };
  }

  @ApiOperation({
    summary: 'Update activity themes',
    description:
      'Updates the themes (tags) associated with an activity. Replaces all existing themes.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Activity ID',
    example: 1,
  })
  @ApiBody({ type: UpdateThemesDto })
  @ApiResponse({
    status: 200,
    description: 'Themes updated successfully',
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
  @Put(':id/themes')
  async updateThemes(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateThemesSchema))
    body: { themeIds: string[] }
  ): Promise<{ success: boolean; data: ActivityResponse }> {
    const result = await this.activitiesService.updateThemes(id, body.themeIds);
    return {
      success: true,
      data: result,
    };
  }

  @ApiOperation({
    summary: 'Update activity tags',
    description:
      'Updates the tags associated with an activity. Replaces all existing tags.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Activity ID',
    example: 1,
  })
  @ApiBody({ type: UpdateTagsDto })
  @ApiResponse({
    status: 200,
    description: 'Tags updated successfully',
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
  @Put(':id/tags')
  async updateTags(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateTagsSchema))
    body: { tagIds: number[] }
  ): Promise<{ success: boolean; data: ActivityResponse }> {
    const result = await this.activitiesService.updateTags(id, body.tagIds);
    return {
      success: true,
      data: result,
    };
  }

  @ApiOperation({
    summary: 'Update activity shared with ministries',
    description:
      'Updates the ministries that an activity is shared with. Replaces all existing shared ministries.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Activity ID',
    example: 1,
  })
  @ApiBody({ type: UpdateSharedWithDto })
  @ApiResponse({
    status: 200,
    description: 'Shared with ministries updated successfully',
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
  @Put(':id/shared-with')
  async updateSharedWith(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateSharedWithSchema))
    body: { teamIds: number[] }
  ): Promise<{ success: boolean; data: ActivityResponse }> {
    const result = await this.activitiesService.updateSharedWith(
      id,
      body.teamIds
    );
    return {
      success: true,
      data: result,
    };
  }
}
