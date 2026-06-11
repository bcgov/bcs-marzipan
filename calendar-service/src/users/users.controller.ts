import {
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

import { PERMISSIONS, SYSTEM_ROLE_IDS, type AuthUser } from '@corpcal/shared';
import type {
  UserDetail,
  UserHistoryEntry,
  UserListItem,
} from '@corpcal/shared/api/types';
import {
  addUserToTeamBodySchema,
  createUserBodySchema,
  transferActivitiesBodySchema,
  updateUserBodySchema,
  updateUserSettingsBodySchema,
  updateUserTeamRoleBodySchema,
} from '@corpcal/shared/schemas';

import { AuthService } from '../auth/auth.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { parseCommaSeparatedIds } from '../common/utils/parse-query-ids';
import { RequirePermission } from '../policy/decorators/require-permission.decorator';
import {
  AddUserToTeamDto,
  CreateUserDto,
  TransferActivitiesDto,
  TransferActivitiesResponseDto,
  UpdateUserDto,
  UpdateUserSettingsDto,
  UpdateUserTeamRoleDto,
  UserActivitiesResponseWrapperDto,
  UserDetailResponseWrapperDto,
  UserHistoryResponseWrapperDto,
  UserListResponseWrapperDto,
} from './dto/users.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
@RequirePermission('users.view')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService
  ) {}

  @ApiOperation({
    summary: 'List users',
    description:
      'Returns all users with team memberships and roles. Optional search by name, email, username; filter by teamIds or roleIds (comma-separated).',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by display name, username, or email',
  })
  @ApiQuery({
    name: 'teamIds',
    required: false,
    description: 'Filter users in any of these teams (comma-separated IDs)',
  })
  @ApiQuery({
    name: 'roleIds',
    required: false,
    description: 'Filter users with any of these roles (comma-separated IDs)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of users',
    type: UserListResponseWrapperDto,
  })
  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('teamIds') teamIdsParam?: string,
    @Query('roleIds') roleIdsParam?: string
  ): Promise<{ success: boolean; data: UserListItem[] }> {
    const teamIds = parseCommaSeparatedIds(teamIdsParam);
    const roleIds = parseCommaSeparatedIds(roleIdsParam);
    const data = await this.usersService.findAll(search, teamIds, roleIds);
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Create user',
    description:
      'Create a new user (email and role required). Email is used to match the user when they first sign in with Azure AD. Optional display name and initial team assignments.',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User created',
    type: UserDetailResponseWrapperDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error or invalid role' })
  @ApiResponse({
    status: 409,
    description: 'A user with this email already exists',
  })
  @RequirePermission(PERMISSIONS.USERS.CREATE)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(createUserBodySchema)) dto: CreateUserDto,
    @CurrentUser() currentUser: AuthUser
  ): Promise<{ success: boolean; data: UserDetail }> {
    const data = await this.usersService.create(dto, currentUser.id);
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Get activities associated with a user',
    description:
      'Returns activities where the user is a comms lead or contact. Excludes deleted activities. Used for transfer dialog and "my activities" filters.',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'List of activities (id, label, value)',
    type: UserActivitiesResponseWrapperDto,
  })
  @Get(':id/activities')
  async getActivities(@Param('id', ParseIntPipe) id: number): Promise<{
    success: boolean;
    data: { id: number; label: string; value: number }[];
  }> {
    const data = await this.usersService.getActivitiesForUser(id);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User details. Data is null when user is not found.',
    type: UserDetailResponseWrapperDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number
  ): Promise<{ success: boolean; data: UserDetail | null }> {
    const data = await this.usersService.findOne(id);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Update user (role, active status, notes)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'Updated user',
    type: UserDetailResponseWrapperDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @RequirePermission('users.edit')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateUserBodySchema)) dto: UpdateUserDto,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: UserDetail }> {
    // Editing personal profile fields (name, email, phone, job title) is
    // restricted to admins and sys-admins. Role/active/notes remain governed
    // by the users.edit permission only.
    const editsProfile =
      dto.displayName !== undefined ||
      dto.email !== undefined ||
      dto.phone !== undefined ||
      dto.jobTitle !== undefined;
    if (editsProfile && !this.canEditProfile(user)) {
      throw new ForbiddenException(
        'Only admins and sys-admins can edit user profile details.'
      );
    }
    const data = await this.usersService.update(id, dto, user.id);
    return { success: true, data };
  }

  private canEditProfile(user: AuthUser): boolean {
    return (
      user.roleId === SYSTEM_ROLE_IDS.ADMIN ||
      user.roleId === SYSTEM_ROLE_IDS.SYSTEM_ADMIN
    );
  }

  @ApiOperation({
    summary: 'Update user settings (flag colour, etc.)',
    description:
      'Upserts per-user configurable settings. Only admins and sys-admins may have settings saved; permission check is enforced by users.edit.',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ type: UpdateUserSettingsDto })
  @ApiResponse({
    status: 200,
    description: 'Updated user with new settings',
    type: UserDetailResponseWrapperDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @RequirePermission('users.edit')
  @Patch(':id/settings')
  async updateSettings(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateUserSettingsBodySchema))
    dto: UpdateUserSettingsDto,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: UserDetail }> {
    const data = await this.usersService.updateUserSettings(id, dto, user.id);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Add user to team' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ type: AddUserToTeamDto })
  @ApiResponse({ status: 201, description: 'User added to team' })
  @ApiResponse({ status: 404, description: 'User or team not found' })
  @ApiResponse({ status: 409, description: 'User already in team' })
  @RequirePermission('users.edit')
  @Post(':id/teams')
  async addToTeam(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(addUserToTeamBodySchema)) dto: AddUserToTeamDto,
    @CurrentUser() currentUser: AuthUser
  ): Promise<{ success: boolean }> {
    await this.usersService.addUserToTeam(id, dto, currentUser.id);
    return { success: true };
  }

  @ApiOperation({ summary: 'Remove user from team' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiParam({ name: 'teamId', description: 'Team ID' })
  @ApiResponse({ status: 200, description: 'User removed from team' })
  @ApiResponse({ status: 404, description: 'User not in team' })
  @RequirePermission('users.edit')
  @Delete(':id/teams/:teamId')
  async removeFromTeam(
    @Param('id', ParseIntPipe) id: number,
    @Param('teamId', ParseIntPipe) teamId: number,
    @CurrentUser() currentUser: AuthUser
  ): Promise<{ success: boolean }> {
    await this.usersService.removeUserFromTeam(id, teamId, currentUser.id);
    return { success: true };
  }

  @ApiOperation({ summary: 'Update user role in team' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiParam({ name: 'teamId', description: 'Team ID' })
  @ApiBody({ type: UpdateUserTeamRoleDto })
  @ApiResponse({ status: 200, description: 'Team role updated' })
  @ApiResponse({ status: 404, description: 'User not in team' })
  @RequirePermission('users.edit')
  @Patch(':id/teams/:teamId')
  async updateTeamRole(
    @Param('id', ParseIntPipe) id: number,
    @Param('teamId', ParseIntPipe) teamId: number,
    @Body(new ZodValidationPipe(updateUserTeamRoleBodySchema))
    dto: UpdateUserTeamRoleDto,
    @CurrentUser() currentUser: AuthUser
  ): Promise<{ success: boolean }> {
    await this.usersService.updateUserTeamRole(id, teamId, dto, currentUser.id);
    return { success: true };
  }

  @ApiOperation({ summary: 'Get user change history' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User history entries',
    type: UserHistoryResponseWrapperDto,
  })
  @Get(':id/history')
  async getHistory(
    @Param('id', ParseIntPipe) id: number
  ): Promise<{ success: boolean; data: UserHistoryEntry[] }> {
    const data = await this.usersService.getUserHistory(id);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Initiate a password reset for a local-auth user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description:
      'Reset code generated (48-hour expiry). Share this with the user out-of-band.',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @RequirePermission(PERMISSIONS.USERS.EDIT)
  @Post(':id/initiate-password-reset')
  @HttpCode(HttpStatus.OK)
  async initiatePasswordReset(
    @Param('id', ParseIntPipe) id: number
  ): Promise<{ resetCode: string; expiresInHours: number }> {
    const resetCode = await this.authService.createPasswordResetToken(id);
    return { resetCode, expiresInHours: 48 };
  }

  @ApiOperation({ summary: 'Transfer activities from this user to another' })
  @ApiParam({ name: 'id', description: 'Source user ID' })
  @ApiBody({ type: TransferActivitiesDto })
  @ApiResponse({
    status: 200,
    description: 'Transfer result',
    type: TransferActivitiesResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @RequirePermission(PERMISSIONS.USERS.TRANSFER_ACTIVITIES)
  @Post(':id/transfer-activities')
  async transferActivities(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(transferActivitiesBodySchema))
    dto: TransferActivitiesDto,
    @CurrentUser() currentUser: AuthUser
  ): Promise<{ success: boolean; transferredCount: number }> {
    const { transferredCount } = await this.usersService.transferActivities(
      id,
      dto,
      currentUser.id
    );
    return { success: true, transferredCount };
  }
}
