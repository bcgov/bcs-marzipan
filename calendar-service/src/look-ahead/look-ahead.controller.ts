import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { RequestContext } from '../policy/decorators/request-context.decorator';
import { RequirePermission } from '../policy/decorators/require-permission.decorator';
import type { RequestContext as RequestContextType } from '../policy/dto/user-context.dto';
import { LookAheadService, type LookAheadResponse } from './look-ahead.service';

@ApiTags('look-ahead')
@Controller('look-ahead')
@RequirePermission('reports.view')
export class LookAheadController {
  constructor(private readonly lookAheadService: LookAheadService) {}

  @Get()
  @ApiOperation({ summary: 'Get Look Ahead report data' })
  @ApiResponse({
    status: 200,
    description: 'Report config and activities grouped by section',
  })
  @ApiResponse({
    status: 404,
    description: 'Look Ahead report not found',
  })
  async getLookAheadData(
    @RequestContext() ctx: RequestContextType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<LookAheadResponse> {
    return this.lookAheadService.getLookAheadData(ctx, {
      startDate,
      endDate,
    });
  }
}
