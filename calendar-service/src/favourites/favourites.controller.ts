import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { PERMISSIONS, type AuthUser } from '@corpcal/shared';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AppLogger } from '../common/logger/logger.service';
import { RequirePermission } from '../policy/decorators/require-permission.decorator';
import { FavouritesService } from './favourites.service';

@ApiTags('activity-favourites')
@Controller('activity-favourites')
export class FavouritesController {
  private readonly logger = new AppLogger(FavouritesController.name);

  constructor(private readonly favouritesService: FavouritesService) {}

  @ApiOperation({
    summary: 'List favourite activity IDs for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Favourite activity IDs retrieved',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            activityIds: { type: 'array', items: { type: 'integer' } },
          },
        },
      },
    },
  })
  @RequirePermission(PERMISSIONS.ACTIVITIES.VIEW)
  @Get()
  async list(
    @CurrentUser() user: AuthUser
  ): Promise<{ success: boolean; data: { activityIds: number[] } }> {
    const activityIds = await this.favouritesService.list(user.id);
    return { success: true, data: { activityIds } };
  }

  @ApiOperation({
    summary: "Add an activity to the current user's favourites",
  })
  @ApiParam({ name: 'activityId', type: 'integer' })
  @ApiResponse({ status: 201, description: 'Activity added to favourites' })
  @RequirePermission(PERMISSIONS.ACTIVITIES.VIEW)
  @Post(':activityId')
  @HttpCode(HttpStatus.CREATED)
  async add(
    @CurrentUser() user: AuthUser,
    @Param('activityId', ParseIntPipe) activityId: number
  ): Promise<{ success: boolean }> {
    this.logger.log(
      `User ${user.id} adding activity ${activityId} to favourites`
    );
    await this.favouritesService.add(user.id, activityId);
    return { success: true };
  }

  @ApiOperation({
    summary: "Remove an activity from the current user's favourites",
  })
  @ApiParam({ name: 'activityId', type: 'integer' })
  @ApiResponse({
    status: 200,
    description: 'Activity removed from favourites',
  })
  @RequirePermission(PERMISSIONS.ACTIVITIES.VIEW)
  @Delete(':activityId')
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('activityId', ParseIntPipe) activityId: number
  ): Promise<{ success: boolean }> {
    this.logger.log(
      `User ${user.id} removing activity ${activityId} from favourites`
    );
    await this.favouritesService.remove(user.id, activityId);
    return { success: true };
  }
}
