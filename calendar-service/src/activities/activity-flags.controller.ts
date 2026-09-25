import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';

import type { AuthUser } from '@corpcal/shared';
import {
  upsertActivityFlagsRequestSchema,
  type UpsertActivityFlagsRequest,
} from '@corpcal/shared/schemas';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AppLogger } from '../common/logger/logger.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { RequirePermission } from '../policy/decorators/require-permission.decorator';
import { ActivitiesGateway } from './activities.gateway';
import { ActivityFlagsService } from './services/activity-flags.service';

class UpsertActivityFlagsDto extends createZodDto(
  upsertActivityFlagsRequestSchema
) {}

@ApiTags('activities')
@Controller('activities')
export class ActivityFlagsController {
  private readonly logger = new AppLogger(ActivityFlagsController.name);

  constructor(
    private readonly flagsService: ActivityFlagsService,
    private readonly gateway: ActivitiesGateway
  ) {}

  @ApiOperation({
    summary: 'Sync reviewer assignees for an activity',
    description:
      'Sets the full assignee list for the given (activity, team) pair. ' +
      'Adds missing assignees and removes assignees not present in the provided list. ' +
      'This is the only write endpoint for activity flags. ' +
      'Requires activities.flag permission and a teamId the caller belongs to.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Activity ID' })
  @ApiBody({ type: UpsertActivityFlagsDto })
  @ApiResponse({ status: 200, description: 'Flags synced successfully' })
  @ApiResponse({
    status: 403,
    description: 'No team with flag permission or assignee not on team',
  })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  @RequirePermission('activities.flag')
  @Put(':id/flags')
  @HttpCode(HttpStatus.OK)
  async syncFlags(
    @Param('id', ParseIntPipe) activityId: number,
    @Body(new ZodValidationPipe(upsertActivityFlagsRequestSchema))
    body: UpsertActivityFlagsRequest,
    @CurrentUser() user: AuthUser
  ): Promise<{
    success: true;
    data: {
      addedAssigneeIds: number[];
      removedAssigneeIds: number[];
    };
  }> {
    if (!user.teamIds.includes(body.teamId)) {
      throw new ForbiddenException(
        'You are not a member of the specified team'
      );
    }

    const delta = await this.flagsService.syncFlags(
      activityId,
      body.teamId,
      body.assigneeIds,
      user.id,
      body.note,
      body.displayTeamPerAssignee
    );
    this.gateway.broadcastActivityUpdated(activityId);
    return { success: true, data: delta };
  }

  @ApiOperation({
    summary: 'Remove one assignee flag from an activity',
    description:
      'Removes one assignee from the flag set for the given (activity, team) pair. ' +
      'Any authenticated team member can unflag.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Activity ID' })
  @ApiParam({ name: 'teamId', type: Number, description: 'Team ID' })
  @ApiParam({
    name: 'assigneeId',
    type: Number,
    description: 'Assignee user ID',
  })
  @ApiResponse({ status: 200, description: 'Assignee flag removed' })
  @Delete(':id/flag/:teamId/:assigneeId')
  @HttpCode(HttpStatus.OK)
  async removeAssigneeFlag(
    @Param('id', ParseIntPipe) activityId: number,
    @Param('teamId', ParseIntPipe) teamId: number,
    @Param('assigneeId', ParseIntPipe) assigneeId: number,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean }> {
    if (!user.teamIds.includes(teamId)) {
      throw new ForbiddenException(
        'You are not a member of the specified team'
      );
    }

    await this.flagsService.removeAssigneeFlag(
      activityId,
      teamId,
      assigneeId,
      user.id
    );
    this.gateway.broadcastActivityUpdated(activityId);
    return { success: true };
  }

  @ApiOperation({
    summary: 'Remove all assignee flags for a team',
    description:
      'Removes all assignee flags for the given team. Any authenticated team member can unflag.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Activity ID' })
  @ApiParam({ name: 'teamId', type: Number, description: 'Team ID' })
  @ApiResponse({ status: 200, description: 'Flag removed' })
  @Delete(':id/flag/:teamId')
  @HttpCode(HttpStatus.OK)
  async removeFlag(
    @Param('id', ParseIntPipe) activityId: number,
    @Param('teamId', ParseIntPipe) teamId: number,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean }> {
    if (!user.teamIds.includes(teamId)) {
      throw new ForbiddenException(
        'You are not a member of the specified team'
      );
    }

    await this.flagsService.removeFlag(activityId, teamId, user.id);
    this.gateway.broadcastActivityUpdated(activityId);
    return { success: true };
  }
}
