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
  upsertActivityFlagRequestSchema,
  upsertActivityFlagsRequestSchema,
  type UpsertActivityFlagRequest,
  type UpsertActivityFlagsRequest,
} from '@corpcal/shared/schemas';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AppLogger } from '../common/logger/logger.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { RequirePermission } from '../policy/decorators/require-permission.decorator';
import { ActivitiesGateway } from './activities.gateway';
import { ActivityFlagsService } from './services/activity-flags.service';

class UpsertActivityFlagDto extends createZodDto(
  upsertActivityFlagRequestSchema
) {}

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
    summary: 'Flag an activity for one teammate (legacy)',
    description:
      'Legacy single-user endpoint. Flags one team member on an activity for follow-up. ' +
      'Internally syncs the full flagged-user set for the given (activity, team) pair to exactly one user, ' +
      'so calling this route will remove any other existing flags for that team. ' +
      'Prefer PUT /activities/:id/flags for multi-user updates. ' +
      "Requires activities.flag permission. The caller's teamId must be provided in the body.",
  })
  @ApiParam({ name: 'id', type: Number, description: 'Activity ID' })
  @ApiBody({ type: UpsertActivityFlagDto })
  @ApiResponse({ status: 200, description: 'Flag set successfully' })
  @ApiResponse({
    status: 403,
    description: 'No team with flag permission or flagged user not on team',
  })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  @RequirePermission('activities.flag')
  @Put(':id/flag')
  @HttpCode(HttpStatus.OK)
  async upsertFlag(
    @Param('id', ParseIntPipe) activityId: number,
    @Body(new ZodValidationPipe(upsertActivityFlagRequestSchema))
    body: UpsertActivityFlagRequest,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean }> {
    // Ensure the caller is on the team they are flagging for
    if (!user.teamIds.includes(body.teamId)) {
      throw new ForbiddenException(
        'You are not a member of the specified team'
      );
    }

    await this.flagsService.upsertFlag(
      activityId,
      body.teamId,
      body.flaggedUserId,
      user.id,
      body.note
    );
    this.gateway.broadcastActivityUpdated(activityId);
    return { success: true };
  }

  @ApiOperation({
    summary: 'Sync flagged users for an activity',
    description:
      'Sets the full flagged-user list for the given (activity, team) pair. ' +
      'Adds missing users and removes flags for users not present in the provided list. ' +
      'This is the preferred multi-user endpoint. ' +
      'By contrast, the legacy PUT /activities/:id/flag route overwrites the full set to a single user and can remove other flags for that team. ' +
      'Requires activities.flag permission and a teamId the caller belongs to.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Activity ID' })
  @ApiBody({ type: UpsertActivityFlagsDto })
  @ApiResponse({ status: 200, description: 'Flags synced successfully' })
  @ApiResponse({
    status: 403,
    description: 'No team with flag permission or flagged user not on team',
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
    success: boolean;
    addedFlaggedUserIds: number[];
    removedFlaggedUserIds: number[];
  }> {
    if (!user.teamIds.includes(body.teamId)) {
      throw new ForbiddenException(
        'You are not a member of the specified team'
      );
    }

    const delta = await this.flagsService.syncFlags(
      activityId,
      body.teamId,
      body.flaggedUserIds,
      user.id,
      body.note,
      body.displayTeamPerFlaggedUser
    );
    this.gateway.broadcastActivityUpdated(activityId);
    return { success: true, ...delta };
  }

  @ApiOperation({
    summary: 'Remove one flag for a user on an activity',
    description:
      'Removes one flagged user from the flag set for the given (activity, team) pair. ' +
      'Any authenticated team member can unflag.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Activity ID' })
  @ApiParam({ name: 'teamId', type: Number, description: 'Team ID' })
  @ApiParam({
    name: 'flaggedUserId',
    type: Number,
    description: 'Flagged user ID',
  })
  @ApiResponse({ status: 200, description: 'Flag removed' })
  @Delete(':id/flag/:teamId/:flaggedUserId')
  @HttpCode(HttpStatus.OK)
  async removeFlagForUser(
    @Param('id', ParseIntPipe) activityId: number,
    @Param('teamId', ParseIntPipe) teamId: number,
    @Param('flaggedUserId', ParseIntPipe) flaggedUserId: number,
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean }> {
    if (!user.teamIds.includes(teamId)) {
      throw new ForbiddenException(
        'You are not a member of the specified team'
      );
    }

    await this.flagsService.removeFlagForUser(
      activityId,
      teamId,
      flaggedUserId,
      user.id
    );
    this.gateway.broadcastActivityUpdated(activityId);
    return { success: true };
  }

  @ApiOperation({
    summary: 'Remove all flags for a team on an activity',
    description:
      'Removes all flags for the given team. Any authenticated team member can unflag.',
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
