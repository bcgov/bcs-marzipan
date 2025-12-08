import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
  Query,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import {
  createActivityRequestSchema,
  updateActivityRequestSchema,
  filterActivitiesSchema,
} from '@corpcal/shared/schemas';
import type { ActivityResponse } from '@corpcal/shared/api';
import type {
  CreateActivityRequest,
  UpdateActivityRequest,
  FilterActivities,
} from '@corpcal/shared/schemas';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AppLogger } from '../common/logger/logger.service';

@ApiTags('activities')
@Controller('activities')
export class ActivitiesController {
  private readonly logger = new AppLogger(ActivitiesController.name);

  constructor(private readonly activitiesService: ActivitiesService) {}

  @ApiOperation({ summary: 'Create activity' })
  @ApiResponse({ status: 201, description: 'Activity created' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiBody({ description: 'Activity data' })
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

  @ApiOperation({ summary: 'Get all activities' })
  @ApiResponse({ status: 200, description: 'All activities found' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @Get()
  async findAll(
    @Query(new ZodValidationPipe(filterActivitiesSchema))
    query: FilterActivities
  ): Promise<{ success: boolean; data: ActivityResponse[] }> {
    // query is now validated and typed by ZodValidationPipe
    // filterActivitiesSchema has defaults for page/limit, so query will always have those
    // Check if there are any actual filter fields (excluding pagination defaults)
    const hasFilters =
      query.title !== undefined ||
      query.startDateFrom !== undefined ||
      query.startDateTo !== undefined ||
      query.endDateFrom !== undefined ||
      query.endDateTo !== undefined ||
      query.activityStatusId !== undefined ||
      query.contactMinistryId !== undefined ||
      query.cityId !== undefined ||
      query.isActive !== undefined ||
      query.isConfidential !== undefined ||
      query.isIssue !== undefined;
    const filters = hasFilters ? query : undefined;
    const results = await this.activitiesService.findAll(filters);
    return {
      success: true,
      data: results,
    };
  }

  @ApiOperation({ summary: 'Get activity' })
  @ApiResponse({ status: 200, description: 'Activity found' })
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

  @ApiOperation({ summary: 'Update activity' })
  @ApiResponse({ status: 200, description: 'Activity updated' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateActivityRequestSchema))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateActivityRequest
  ): Promise<{ success: boolean; data: ActivityResponse }> {
    // body is now validated and typed by ZodValidationPipe
    const result = await this.activitiesService.update(id, body);
    return {
      success: true,
      data: result,
    };
  }

  @ApiOperation({ summary: 'Delete activity' })
  @ApiResponse({ status: 200, description: 'Activity deleted' })
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number
  ): Promise<{ message: string }> {
    return this.activitiesService.remove(id);
  }
}
