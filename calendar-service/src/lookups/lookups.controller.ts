import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
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

import {
  DYNAMIC_LOOKUP_CACHE_SECONDS,
  REFERENCE_LOOKUP_CACHE_SECONDS,
  type AuthUser,
} from '@corpcal/shared';
import type {
  CategoryLookupItem,
  LookupItem,
  LookupQueryParams,
  MinistryLookupItem,
  OrganizationLookupItem,
  ThemeLookupItem,
  VenueQuickPickItem,
} from '@corpcal/shared/api/types';
import {
  createActivityStatusRequestSchema,
  createCategoryRequestSchema,
  createCityRequestSchema,
  createCommsMaterialRequestSchema,
  createGovernmentRepresentativeRequestSchema,
  createMinistryRequestSchema,
  createTagRequestSchema,
  createThemeRequestSchema,
  createVenueQuickPickRequestSchema,
  updateActivityStatusRequestSchema,
  updateCategoryRequestSchema,
  updateCityRequestSchema,
  updateCommsMaterialRequestSchema,
  updateGovernmentRepresentativeRequestSchema,
  updateMinistryRequestSchema,
  updateTagRequestSchema,
  updateThemeRequestSchema,
  updateVenueQuickPickRequestSchema,
} from '@corpcal/shared/schemas';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  ActivityStatusResponseWrapperDto,
  CategoryResponseWrapperDto,
  CityResponseWrapperDto,
  CommsMaterialResponseWrapperDto,
  CreateActivityStatusDto,
  CreateCategoryDto,
  CreateCityDto,
  CreateCommsMaterialDto,
  CreateGovernmentRepresentativeDto,
  CreateMinistryDto,
  CreateTagDto,
  CreateThemeDto,
  CreateVenueQuickPickDto,
  GovernmentRepresentativeResponseWrapperDto,
  LookupArrayResponseWrapperDto,
  MinistryResponseWrapperDto,
  TagResponseWrapperDto,
  ThemeResponseWrapperDto,
  UpdateActivityStatusDto,
  UpdateCategoryDto,
  UpdateCityDto,
  UpdateCommsMaterialDto,
  UpdateGovernmentRepresentativeDto,
  UpdateMinistryDto,
  UpdateTagDto,
  UpdateThemeDto,
  UpdateVenueQuickPickDto,
  VenueQuickPickArrayResponseWrapperDto,
  VenueQuickPickResponseWrapperDto,
} from '../common/dto';
import { AppLogger } from '../common/logger/logger.service';
import { ParseOptionalIntPipe } from '../common/pipes/parse-optional-int.pipe';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { RequirePermission } from '../policy/decorators/require-permission.decorator';
import { LookupsService } from './lookups.service';

@ApiTags('lookups')
@Controller('lookups')
@RequirePermission('lookups.view')
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
  async getCategories(): Promise<{
    success: boolean;
    data: CategoryLookupItem[];
  }> {
    // TODO: Retrieve user teams from authentication context when user team retrieval is implemented
    // For now, passing undefined returns only global categories
    const userTeams: number[] | undefined = undefined;
    const data = await this.lookupsService.getCategories(userTeams);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
    type: CategoryResponseWrapperDto,
  })
  @ApiBody({ type: CreateCategoryDto })
  @RequirePermission('lookups.manage')
  @Post('categories')
  async createCategory(
    @Body(new ZodValidationPipe(createCategoryRequestSchema))
    body: CreateCategoryDto,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: any }> {
    const data = await this.lookupsService.createCategory(body, user.id);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Update a category' })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
    type: CategoryResponseWrapperDto,
  })
  @ApiParam({ name: 'id', type: Number, description: 'Category ID' })
  @ApiBody({ type: UpdateCategoryDto })
  @RequirePermission('lookups.manage')
  @Patch('categories/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCategoryRequestSchema))
    body: UpdateCategoryDto,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: any }> {
    const transformedBody = {
      ...body,
      displayName: body.displayName === null ? undefined : body.displayName,
    };
    const data = await this.lookupsService.updateCategory(
      Number(id),
      transformedBody,
      user.id
    );
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
    type: Number,
    description: 'Filter to a specific organization by ID',
  })
  @Get('organizations')
  @Header('Cache-Control', `public, max-age=${REFERENCE_LOOKUP_CACHE_SECONDS}`)
  async getOrganizations(
    @Query('userId', new ParseOptionalIntPipe()) userId?: number,
    @Query('role') role?: string,
    @Query('organizationId', new ParseOptionalIntPipe()) organizationId?: number
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
    type: Number,
    description: 'Filter users by organization ID',
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
    @Query('organizationId', new ParseOptionalIntPipe())
    organizationId?: number,
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

  @ApiOperation({ summary: 'Create a new tag' })
  @ApiResponse({
    status: 201,
    description: 'Tag created successfully',
    type: TagResponseWrapperDto,
  })
  @ApiBody({ type: CreateTagDto })
  @RequirePermission('lookups.manage')
  @Post('tags')
  async createTag(
    @Body(new ZodValidationPipe(createTagRequestSchema))
    body: CreateTagDto,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: any }> {
    const data = await this.lookupsService.createTag(body, user.id);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Update a tag' })
  @ApiResponse({
    status: 200,
    description: 'Tag updated successfully',
    type: TagResponseWrapperDto,
  })
  @ApiParam({ name: 'id', type: String, description: 'Tag ID' })
  @ApiBody({ type: UpdateTagDto })
  @RequirePermission('lookups.manage')
  @Patch('tags/:id')
  async updateTag(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateTagRequestSchema))
    body: UpdateTagDto,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: any }> {
    const data = await this.lookupsService.updateTag(Number(id), body, user.id);
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

  @ApiOperation({ summary: 'Create a new activity status' })
  @ApiResponse({
    status: 201,
    description: 'Activity status created successfully',
    type: ActivityStatusResponseWrapperDto,
  })
  @ApiBody({ type: CreateActivityStatusDto })
  @RequirePermission('lookups.manage')
  @Post('activity-statuses')
  async createActivityStatus(
    @Body(new ZodValidationPipe(createActivityStatusRequestSchema))
    body: CreateActivityStatusDto,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: any }> {
    const data = await this.lookupsService.createActivityStatus(body, user.id);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Update an activity status' })
  @ApiResponse({
    status: 200,
    description: 'Activity status updated successfully',
    type: ActivityStatusResponseWrapperDto,
  })
  @ApiParam({ name: 'id', type: Number, description: 'Activity Status ID' })
  @ApiBody({ type: UpdateActivityStatusDto })
  @RequirePermission('lookups.manage')
  @Patch('activity-statuses/:id')
  async updateActivityStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateActivityStatusRequestSchema))
    body: UpdateActivityStatusDto,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: any }> {
    const transformedBody = {
      ...body,
      displayName: body.displayName === null ? undefined : body.displayName,
    };
    const data = await this.lookupsService.updateActivityStatus(
      Number(id),
      transformedBody,
      user.id
    );
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

  @ApiOperation({ summary: 'Create a new comms material' })
  @ApiResponse({
    status: 201,
    description: 'Comms material created successfully',
    type: CommsMaterialResponseWrapperDto,
  })
  @ApiBody({ type: CreateCommsMaterialDto })
  @RequirePermission('lookups.manage')
  @Post('comms-materials')
  async createCommsMaterial(
    @Body(new ZodValidationPipe(createCommsMaterialRequestSchema))
    body: CreateCommsMaterialDto,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: any }> {
    const data = await this.lookupsService.createCommsMaterial(body, user.id);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Update a communication material' })
  @ApiResponse({
    status: 200,
    description: 'Communication material updated successfully',
    type: CommsMaterialResponseWrapperDto,
  })
  @ApiParam({ name: 'id', type: Number, description: 'Comms Material ID' })
  @ApiBody({ type: UpdateCommsMaterialDto })
  @RequirePermission('lookups.manage')
  @Patch('comms-materials/:id')
  async updateCommsMaterial(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCommsMaterialRequestSchema))
    body: UpdateCommsMaterialDto,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: any }> {
    const data = await this.lookupsService.updateCommsMaterial(
      Number(id),
      body,
      user.id
    );
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

  @ApiOperation({ summary: 'Create a new government representative' })
  @ApiResponse({
    status: 201,
    description: 'Government representative created successfully',
    type: GovernmentRepresentativeResponseWrapperDto,
  })
  @ApiBody({ type: CreateGovernmentRepresentativeDto })
  @RequirePermission('lookups.manage')
  @Post('government-representatives')
  async createGovernmentRepresentative(
    @Body(new ZodValidationPipe(createGovernmentRepresentativeRequestSchema))
    body: CreateGovernmentRepresentativeDto,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: any }> {
    const data = await this.lookupsService.createGovernmentRepresentative(
      body,
      user.id
    );
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Update a government representative' })
  @ApiResponse({
    status: 200,
    description: 'Government representative updated successfully',
    type: GovernmentRepresentativeResponseWrapperDto,
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Government Representative ID',
  })
  @ApiBody({ type: UpdateGovernmentRepresentativeDto })
  @RequirePermission('lookups.manage')
  @Patch('government-representatives/:id')
  async updateGovernmentRepresentative(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateGovernmentRepresentativeRequestSchema))
    body: UpdateGovernmentRepresentativeDto,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: any }> {
    const data = await this.lookupsService.updateGovernmentRepresentative(
      Number(id),
      body,
      user.id
    );
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

  @ApiOperation({ summary: 'Get all cities' })
  @ApiResponse({
    status: 200,
    description: 'Cities retrieved successfully',
    type: LookupArrayResponseWrapperDto,
  })
  @Get('cities')
  @Header('Cache-Control', `public, max-age=${REFERENCE_LOOKUP_CACHE_SECONDS}`)
  async getCities(): Promise<{ success: boolean; data: LookupItem[] }> {
    const data = await this.lookupsService.getCities();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Create a new city' })
  @ApiResponse({
    status: 201,
    description: 'City created successfully',
    type: CityResponseWrapperDto,
  })
  @ApiBody({ type: CreateCityDto })
  @RequirePermission('lookups.manage')
  @Post('cities')
  async createCity(
    @Body(new ZodValidationPipe(createCityRequestSchema))
    body: CreateCityDto,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: any }> {
    const data = await this.lookupsService.createCity(body, user.id);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Update a city' })
  @ApiResponse({
    status: 200,
    description: 'City updated successfully',
    type: CityResponseWrapperDto,
  })
  @ApiParam({ name: 'id', type: Number, description: 'City ID' })
  @ApiBody({ type: UpdateCityDto })
  @RequirePermission('lookups.manage')
  @Patch('cities/:id')
  async updateCity(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCityRequestSchema))
    body: UpdateCityDto,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: any }> {
    const transformedBody = {
      ...body,
      displayName: body.displayName === null ? undefined : body.displayName,
    };
    const data = await this.lookupsService.updateCity(
      Number(id),
      transformedBody,
      user.id
    );
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get all ministries' })
  @ApiResponse({
    status: 200,
    description: 'Ministries retrieved successfully',
    type: LookupArrayResponseWrapperDto,
  })
  @Get('ministries')
  @Header('Cache-Control', `public, max-age=${REFERENCE_LOOKUP_CACHE_SECONDS}`)
  async getMinistries(): Promise<{
    success: boolean;
    data: MinistryLookupItem[];
  }> {
    const data = await this.lookupsService.getMinistries();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Create a new ministry' })
  @ApiResponse({
    status: 201,
    description: 'Ministry created successfully',
    type: MinistryResponseWrapperDto,
  })
  @ApiBody({ type: CreateMinistryDto })
  @RequirePermission('lookups.manage')
  @Post('ministries')
  async createMinistry(
    @Body(new ZodValidationPipe(createMinistryRequestSchema))
    body: CreateMinistryDto,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: any }> {
    const data = await this.lookupsService.createMinistry(body, user.id);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Update a ministry' })
  @ApiResponse({
    status: 200,
    description: 'Ministry updated successfully',
    type: MinistryResponseWrapperDto,
  })
  @ApiParam({ name: 'id', type: Number, description: 'Ministry ID' })
  @ApiBody({ type: UpdateMinistryDto })
  @RequirePermission('lookups.manage')
  @Patch('ministries/:id')
  async updateMinistry(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateMinistryRequestSchema))
    body: UpdateMinistryDto,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: any }> {
    const data = await this.lookupsService.updateMinistry(
      Number(id),
      body,
      user.id
    );
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get all date statuses' })
  @ApiResponse({
    status: 200,
    description: 'Date statuses retrieved successfully',
    type: LookupArrayResponseWrapperDto,
  })
  @Get('date-statuses')
  @Header('Cache-Control', `public, max-age=${REFERENCE_LOOKUP_CACHE_SECONDS}`)
  async getDateStatuses(): Promise<{ success: boolean; data: LookupItem[] }> {
    const data = await this.lookupsService.getDateStatuses();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get all time statuses' })
  @ApiResponse({
    status: 200,
    description: 'Time statuses retrieved successfully',
    type: LookupArrayResponseWrapperDto,
  })
  @Get('time-statuses')
  @Header('Cache-Control', `public, max-age=${REFERENCE_LOOKUP_CACHE_SECONDS}`)
  async getTimeStatuses(): Promise<{ success: boolean; data: LookupItem[] }> {
    const data = await this.lookupsService.getTimeStatuses();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get all pitch required statuses' })
  @ApiResponse({
    status: 200,
    description: 'Pitch required statuses retrieved successfully',
    type: LookupArrayResponseWrapperDto,
  })
  @Get('pitch-required-statuses')
  @Header('Cache-Control', `public, max-age=${REFERENCE_LOOKUP_CACHE_SECONDS}`)
  async getPitchRequiredStatuses(): Promise<{
    success: boolean;
    data: LookupItem[];
  }> {
    const data = await this.lookupsService.getPitchRequiredStatuses();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get all translation required statuses' })
  @ApiResponse({
    status: 200,
    description: 'Translation required statuses retrieved successfully',
    type: LookupArrayResponseWrapperDto,
  })
  @Get('translation-required-statuses')
  @Header('Cache-Control', `public, max-age=${REFERENCE_LOOKUP_CACHE_SECONDS}`)
  async getTranslationRequiredStatuses(): Promise<{
    success: boolean;
    data: LookupItem[];
  }> {
    const data = await this.lookupsService.getTranslationRequiredStatuses();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get all reports' })
  @ApiResponse({
    status: 200,
    description: 'Reports retrieved successfully',
    type: LookupArrayResponseWrapperDto,
  })
  @Get('reports')
  @Header('Cache-Control', `public, max-age=${REFERENCE_LOOKUP_CACHE_SECONDS}`)
  async getReports(): Promise<{ success: boolean; data: any[] }> {
    const data = await this.lookupsService.getReports();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get all themes' })
  @ApiResponse({
    status: 200,
    description: 'Themes retrieved successfully',
    type: LookupArrayResponseWrapperDto,
  })
  @Get('themes')
  @Header('Cache-Control', `public, max-age=${REFERENCE_LOOKUP_CACHE_SECONDS}`)
  async getThemes(): Promise<{ success: boolean; data: ThemeLookupItem[] }> {
    const data = await this.lookupsService.getThemes();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Create a new theme' })
  @ApiResponse({
    status: 201,
    description: 'Theme created successfully',
    type: ThemeResponseWrapperDto,
  })
  @ApiBody({ type: CreateThemeDto })
  @RequirePermission('lookups.manage')
  @Post('themes')
  async createTheme(
    @Body(new ZodValidationPipe(createThemeRequestSchema))
    body: CreateThemeDto,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: any }> {
    const data = await this.lookupsService.createTheme(body, user.id);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Update a theme' })
  @ApiResponse({
    status: 200,
    description: 'Theme updated successfully',
    type: ThemeResponseWrapperDto,
  })
  @ApiParam({ name: 'id', type: Number, description: 'Theme ID' })
  @ApiBody({ type: UpdateThemeDto })
  @RequirePermission('lookups.manage')
  @Patch('themes/:id')
  async updateTheme(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateThemeRequestSchema))
    body: UpdateThemeDto,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: any }> {
    const data = await this.lookupsService.updateTheme(
      Number(id),
      body,
      user.id
    );
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Get venue quick-picks',
    description:
      'Returns admin-configured quick-pick venues for the activity form (max 4 active).',
  })
  @ApiResponse({
    status: 200,
    description: 'Venue quick-picks retrieved successfully',
    type: VenueQuickPickArrayResponseWrapperDto,
  })
  @Get('venue-quick-picks')
  @Header('Cache-Control', `public, max-age=${REFERENCE_LOOKUP_CACHE_SECONDS}`)
  async getVenueQuickPicks(): Promise<{
    success: boolean;
    data: VenueQuickPickItem[];
  }> {
    const data = await this.lookupsService.getVenueQuickPicks();
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Get last-used venue addresses',
    description:
      'Returns the last 2 distinct venue addresses used by the current user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Last-used venues retrieved successfully',
    type: VenueQuickPickArrayResponseWrapperDto,
  })
  @Get('venue-last-used')
  async getVenueLastUsed(
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: VenueQuickPickItem[] }> {
    const data = await this.lookupsService.getVenueLastUsed(user.id);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Create a venue quick-pick' })
  @ApiResponse({
    status: 201,
    description: 'Venue quick-pick created successfully',
    type: VenueQuickPickResponseWrapperDto,
  })
  @ApiBody({ type: CreateVenueQuickPickDto })
  @RequirePermission('lookups.manage')
  @Post('venue-quick-picks')
  async createVenueQuickPick(
    @Body(new ZodValidationPipe(createVenueQuickPickRequestSchema))
    body: CreateVenueQuickPickDto,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: VenueQuickPickItem }> {
    const data = await this.lookupsService.createVenueQuickPick(body, user.id);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Update a venue quick-pick' })
  @ApiResponse({
    status: 200,
    description: 'Venue quick-pick updated successfully',
    type: VenueQuickPickResponseWrapperDto,
  })
  @ApiParam({ name: 'id', type: Number, description: 'Venue quick-pick ID' })
  @ApiBody({ type: UpdateVenueQuickPickDto })
  @RequirePermission('lookups.manage')
  @Patch('venue-quick-picks/:id')
  async updateVenueQuickPick(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateVenueQuickPickRequestSchema))
    body: UpdateVenueQuickPickDto,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: VenueQuickPickItem }> {
    const data = await this.lookupsService.updateVenueQuickPick(
      Number(id),
      body,
      user.id
    );
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Delete a venue quick-pick' })
  @ApiResponse({ status: 200, description: 'Venue quick-pick deleted' })
  @ApiParam({ name: 'id', type: Number, description: 'Venue quick-pick ID' })
  @RequirePermission('lookups.manage')
  @Delete('venue-quick-picks/:id')
  async deleteVenueQuickPick(
    @Param('id') id: string
  ): Promise<{ success: boolean }> {
    await this.lookupsService.deleteVenueQuickPick(Number(id));
    return { success: true };
  }

  @ApiOperation({ summary: 'Search for Canadian addresses' })
  @ApiResponse({
    status: 200,
    description: 'Address suggestions retrieved successfully',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        searchTerm: { type: 'string' },
        country: { type: 'string', default: 'CAN' },
        lastId: { type: 'string' },
      },
    },
  })
  @Post('address/find')
  async findAddresses(
    @Body() body: { searchTerm: string; country?: string; lastId?: string }
  ): Promise<{ success: boolean; data: any[] }> {
    const data = await this.lookupsService.findAddresses(
      body.searchTerm,
      body.country,
      body.lastId
    );
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Retrieve full address details' })
  @ApiResponse({
    status: 200,
    description: 'Address details retrieved successfully',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
    },
  })
  @Post('address/retrieve')
  async retrieveAddress(
    @Body() body: { id: string }
  ): Promise<{ success: boolean; data: any }> {
    const data = await this.lookupsService.retrieveAddress(body.id);
    return { success: true, data };
  }
}
