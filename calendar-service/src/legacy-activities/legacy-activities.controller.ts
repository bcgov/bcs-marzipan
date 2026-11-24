import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';

import { PERMISSIONS } from '@corpcal/shared';

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
      archived:
        query.archived === undefined
          ? undefined
          : query.archived === 'true' || query.archived === true,
      sourceSystem: query.sourceSystem,
      startDate: query.startDate,
      endDate: query.endDate,
      limit: query.limit ?? 25,
      offset: query.offset ?? 0,
    });
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    const row = await this.legacyActivitiesService.getById(id);
    if (!row) {
      throw new NotFoundException(`Legacy activity ${id} not found`);
    }
    return row;
  }
}
