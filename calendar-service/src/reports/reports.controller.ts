import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import type { ReportResponse } from '@corpcal/shared/schemas/lookup.schema';

import { RequirePermission } from '../policy/decorators/require-permission.decorator';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@Controller('reports')
@RequirePermission('reports.view')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active reports' })
  @ApiResponse({
    status: 200,
    description: 'List of all active reports',
    type: [Object],
  })
  async findAllReports(): Promise<ReportResponse[]> {
    return this.reportsService.findAllReports();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a report by ID' })
  @ApiResponse({
    status: 200,
    description: 'Report details',
    type: Object,
  })
  @ApiResponse({
    status: 404,
    description: 'Report not found',
  })
  async findReportById(
    @Param('id', ParseIntPipe) id: number
  ): Promise<ReportResponse | null> {
    return this.reportsService.findReportById(id);
  }
}
