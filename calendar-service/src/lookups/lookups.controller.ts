import { Controller, Get, Query, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import type {
  LookupItem,
  LookupQueryParams,
  OrganizationLookupItem,
} from '@corpcal/shared/api/types';
import {
  REFERENCE_LOOKUP_CACHE_SECONDS,
  DYNAMIC_LOOKUP_CACHE_SECONDS,
} from '@corpcal/shared';
import { LookupsService } from './lookups.service';
import { AppLogger } from '../common/logger/logger.service';
import { ParseOptionalIntPipe } from '../common/pipes/parse-optional-int.pipe';
import { LookupArrayResponseWrapperDto } from '../common/dto';

@ApiTags('lookups')
@Controller('lookups')
export class LookupsController {
  private readonly logger = new AppLogger(LookupsController.name);

  constructor(private readonly lookupsService: LookupsService) {}

  @ApiOperation({
    summary: 'Get all categories',
    description:
      'Retrieves all activity categories. Results are cached for 1 hour.',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    type: LookupArrayResponseWrapperDto,
  })
  @Get('categories')
  @Header('Cache-Control', `public, max-age=${REFERENCE_LOOKUP_CACHE_SECONDS}`)
  async getCategories(): Promise<{ success: boolean; data: LookupItem[] }> {
    // TODO: Retrieve user teams from authentication context when user team retrieval is implemented
    // For now, passing undefined returns only global categories
    const userTeams: number[] | undefined = undefined;
    const data = await this.lookupsService.getCategories(userTeams);
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Get all organizations',
    description:
      'Retrieves organizations filtered by user context. Results are cached for 1 hour.',
  })
  @ApiResponse({
    status: 200,
    description: 'Organizations retrieved successfully',
    type: LookupArrayResponseWrapperDto,
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: Number,
    description: 'Filter organizations by user ID',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    type: String,
    description: 'Filter organizations by user role',
  })
  @ApiQuery({
    name: 'organizationId',
    required: false,
    type: String,
    description: 'Filter to a specific organization by UUID',
  })
  @Get('organizations')
  @Header('Cache-Control', `public, max-age=${REFERENCE_LOOKUP_CACHE_SECONDS}`)
  async getOrganizations(
    @Query('userId', new ParseOptionalIntPipe()) userId?: number,
    @Query('role') role?: string,
    @Query('organizationId') organizationId?: string
  ): Promise<{ success: boolean; data: OrganizationLookupItem[] }> {
    const params: LookupQueryParams = { userId, role, organizationId };
    const data = await this.lookupsService.getOrganizations(params);
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Get all users',
    description:
      'Retrieves users filtered by various criteria. Results are cached for 5 minutes',
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: LookupArrayResponseWrapperDto,
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: Number,
    description: 'Filter users by user ID',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    type: String,
    description: 'Filter users by role',
  })
  @ApiQuery({
    name: 'organizationId',
    required: false,
    type: String,
    description: 'Filter users by organization UUID',
  })
  @ApiQuery({
    name: 'userIds',
    required: false,
    type: String,
    description:
      'Comma-separated list of user IDs to filter by (e.g., "1,2,3")',
  })
  @Get('users')
  @Header('Cache-Control', `public, max-age=${DYNAMIC_LOOKUP_CACHE_SECONDS}`)
  async getUsers(
    @Query('userId', new ParseOptionalIntPipe()) userId?: number,
    @Query('role') role?: string,
    @Query('organizationId') organizationId?: string,
    @Query('userIds') userIds?: string
  ): Promise<{ success: boolean; data: LookupItem[] }> {
    // Parse comma-separated userIds string into array of numbers
    const parsedUserIds = userIds
      ? userIds
          .split(',')
          .map((id) => parseInt(id.trim(), 10))
          .filter((id) => !isNaN(id))
      : undefined;

    const params: LookupQueryParams = {
      userId,
      role,
      organizationId,
      userIds: parsedUserIds,
    };
    const data = await this.lookupsService.getUsers(params);
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Get all tags',
    description: 'Retrieves all available tags. Results are cached for 1 hour.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tags retrieved successfully',
    type: LookupArrayResponseWrapperDto,
  })
  @Get('tags')
  @Header('Cache-Control', `public, max-age=${REFERENCE_LOOKUP_CACHE_SECONDS}`)
  async getTags(): Promise<{ success: boolean; data: LookupItem[] }> {
    const data = await this.lookupsService.getTags();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get all activity statuses' })
  @ApiResponse({
    status: 200,
    description: 'Activity statuses retrieved successfully',
    type: LookupArrayResponseWrapperDto,
  })
  @Get('activity-statuses')
  @Header('Cache-Control', `public, max-age=${REFERENCE_LOOKUP_CACHE_SECONDS}`)
  async getActivityStatuses(): Promise<{
    success: boolean;
    data: LookupItem[];
  }> {
    const data = await this.lookupsService.getActivityStatuses();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get all pitch statuses' })
  @ApiResponse({
    status: 200,
    description: 'Pitch statuses retrieved successfully',
    type: LookupArrayResponseWrapperDto,
  })
  @Get('pitch-statuses')
  @Header('Cache-Control', `public, max-age=${REFERENCE_LOOKUP_CACHE_SECONDS}`)
  async getPitchStatuses(): Promise<{ success: boolean; data: LookupItem[] }> {
    const data = await this.lookupsService.getPitchStatuses();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get all comms materials' })
  @ApiResponse({
    status: 200,
    description: 'Comms materials retrieved successfully',
    type: LookupArrayResponseWrapperDto,
  })
  @Get('comms-materials')
  @Header('Cache-Control', `public, max-age=${REFERENCE_LOOKUP_CACHE_SECONDS}`)
  async getCommsMaterials(): Promise<{ success: boolean; data: LookupItem[] }> {
    const data = await this.lookupsService.getCommsMaterials();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get all translation languages' })
  @ApiResponse({
    status: 200,
    description: 'Translation languages retrieved successfully',
    type: LookupArrayResponseWrapperDto,
  })
  @Get('translation-languages')
  @Header('Cache-Control', `public, max-age=${REFERENCE_LOOKUP_CACHE_SECONDS}`)
  async getTranslationLanguages(): Promise<{
    success: boolean;
    data: LookupItem[];
  }> {
    const data = await this.lookupsService.getTranslationLanguages();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get all government representatives' })
  @ApiResponse({
    status: 200,
    description: 'Government representatives retrieved successfully',
    type: LookupArrayResponseWrapperDto,
  })
  @Get('government-representatives')
  @Header('Cache-Control', `public, max-age=${REFERENCE_LOOKUP_CACHE_SECONDS}`)
  async getGovernmentRepresentatives(): Promise<{
    success: boolean;
    data: LookupItem[];
  }> {
    const data = await this.lookupsService.getGovernmentRepresentatives();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get all event planners' })
  @ApiResponse({
    status: 200,
    description: 'Event planners retrieved successfully',
    type: LookupArrayResponseWrapperDto,
  })
  @Get('event-planners')
  @Header('Cache-Control', `public, max-age=${REFERENCE_LOOKUP_CACHE_SECONDS}`)
  async getEventPlanners(): Promise<{ success: boolean; data: LookupItem[] }> {
    const data = await this.lookupsService.getEventPlanners();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get all news release distributions' })
  @ApiResponse({
    status: 200,
    description: 'News release distributions retrieved successfully',
    type: LookupArrayResponseWrapperDto,
  })
  @Get('news-release-distributions')
  @Header('Cache-Control', `public, max-age=${REFERENCE_LOOKUP_CACHE_SECONDS}`)
  async getNewsReleaseDistributions(): Promise<{
    success: boolean;
    data: LookupItem[];
  }> {
    const data = await this.lookupsService.getNewsReleaseDistributions();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get all premier requested options' })
  @ApiResponse({
    status: 200,
    description: 'Premier requested options retrieved successfully',
    type: LookupArrayResponseWrapperDto,
  })
  @Get('premier-requested')
  @Header('Cache-Control', `public, max-age=${REFERENCE_LOOKUP_CACHE_SECONDS}`)
  async getPremierRequested(): Promise<{
    success: boolean;
    data: LookupItem[];
  }> {
    const data = await this.lookupsService.getPremierRequested();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get all news release origins' })
  @ApiResponse({
    status: 200,
    description: 'News release origins retrieved successfully',
    type: LookupArrayResponseWrapperDto,
  })
  @Get('news-release-origins')
  @Header('Cache-Control', `public, max-age=${REFERENCE_LOOKUP_CACHE_SECONDS}`)
  async getNewsReleaseOrigins(): Promise<{
    success: boolean;
    data: LookupItem[];
  }> {
    const data = await this.lookupsService.getNewsReleaseOrigins();
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Get activities for lookup (related activities dropdown)',
    description:
      'Retrieves a simplified list of activities for use in "Related Activities" dropdowns. Results are cached for 5 minutes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Activities retrieved successfully',
    type: LookupArrayResponseWrapperDto,
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: Number,
    description: 'Filter activities by user ID',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    type: String,
    description: 'Filter activities by user role',
  })
  @Get('activities')
  @Header('Cache-Control', `public, max-age=${DYNAMIC_LOOKUP_CACHE_SECONDS}`)
  async getActivitiesForLookup(
    @Query('userId', new ParseOptionalIntPipe()) userId?: number,
    @Query('role') role?: string
  ): Promise<{ success: boolean; data: LookupItem[] }> {
    const params: LookupQueryParams = { userId, role };
    const data = await this.lookupsService.getActivitiesForLookup(params);
    return { success: true, data };
  }
}
