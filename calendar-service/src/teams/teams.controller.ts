import {
  Body,
  Controller,
  Get,
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
import type {
  CommsContactCandidate,
  TeamDetail,
  TeamHistoryEntry,
  TeamListItem,
} from '@corpcal/shared/api/types';
import {
  createTeamBodySchema,
  updateTeamBodySchema,
} from '@corpcal/shared/schemas';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  RequireAnyPermission,
  RequirePermission,
} from '../policy/decorators/require-permission.decorator';
import {
  CreateTeamDto,
  TeamDetailResponseWrapperDto,
  TeamHistoryResponseWrapperDto,
  TeamListResponseWrapperDto,
  UpdateTeamDto,
} from './dto/teams.dto';
import { TeamsService } from './teams.service';

@ApiTags('teams')
@Controller('teams')
@RequirePermission('teams.view')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @ApiOperation({
    summary: 'List teams',
    description: 'Returns all teams with member count and optional ministry.',
  })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: 'If true, return only active teams (default: true)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of teams',
    type: TeamListResponseWrapperDto,
  })
  @Get()
  async findAll(
    @Query('activeOnly') activeOnly?: string
  ): Promise<{ success: boolean; data: TeamListItem[] }> {
    const active = activeOnly === undefined || activeOnly === 'true';
    const data = await this.teamsService.findAll(active);
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'List teams for lead team dropdown',
    description:
      "Returns teams the current user may choose as activity lead team: user's teams, or (with activities.create.any) all active teams so any activity's lead team can be displayed and selected.",
  })
  @ApiResponse({
    status: 200,
    description: 'List of teams for lead team select',
    type: TeamListResponseWrapperDto,
  })
  @RequireAnyPermission(
    PERMISSIONS.ACTIVITIES.CREATE,
    PERMISSIONS.ACTIVITIES.EDIT
  )
  @Get('lead-options')
  async getLeadOptions(
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: TeamListItem[] }> {
    const hasCreateAny = user.permissions?.includes(
      PERMISSIONS.ACTIVITIES.CREATE_ANY
    );
    const data = await this.teamsService.findLeadOptions(
      user.teamIds ?? [],
      hasCreateAny ?? false
    );
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'List eligible comms contact candidates for a team',
    description:
      'Returns active members of the given team whose role grants activities.edit. ' +
      "Restricted to the caller's teams unless the caller has activities.create.any.",
  })
  @ApiParam({ name: 'teamId', description: 'Lead team ID' })
  @ApiResponse({
    status: 200,
    description: 'List of eligible comms contacts',
  })
  @ApiResponse({
    status: 403,
    description: 'Caller is not a member of this team and lacks create.any',
  })
  @RequireAnyPermission(
    PERMISSIONS.ACTIVITIES.CREATE,
    PERMISSIONS.ACTIVITIES.EDIT
  )
  @Get(':teamId/comms-contact-candidates')
  async getCommsContactCandidates(
    @Param('teamId', ParseIntPipe) teamId: number,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: CommsContactCandidate[] }> {
    const hasCreateAny = user.permissions?.includes(
      PERMISSIONS.ACTIVITIES.CREATE_ANY
    );
    const data = await this.teamsService.findCommsContactCandidates(
      teamId,
      user.teamIds ?? [],
      hasCreateAny ?? false
    );
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get team by ID' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiQuery({
    name: 'includeInactiveMembers',
    required: false,
    type: 'boolean',
    description:
      'When true, includes team members with isActive=false (useful for assignment UI). Defaults to false.',
  })
  @ApiResponse({
    status: 200,
    description: 'Team details. Returns data: null when team is not found.',
    type: TeamDetailResponseWrapperDto,
  })
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeInactiveMembers') includeInactiveMembers?: string
  ): Promise<{ success: boolean; data: TeamDetail | null }> {
    const data = await this.teamsService.findOne(
      id,
      includeInactiveMembers === 'true'
    );
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Create team' })
  @ApiBody({ type: CreateTeamDto })
  @ApiResponse({
    status: 201,
    description: 'Team created',
    type: TeamDetailResponseWrapperDto,
  })
  @RequirePermission('teams.create')
  @Post()
  async create(
    @Body(new ZodValidationPipe(createTeamBodySchema)) dto: CreateTeamDto,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: TeamDetail }> {
    const data = await this.teamsService.create(dto, user.id);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Update team' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiBody({ type: UpdateTeamDto })
  @ApiResponse({
    status: 200,
    description: 'Team updated',
    type: TeamDetailResponseWrapperDto,
  })
  @ApiResponse({ status: 404, description: 'Team not found' })
  @RequirePermission('teams.edit')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateTeamBodySchema)) dto: UpdateTeamDto,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: TeamDetail }> {
    const data = await this.teamsService.update(id, dto, user.id);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get team change history' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiResponse({
    status: 200,
    description: 'Team history entries',
    type: TeamHistoryResponseWrapperDto,
  })
  @ApiResponse({ status: 404, description: 'Team not found' })
  @Get(':id/history')
  async getHistory(
    @Param('id', ParseIntPipe) id: number
  ): Promise<{ success: boolean; data: TeamHistoryEntry[] }> {
    const data = await this.teamsService.getTeamHistory(id);
    return { success: true, data };
  }
}
