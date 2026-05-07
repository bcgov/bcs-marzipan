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
  type UpsertActivityFlagRequest,
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

@ApiTags('activities')
@Controller('activities')
export class ActivityFlagsController {
  private readonly logger = new AppLogger(ActivityFlagsController.name);

  constructor(
    private readonly flagsService: ActivityFlagsService,
    private readonly gateway: ActivitiesGateway
  ) {}

  @ApiOperation({
    summary: 'Assign (flag) an activity',
    description:
      'Assigns a team member to an activity for follow-up. ' +
      'At most one assignee per (activity, team) pair. ' +
      'Replaces the existing flag if one exists. ' +
      "Requires activities.flag permission. The caller's teamId must be provided in the body.",
  })
  @ApiParam({ name: 'id', type: Number, description: 'Activity ID' })
  @ApiBody({ type: UpsertActivityFlagDto })
  @ApiResponse({ status: 200, description: 'Flag set successfully' })
  @ApiResponse({
    status: 403,
    description: 'No team with flag permission or assignee not on team',
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
      body.assigneeId,
      user.id,
      body.note
    );
    this.gateway.broadcastActivityUpdated(activityId);
    return { success: true };
  }

  @ApiOperation({
    summary: 'Remove (unflag) an activity',
    description:
      'Removes the flag for the given team. Any team member with activities.flag permission can unflag.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Activity ID' })
  @ApiParam({ name: 'teamId', type: Number, description: 'Team ID' })
  @ApiResponse({ status: 200, description: 'Flag removed' })
  @RequirePermission('activities.flag')
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

    await this.flagsService.removeFlag(activityId, teamId);
    this.gateway.broadcastActivityUpdated(activityId);
    return { success: true };
  }
}
