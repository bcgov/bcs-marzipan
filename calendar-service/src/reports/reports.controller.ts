import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import type { ReportResponse } from '@corpcal/shared/schemas/lookup.schema';

import { RequirePermission } from '../policy/decorators/require-permission.decorator';
import { ReportsService, type ReportDataResponse } from './reports.service';

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

  @Get('data/:type')
  @ApiOperation({ summary: 'Get report data by type' })
  @ApiResponse({
    status: 200,
    description: 'Report data with sections and activities',
    type: Object,
  })
  @ApiResponse({
    status: 404,
    description: 'Report not found',
  })
  async getReportData(
    @Param('type') type: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<ReportDataResponse> {
    return this.reportsService.getReportData(type, {
      startDate,
      endDate,
    });
  }

  @Get('export/:type/csv')
  @ApiOperation({ summary: 'Export report as CSV' })
  @ApiResponse({
    status: 200,
    description: 'CSV file download',
  })
  async exportReportCsv(
    @Param('type') type: string,
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<void> {
    const data = await this.reportsService.getReportData(type, {
      startDate,
      endDate,
    });

    const csvContent = this.reportsService.generateReportCsv(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${type}-report.csv"`
    );
    res.send(csvContent);
  }
}
