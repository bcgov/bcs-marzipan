import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';

import {
  LegacyActivitiesService,
  type LegacyActivityListQuery,
} from './legacy-activities.service';

@Controller('legacy-activities')
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
