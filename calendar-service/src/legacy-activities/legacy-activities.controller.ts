import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';

import {
  canViewActivityFieldScope,
  PERMISSIONS,
  type AuthUser,
} from '@corpcal/shared';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../policy/decorators/require-permission.decorator';
import {
  LegacyActivitiesService,
  type LegacyActivityListQuery,
} from './legacy-activities.service';

@Controller('legacy-activities')
@RequirePermission(PERMISSIONS.ACTIVITIES.VIEW)
export class LegacyActivitiesController {
  constructor(
    private readonly legacyActivitiesService: LegacyActivitiesService
  ) {}

  @Get()
  async list(@Query() query: LegacyActivityListQuery) {
    return this.legacyActivitiesService.list({
      search: query.search,
      status: query.status,
      startDate: query.startDate,
      endDate: query.endDate,
      limit: query.limit ?? 25,
      offset: query.offset ?? 0,
    });
  }

  @Get(':id')
  async getById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser | undefined
  ) {
    const row = await this.legacyActivitiesService.getById(
      id,
      user != null && canViewActivityFieldScope(user, 'notes'),
      user != null && canViewActivityFieldScope(user, 'lookAhead')
    );
    if (!row) {
      throw new NotFoundException(`Legacy activity ${id} not found`);
    }
    return row;
  }
}
