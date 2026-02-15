import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { PERMISSIONS, type AuthUser } from '@corpcal/shared';
import type {
  AddUserToTeamBody,
  TransferActivitiesBody,
  UpdateUserBody,
  UpdateUserTeamRoleBody,
  UserDetail,
  UserHistoryEntry,
  UserListItem,
} from '@corpcal/shared/api/types';
import {
  addUserToTeamBodySchema,
  transferActivitiesBodySchema,
  updateUserBodySchema,
  updateUserTeamRoleBodySchema,
} from '@corpcal/shared/schemas';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { RequirePermission } from '../policy/decorators/require-permission.decorator';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
@RequirePermission('users.view')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({
    summary: 'List users',
    description:
      'Returns all users with team memberships and roles. Optional search by name, email, username.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by display name, username, or email',
  })
  @ApiResponse({ status: 200, description: 'List of users' })
  @Get()
  async findAll(
    @Query('search') search?: string
  ): Promise<{ success: boolean; data: UserListItem[] }> {
    const data = await this.usersService.findAll(search);
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
  @ApiResponse({ status: 200, description: 'User details' })
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
  @ApiResponse({ status: 200, description: 'Updated user' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @RequirePermission('users.edit')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateUserBodySchema)) dto: UpdateUserBody,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: UserDetail }> {
    const data = await this.usersService.update(id, dto, user.id);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Add user to team' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 201, description: 'User added to team' })
  @ApiResponse({ status: 404, description: 'User or team not found' })
  @ApiResponse({ status: 409, description: 'User already in team' })
  @RequirePermission('users.edit')
  @Post(':id/teams')
  async addToTeam(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(addUserToTeamBodySchema))
    dto: AddUserToTeamBody,
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
  @ApiResponse({ status: 200, description: 'Team role updated' })
  @ApiResponse({ status: 404, description: 'User not in team' })
  @RequirePermission('users.edit')
  @Patch(':id/teams/:teamId')
  async updateTeamRole(
    @Param('id', ParseIntPipe) id: number,
    @Param('teamId', ParseIntPipe) teamId: number,
    @Body(new ZodValidationPipe(updateUserTeamRoleBodySchema))
    dto: UpdateUserTeamRoleBody,
    @CurrentUser() currentUser: AuthUser
  ): Promise<{ success: boolean }> {
    await this.usersService.updateUserTeamRole(id, teamId, dto, currentUser.id);
    return { success: true };
  }

  @ApiOperation({ summary: 'Get user change history' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User history entries' })
  @Get(':id/history')
  async getHistory(
    @Param('id', ParseIntPipe) id: number
  ): Promise<{ success: boolean; data: UserHistoryEntry[] }> {
    const data = await this.usersService.getUserHistory(id);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Transfer activities from this user to another' })
  @ApiParam({ name: 'id', description: 'Source user ID' })
  @ApiResponse({ status: 200, description: 'Transfer result' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @RequirePermission(PERMISSIONS.USERS.TRANSFER_ACTIVITIES)
  @Post(':id/transfer-activities')
  async transferActivities(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(transferActivitiesBodySchema))
    dto: TransferActivitiesBody,
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
