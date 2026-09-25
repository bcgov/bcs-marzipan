import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  lookAheadQuerySchema,
  type LookAheadQuery,
} from '@corpcal/shared/schemas';

import { LookAheadDataResponseWrapperDto } from '../common/dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ApiZodQueries } from '../common/swagger/zod-query.openapi';
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
  @ApiOperation({
    summary: 'Get Look Ahead report data',
    description:
      'Prefer GET /reports/data/look-ahead for the same data with report meta and filters.',
  })
  @ApiZodQueries(lookAheadQuerySchema)
  @ApiResponse({
    status: 200,
    description: 'Report config and activities grouped by section',
    type: LookAheadDataResponseWrapperDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Look Ahead report not found',
  })
  async getLookAheadData(
    @RequestContext() ctx: RequestContextType,
    @Query(new ZodValidationPipe(lookAheadQuerySchema)) query: LookAheadQuery
  ): Promise<{ success: true; data: LookAheadResponse }> {
    const data = await this.lookAheadService.getLookAheadData(ctx, {
      startDate: query.startDate,
      endDate: query.endDate,
    });
    return { success: true, data };
  }
}
