import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LookAheadService } from './look-ahead.service';
import type { LookAheadResponse } from './look-ahead.service';
import { RequirePermission } from '../policy/decorators/require-permission.decorator';

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
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<LookAheadResponse> {
    return this.lookAheadService.getLookAheadData({
      startDate,
      endDate,
    });
  }
}
