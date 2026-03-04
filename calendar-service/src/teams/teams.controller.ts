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

import type { AuthUser } from '@corpcal/shared';
import type {
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
import { RequirePermission } from '../policy/decorators/require-permission.decorator';
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

  @ApiOperation({ summary: 'Get team by ID' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiResponse({
    status: 200,
    description: 'Team details. Data is null when team is not found.',
    type: TeamDetailResponseWrapperDto,
  })
  @ApiResponse({ status: 404, description: 'Team not found' })
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number
  ): Promise<{ success: boolean; data: TeamDetail | null }> {
    const data = await this.teamsService.findOne(id);
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
