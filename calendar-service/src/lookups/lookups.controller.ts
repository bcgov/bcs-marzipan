import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  Header,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import type {
  LookupItem,
  LookupQueryParams,
  OrganizationLookupItem,
  CategoryLookupItem,
  MinistryLookupItem,
  ThemeLookupItem,
} from '@corpcal/shared/api/types';
import {
  REFERENCE_LOOKUP_CACHE_SECONDS,
  DYNAMIC_LOOKUP_CACHE_SECONDS,
} from '@corpcal/shared';
import { LookupsService } from './lookups.service';
import { AppLogger } from '../common/logger/logger.service';
import { ParseOptionalIntPipe } from '../common/pipes/parse-optional-int.pipe';
import {
  LookupArrayResponseWrapperDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryResponseWrapperDto,
  CreateTagDto,
  UpdateTagDto,
  TagResponseWrapperDto,
  CreateCityDto,
  UpdateCityDto,
  CityResponseWrapperDto,
  CreateMinistryDto,
  UpdateMinistryDto,
  MinistryResponseWrapperDto,
  CreateCommsMaterialDto,
  UpdateCommsMaterialDto,
  CommsMaterialResponseWrapperDto,
  CreateGovernmentRepresentativeDto,
  UpdateGovernmentRepresentativeDto,
  GovernmentRepresentativeResponseWrapperDto,
  CreateThemeDto,
  UpdateThemeDto,
  ThemeResponseWrapperDto,
  CreateActivityStatusDto,
  UpdateActivityStatusDto,
  ActivityStatusResponseWrapperDto,
} from '../common/dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  createCategoryRequestSchema,
  updateCategoryRequestSchema,
  createTagRequestSchema,
  updateTagRequestSchema,
  createCityRequestSchema,
  updateCityRequestSchema,
  createMinistryRequestSchema,
  updateMinistryRequestSchema,
  createCommsMaterialRequestSchema,
  updateCommsMaterialRequestSchema,
  createGovernmentRepresentativeRequestSchema,
  updateGovernmentRepresentativeRequestSchema,
  createThemeRequestSchema,
  updateThemeRequestSchema,
  createActivityStatusRequestSchema,
  updateActivityStatusRequestSchema,
} from '@corpcal/shared/schemas';

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
  @Post('categories')
  async createCategory(
    @Body(new ZodValidationPipe(createCategoryRequestSchema))
    body: CreateCategoryDto
  ): Promise<{ success: boolean; data: any }> {
    const data = await this.lookupsService.createCategory(body);
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
  @Patch('categories/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCategoryRequestSchema))
    body: UpdateCategoryDto
  ): Promise<{ success: boolean; data: any }> {
    // Transform null to undefined for displayName to match service signature
    const transformedBody = {
      ...body,
      displayName: body.displayName === null ? undefined : body.displayName,
    };
    const data = await this.lookupsService.updateCategory(
      Number(id),
      transformedBody
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

  @ApiOperation({ summary: 'Create a new tag' })
  @ApiResponse({
    status: 201,
    description: 'Tag created successfully',
    type: TagResponseWrapperDto,
  })
  @ApiBody({ type: CreateTagDto })
  @Post('tags')
  async createTag(
    @Body(new ZodValidationPipe(createTagRequestSchema))
    body: CreateTagDto
  ): Promise<{ success: boolean; data: any }> {
    const data = await this.lookupsService.createTag(body);
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
  @Patch('tags/:id')
  async updateTag(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateTagRequestSchema))
    body: UpdateTagDto
  ): Promise<{ success: boolean; data: any }> {
    const data = await this.lookupsService.updateTag(Number(id), body);
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
  @Post('activity-statuses')
  async createActivityStatus(
    @Body(new ZodValidationPipe(createActivityStatusRequestSchema))
    body: CreateActivityStatusDto
  ): Promise<{ success: boolean; data: any }> {
    const data = await this.lookupsService.createActivityStatus(body);
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
  @Patch('activity-statuses/:id')
  async updateActivityStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateActivityStatusRequestSchema))
    body: UpdateActivityStatusDto
  ): Promise<{ success: boolean; data: any }> {
    // Transform null to undefined for displayName to match service signature
    const transformedBody = {
      ...body,
      displayName: body.displayName === null ? undefined : body.displayName,
    };
    const data = await this.lookupsService.updateActivityStatus(
      Number(id),
      transformedBody
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
  @Post('comms-materials')
  async createCommsMaterial(
    @Body(new ZodValidationPipe(createCommsMaterialRequestSchema))
    body: CreateCommsMaterialDto
  ): Promise<{ success: boolean; data: any }> {
    const data = await this.lookupsService.createCommsMaterial(body);
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
  @Patch('comms-materials/:id')
  async updateCommsMaterial(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCommsMaterialRequestSchema))
    body: UpdateCommsMaterialDto
  ): Promise<{ success: boolean; data: any }> {
    const data = await this.lookupsService.updateCommsMaterial(
      Number(id),
      body
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
  @Post('government-representatives')
  async createGovernmentRepresentative(
    @Body(new ZodValidationPipe(createGovernmentRepresentativeRequestSchema))
    body: CreateGovernmentRepresentativeDto
  ): Promise<{ success: boolean; data: any }> {
    const data = await this.lookupsService.createGovernmentRepresentative(body);
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
  @Patch('government-representatives/:id')
  async updateGovernmentRepresentative(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateGovernmentRepresentativeRequestSchema))
    body: UpdateGovernmentRepresentativeDto
  ): Promise<{ success: boolean; data: any }> {
    const data = await this.lookupsService.updateGovernmentRepresentative(
      Number(id),
      body
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
  @Post('cities')
  async createCity(
    @Body(new ZodValidationPipe(createCityRequestSchema))
    body: CreateCityDto
  ): Promise<{ success: boolean; data: any }> {
    const data = await this.lookupsService.createCity(body);
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
  @Patch('cities/:id')
  async updateCity(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCityRequestSchema))
    body: UpdateCityDto
  ): Promise<{ success: boolean; data: any }> {
    // Transform null to undefined for displayName to match service signature
    const transformedBody = {
      ...body,
      displayName: body.displayName === null ? undefined : body.displayName,
    };
    const data = await this.lookupsService.updateCity(
      Number(id),
      transformedBody
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
  @Post('ministries')
  async createMinistry(
    @Body(new ZodValidationPipe(createMinistryRequestSchema))
    body: CreateMinistryDto
  ): Promise<{ success: boolean; data: any }> {
    const data = await this.lookupsService.createMinistry(body);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Update a ministry' })
  @ApiResponse({
    status: 200,
    description: 'Ministry updated successfully',
    type: MinistryResponseWrapperDto,
  })
  @ApiParam({ name: 'id', type: String, description: 'Ministry ID (UUID)' })
  @ApiBody({ type: UpdateMinistryDto })
  @Patch('ministries/:id')
  async updateMinistry(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateMinistryRequestSchema))
    body: UpdateMinistryDto
  ): Promise<{ success: boolean; data: any }> {
    const data = await this.lookupsService.updateMinistry(id, body);
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
  @Post('themes')
  async createTheme(
    @Body(new ZodValidationPipe(createThemeRequestSchema))
    body: CreateThemeDto
  ): Promise<{ success: boolean; data: any }> {
    const data = await this.lookupsService.createTheme(body);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Update a theme' })
  @ApiResponse({
    status: 200,
    description: 'Theme updated successfully',
    type: ThemeResponseWrapperDto,
  })
  @ApiParam({ name: 'id', type: String, description: 'Theme ID (UUID)' })
  @ApiBody({ type: UpdateThemeDto })
  @Patch('themes/:id')
  async updateTheme(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateThemeRequestSchema))
    body: UpdateThemeDto
  ): Promise<{ success: boolean; data: any }> {
    const data = await this.lookupsService.updateTheme(id, body);
    return { success: true, data };
  }
}
