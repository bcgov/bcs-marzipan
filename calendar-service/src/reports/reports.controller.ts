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

import {
  reportDataQuerySchema,
  type ReportDataQueryParams,
} from '@corpcal/shared/schemas';
import type { ReportResponse } from '@corpcal/shared/schemas/lookup.schema';

import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { RequestContext } from '../policy/decorators/request-context.decorator';
import { RequirePermission } from '../policy/decorators/require-permission.decorator';
import type { RequestContext as RequestContextType } from '../policy/dto/user-context.dto';
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
    @Query(new ZodValidationPipe(reportDataQuerySchema))
    query: ReportDataQueryParams,
    @RequestContext() ctx: RequestContextType
  ): Promise<ReportDataResponse> {
    return this.reportsService.getReportData(type, query, ctx);
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
    @Query(new ZodValidationPipe(reportDataQuerySchema))
    query: ReportDataQueryParams,
    @RequestContext() ctx: RequestContextType
  ): Promise<void> {
    const data = await this.reportsService.getReportData(type, query, ctx);

    const csvContent = this.reportsService.generateReportCsv(data);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${type}-report.csv"`
    );
    res.send(csvContent);
  }

  @Get('export/:type/xlsx')
  @ApiOperation({ summary: 'Export report as Excel (XLSX)' })
  @ApiResponse({
    status: 200,
    description: 'Excel workbook download',
  })
  async exportReportXlsx(
    @Param('type') type: string,
    @Res() res: Response,
    @Query(new ZodValidationPipe(reportDataQuerySchema))
    query: ReportDataQueryParams,
    @RequestContext() ctx: RequestContextType
  ): Promise<void> {
    const data = await this.reportsService.getReportData(type, query, ctx);
    const buffer = await this.reportsService.generateReportExcelBuffer(data);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${type}-report.xlsx"`
    );
    res.send(buffer);
  }

  @Get('export/:type/pdf')
  @ApiOperation({ summary: 'Export report as PDF' })
  @ApiResponse({
    status: 200,
    description: 'PDF file download',
  })
  async exportReportPdf(
    @Param('type') type: string,
    @Res() res: Response,
    @Query(new ZodValidationPipe(reportDataQuerySchema))
    query: ReportDataQueryParams,
    @RequestContext() ctx: RequestContextType
  ): Promise<void> {
    const data = await this.reportsService.getReportData(type, query, ctx);
    const buffer = await this.reportsService.generateReportPdfBuffer(
      type,
      data
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${type}-report.pdf"`
    );
    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, private'
    );
    res.send(buffer);
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
