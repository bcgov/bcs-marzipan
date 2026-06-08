import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Header,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';

import {
  DYNAMIC_LOOKUP_CACHE_SECONDS,
  SYSTEM_ROLE_IDS,
  type AuthUser,
} from '@corpcal/shared';
import type {
  ActivityTeamSharingResponse,
  CategoryLookupItem,
  LookupItem,
  LookupQueryParams,
  MinistryGroupResponse,
  MinistryLookupItem,
  OrganizationLookupItem,
  ThemeLookupItem,
  VenuePresetItem,
} from '@corpcal/shared/api/types';
import {
  createActivityStatusRequestSchema,
  createCategoryRequestSchema,
  createCityRequestSchema,
  createCommsMaterialRequestSchema,
  createGovernmentRepresentativeRequestSchema,
  createMinistryGroupRequestSchema,
  createMinistryRequestSchema,
  createTagRequestSchema,
  createThemeRequestSchema,
  createVenuePresetRequestSchema,
  updateActivityStatusRequestSchema,
  updateCategoryRequestSchema,
  updateCityRequestSchema,
  updateCommsMaterialRequestSchema,
  updateGovernmentRepresentativeRequestSchema,
  updateMinistryGroupRequestSchema,
  updateMinistryRequestSchema,
  updateTagRequestSchema,
  updateThemeRequestSchema,
  updateVenuePresetRequestSchema,
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
  CreateMinistryGroupDto,
  CreateTagDto,
  CreateThemeDto,
  CreateVenuePresetDto,
  GovernmentRepresentativeResponseWrapperDto,
  LookupArrayResponseWrapperDto,
  MinistryGroupArrayResponseWrapperDto,
  MinistryGroupResponseWrapperDto,
  MinistryResponseWrapperDto,
  TagResponseWrapperDto,
  ThemeResponseWrapperDto,
  UpdateActivityStatusDto,
  UpdateCategoryDto,
  UpdateCityDto,
  UpdateCommsMaterialDto,
  UpdateGovernmentRepresentativeDto,
  UpdateMinistryDto,
  UpdateMinistryGroupDto,
  UpdateTagDto,
  UpdateThemeDto,
  UpdateVenuePresetDto,
  VenuePresetArrayResponseWrapperDto,
  VenuePresetResponseWrapperDto,
} from '../common/dto';
import { AppLogger } from '../common/logger/logger.service';
import { ParseOptionalIntPipe } from '../common/pipes/parse-optional-int.pipe';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { parseCommaSeparatedIds } from '../common/utils/parse-query-ids';
import { RequirePermission } from '../policy/decorators/require-permission.decorator';
import { TeamsService } from '../teams/teams.service';
import { lookupGetCacheControl } from './cache-control';
import { LookupsService } from './lookups.service';

@ApiTags('lookups')
@Controller('lookups')
@RequirePermission('lookups.view')
export class LookupsController {
  private readonly logger = new AppLogger(LookupsController.name);

  constructor(
    private readonly lookupsService: LookupsService,
    private readonly teamsService: TeamsService
  ) {}

  @ApiOperation({
    summary: 'Teams and ministry quick-share for activity Shared with',
    description:
      'Returns active teams (same list as GET /teams) plus quick-share group definitions.',
  })
  @ApiResponse({ status: 200, description: 'Teams and quick-share config' })
  @Get('activity-team-sharing')
  @Header('Cache-Control', lookupGetCacheControl())
  async getActivityTeamSharing(): Promise<{
    success: boolean;
    data: ActivityTeamSharingResponse;
  }> {
    const [teams, quickShare] = await Promise.all([
      this.teamsService.findAll(true),
      this.lookupsService.getActivityTeamSharingQuickShare(),
    ]);
    return { success: true, data: { teams, quickShare } };
  }

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
  @Header('Cache-Control', lookupGetCacheControl())
  async getCategories(@CurrentUser() user: AuthUser): Promise<{
    success: boolean;
    data: CategoryLookupItem[];
  }> {
    const data = await this.lookupsService.getCategories(user.teamIds);
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
  @Header('Cache-Control', lookupGetCacheControl())
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
    summary: 'Get all roles',
    description: 'Retrieves active roles for user management dropdowns.',
  })
  @ApiResponse({
    status: 200,
    description: 'Roles retrieved successfully',
  })
  @Get('roles')
  @Header('Cache-Control', lookupGetCacheControl())
  async getRoles(): Promise<{
    success: boolean;
    data: { id: number; name: string; description: string | null }[];
  }> {
    const data = await this.lookupsService.getRoles();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get permissions for a role' })
  @ApiResponse({
    status: 200,
    description: 'Permissions retrieved successfully',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Role ID' })
  @Get('roles/:id/permissions')
  @Header('Cache-Control', lookupGetCacheControl())
  async getRolePermissions(@Param('id') id: string): Promise<{
    success: boolean;
    data: {
      key: string;
      displayName?: string | null;
      description: string | null;
    }[];
  }> {
    const roleId = Number(id);
    if (!Number.isInteger(roleId)) throw new NotFoundException('Role not found');
    const data = await this.lookupsService.getRolePermissions(roleId);
  }

  @ApiOperation({ summary: 'Get all permissions (admin only)' })
  @ApiResponse({ status: 200, description: 'Permissions retrieved' })
  @ApiResponse({ status: 403, description: 'Caller is not system admin' })
  @Get('permissions')
  async getAllPermissions(
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: any[] }> {
    this.ensureSystemAdmin(user);
    const data = await this.lookupsService.getAllPermissions();
    return { success: true, data };
  }

  private ensureSystemAdmin(user: AuthUser): void {
    if (user.roleId !== SYSTEM_ROLE_IDS.SYSTEM_ADMIN) {
      throw new ForbiddenException(
        'Only System Admin users can manage permission visibility.'
      );
    }
  }

  @ApiOperation({ summary: 'Update permission visibility in user management' })
  @ApiResponse({ status: 200, description: 'Permission updated' })
  @ApiResponse({ status: 403, description: 'Caller is not system admin' })
  @Patch('permissions/:id/visibility')
  async updatePermissionVisibility(
    @Param('id') id: string,
    @Body('showInUserManagement') showInUserManagement: boolean,
    @CurrentUser() user: AuthUser
  ): Promise<{
    success: boolean;
    data: { id: number; key: string; showInUserManagement: boolean };
  }> {
    this.ensureSystemAdmin(user);
    const pid = Number(id);
    const data = await this.lookupsService.updatePermissionVisibility(
      pid,
      !!showInUserManagement,
      user.id
    );
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
  @Header('Cache-Control', lookupGetCacheControl())
  async getUsers(
    @Query('userId', new ParseOptionalIntPipe()) userId?: number,
    @Query('role') role?: string,
    @Query('organizationId', new ParseOptionalIntPipe())
    organizationId?: number,
    @Query('userIds') userIds?: string
  ): Promise<{ success: boolean; data: LookupItem[] }> {
    const parsedUserIds = userIds ? parseCommaSeparatedIds(userIds) : undefined;

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
    description:
      'Retrieves tags visible to the current user. ' +
      'Global tags are visible to everyone. Team-scoped tags are only visible to members of the associated team. ' +
      'Admins with the `lookups.manage` permission can pass `includeAll=true` to retrieve all tags regardless of ' +
      'visibility or team scoping; this path also returns `teamIds` and `teamNames` for each tag and sets ' +
      '`Cache-Control: no-store` to prevent stale data after mutations. ' +
      'Non-admin responses are privately cached for a short period to reduce server load.',
  })
  @ApiQuery({
    name: 'includeAll',
    required: false,
    type: String,
    enum: ['true'],
    description:
      'When set to `"true"` and the caller has the `lookups.manage` permission, returns all tags regardless of ' +
      'visibility or team scoping. Ignored (treated as false) for callers without that permission.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tags retrieved successfully.',
    type: LookupArrayResponseWrapperDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Caller does not have the `lookups.view` permission.',
  })
  @Get('tags')
  async getTags(
    @CurrentUser() user: AuthUser,
    @Query('includeAll') includeAll?: string,
    @Res({ passthrough: true }) res?: Response
  ): Promise<{ success: boolean; data: LookupItem[] }> {
    const shouldIncludeAll =
      includeAll === 'true' && user.permissions.includes('lookups.manage');
    // Admin path: no-store so the browser always hits the server after mutations.
    // Non-admin path: short private cache to reduce server load.
    res?.setHeader(
      'Cache-Control',
      shouldIncludeAll
        ? 'no-store'
        : `private, max-age=${DYNAMIC_LOOKUP_CACHE_SECONDS}`
    );
    const data = await this.lookupsService.getTags(
      shouldIncludeAll ? undefined : user.teamIds,
      shouldIncludeAll
    );
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Create a new tag',
    description:
      'Creates a new tag. Requires the `lookups.manage` permission. ' +
      'When `visibility` is `"team"`, a `teamId` must be provided; the tag is associated with that team ' +
      'atomically in the same transaction. ' +
      'When `visibility` is `"global"` (the default), `teamId` is ignored.',
  })
  @ApiResponse({
    status: 201,
    description: 'Tag created successfully.',
    type: TagResponseWrapperDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Request body failed validation.',
  })
  @ApiResponse({
    status: 403,
    description: 'Caller does not have the `lookups.manage` permission.',
  })
  @ApiBody({
    type: CreateTagDto,
    description:
      'Tag creation payload. `name` is required (1–255 chars). `visibility` defaults to `"global"`. ' +
      'Supply `teamId` when `visibility` is `"team"`.',
  })
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

  @ApiOperation({
    summary: 'Update a tag',
    description:
      'Partially updates an existing tag. Requires the `lookups.manage` permission. All fields are optional. ' +
      'When `visibility` or `teamId` is changed, the `team_tags` association table is updated atomically in the ' +
      'same transaction: existing associations are deactivated and the new one (if any) is upserted. ' +
      'To change a tag from team-scoped to global, set `visibility` to `"global"` (or omit `teamId`).',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Numeric ID of the tag to update.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tag updated successfully.',
    type: TagResponseWrapperDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Request body failed validation.',
  })
  @ApiResponse({
    status: 403,
    description: 'Caller does not have the `lookups.manage` permission.',
  })
  @ApiResponse({
    status: 404,
    description: 'No tag with the given ID was found.',
  })
  @ApiBody({
    type: UpdateTagDto,
    description:
      'Partial tag update payload. All fields from the create schema are accepted but none are required.',
  })
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
  @Header('Cache-Control', lookupGetCacheControl())
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
  @Header('Cache-Control', lookupGetCacheControl())
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
  @Header('Cache-Control', lookupGetCacheControl())
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
  @Header('Cache-Control', lookupGetCacheControl())
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
  @Header('Cache-Control', lookupGetCacheControl())
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
  @Header('Cache-Control', lookupGetCacheControl())
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
  @Header('Cache-Control', lookupGetCacheControl())
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
  @Header('Cache-Control', lookupGetCacheControl())
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
  @Header('Cache-Control', lookupGetCacheControl())
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
  @Header('Cache-Control', lookupGetCacheControl())
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
  @Header('Cache-Control', lookupGetCacheControl())
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
  @Header('Cache-Control', lookupGetCacheControl())
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

  @ApiOperation({ summary: 'Get all ministry groups' })
  @ApiResponse({
    status: 200,
    description: 'Ministry groups retrieved successfully',
    type: MinistryGroupArrayResponseWrapperDto,
  })
  @Get('ministry-groups')
  @Header('Cache-Control', lookupGetCacheControl())
  async getMinistryGroups(): Promise<{
    success: boolean;
    data: MinistryGroupResponse[];
  }> {
    const data = await this.lookupsService.getMinistryGroups();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Create a ministry group' })
  @ApiResponse({
    status: 201,
    description: 'Ministry group created successfully',
    type: MinistryGroupResponseWrapperDto,
  })
  @ApiBody({ type: CreateMinistryGroupDto })
  @RequirePermission('lookups.manage')
  @Post('ministry-groups')
  async createMinistryGroup(
    @Body(new ZodValidationPipe(createMinistryGroupRequestSchema))
    body: CreateMinistryGroupDto,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: MinistryGroupResponse }> {
    const row = await this.lookupsService.createMinistryGroup(body, user.id);
    return {
      success: true,
      data: { id: row.id, name: row.name, sortOrder: row.sortOrder },
    };
  }

  @ApiOperation({ summary: 'Update a ministry group' })
  @ApiResponse({
    status: 200,
    description: 'Ministry group updated successfully',
    type: MinistryGroupResponseWrapperDto,
  })
  @ApiParam({ name: 'id', type: Number, description: 'Ministry group ID' })
  @ApiBody({ type: UpdateMinistryGroupDto })
  @RequirePermission('lookups.manage')
  @Patch('ministry-groups/:id')
  async updateMinistryGroup(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateMinistryGroupRequestSchema))
    body: UpdateMinistryGroupDto,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: MinistryGroupResponse }> {
    const row = await this.lookupsService.updateMinistryGroup(
      Number(id),
      body,
      user.id
    );
    if (!row) {
      throw new NotFoundException(`Ministry group ${id} not found`);
    }
    return {
      success: true,
      data: { id: row.id, name: row.name, sortOrder: row.sortOrder },
    };
  }

  @ApiOperation({ summary: 'Delete a ministry group' })
  @ApiResponse({ status: 200, description: 'Ministry group deleted' })
  @ApiResponse({ status: 404, description: 'Ministry group not found' })
  @ApiParam({ name: 'id', type: Number, description: 'Ministry group ID' })
  @RequirePermission('lookups.manage')
  @Delete('ministry-groups/:id')
  async deleteMinistryGroup(
    @Param('id') id: string
  ): Promise<{ success: boolean }> {
    await this.lookupsService.deleteMinistryGroup(Number(id));
    return { success: true };
  }

  @ApiOperation({ summary: 'Get all date statuses' })
  @ApiResponse({
    status: 200,
    description: 'Date statuses retrieved successfully',
    type: LookupArrayResponseWrapperDto,
  })
  @Get('date-statuses')
  @Header('Cache-Control', lookupGetCacheControl())
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
  @Header('Cache-Control', lookupGetCacheControl())
  async getTimeStatuses(): Promise<{ success: boolean; data: LookupItem[] }> {
    const data = await this.lookupsService.getTimeStatuses();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get all venue statuses' })
  @ApiResponse({
    status: 200,
    description: 'Venue statuses retrieved successfully',
    type: LookupArrayResponseWrapperDto,
  })
  @Get('venue-statuses')
  @Header('Cache-Control', lookupGetCacheControl())
  async getVenueStatuses(): Promise<{ success: boolean; data: LookupItem[] }> {
    const data = await this.lookupsService.getVenueStatuses();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get all pitch required statuses' })
  @ApiResponse({
    status: 200,
    description: 'Pitch required statuses retrieved successfully',
    type: LookupArrayResponseWrapperDto,
  })
  @Get('pitch-required-statuses')
  @Header('Cache-Control', lookupGetCacheControl())
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
  @Header('Cache-Control', lookupGetCacheControl())
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
  @Header('Cache-Control', lookupGetCacheControl())
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
  @Header('Cache-Control', lookupGetCacheControl())
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
    summary: 'Get venue presets',
    description:
      'Returns admin-defined venue presets for the activity form. Pinned presets are shown as badges.',
  })
  @ApiResponse({
    status: 200,
    description: 'Venue presets retrieved successfully',
    type: VenuePresetArrayResponseWrapperDto,
  })
  @Get('venue-presets')
  @Header('Cache-Control', lookupGetCacheControl())
  async getVenuePresets(): Promise<{
    success: boolean;
    data: VenuePresetItem[];
  }> {
    const data = await this.lookupsService.getVenuePresets();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Create a venue preset' })
  @ApiResponse({
    status: 201,
    description: 'Venue preset created successfully',
    type: VenuePresetResponseWrapperDto,
  })
  @ApiBody({ type: CreateVenuePresetDto })
  @RequirePermission('lookups.manage')
  @Post('venue-presets')
  async createVenuePreset(
    @Body(new ZodValidationPipe(createVenuePresetRequestSchema))
    body: CreateVenuePresetDto,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: VenuePresetItem }> {
    const data = await this.lookupsService.createVenuePreset(body, user.id);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Update a venue preset' })
  @ApiResponse({
    status: 200,
    description: 'Venue preset updated successfully',
    type: VenuePresetResponseWrapperDto,
  })
  @ApiParam({ name: 'id', type: Number, description: 'Venue preset ID' })
  @ApiBody({ type: UpdateVenuePresetDto })
  @RequirePermission('lookups.manage')
  @Patch('venue-presets/:id')
  async updateVenuePreset(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateVenuePresetRequestSchema))
    body: UpdateVenuePresetDto,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: VenuePresetItem }> {
    const data = await this.lookupsService.updateVenuePreset(
      Number(id),
      body,
      user.id
    );
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Delete a venue preset' })
  @ApiResponse({ status: 200, description: 'Venue preset deleted' })
  @ApiParam({ name: 'id', type: Number, description: 'Venue preset ID' })
  @RequirePermission('lookups.manage')
  @Delete('venue-presets/:id')
  async deleteVenuePreset(
    @Param('id') id: string
  ): Promise<{ success: boolean }> {
    await this.lookupsService.deleteVenuePreset(Number(id));
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
