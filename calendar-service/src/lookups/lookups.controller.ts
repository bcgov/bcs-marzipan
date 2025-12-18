import { Controller, Get, Query, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import {
  LookupsService,
  type LookupItem,
  type LookupQueryParams,
} from './lookups.service';
import { AppLogger } from '../common/logger/logger.service';
import { ParseOptionalIntPipe } from '../common/pipes/parse-optional-int.pipe';

@ApiTags('lookups')
@Controller('lookups')
export class LookupsController {
  private readonly logger = new AppLogger(LookupsController.name);

  constructor(private readonly lookupsService: LookupsService) {}

  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
  })
  @Get('categories')
  @Header('Cache-Control', 'public, max-age=3600')
  async getCategories(): Promise<{ success: boolean; data: LookupItem[] }> {
    const data = await this.lookupsService.getCategories();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get all organizations' })
  @ApiResponse({
    status: 200,
    description: 'Organizations retrieved successfully',
  })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'role', required: false, type: String })
  @ApiQuery({ name: 'organizationId', required: false, type: String })
  @Get('organizations')
  @Header('Cache-Control', 'public, max-age=300')
  async getOrganizations(
    @Query('userId', new ParseOptionalIntPipe()) userId?: number,
    @Query('role') role?: string,
    @Query('organizationId') organizationId?: string
  ): Promise<{ success: boolean; data: LookupItem[] }> {
    const params: LookupQueryParams = { userId, role, organizationId };
    const data = await this.lookupsService.getOrganizations(params);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get all system users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'role', required: false, type: String })
  @ApiQuery({ name: 'organizationId', required: false, type: String })
  @Get('users')
  @Header('Cache-Control', 'public, max-age=300')
  async getUsers(
    @Query('userId', new ParseOptionalIntPipe()) userId?: number,
    @Query('role') role?: string,
    @Query('organizationId') organizationId?: string
  ): Promise<{ success: boolean; data: LookupItem[] }> {
    const params: LookupQueryParams = { userId, role, organizationId };
    const data = await this.lookupsService.getUsers(params);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get all tags' })
  @ApiResponse({ status: 200, description: 'Tags retrieved successfully' })
  @Get('tags')
  @Header('Cache-Control', 'public, max-age=3600')
  async getTags(): Promise<{ success: boolean; data: LookupItem[] }> {
    const data = await this.lookupsService.getTags();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get all pitch statuses' })
  @ApiResponse({
    status: 200,
    description: 'Pitch statuses retrieved successfully',
  })
  @Get('pitch-statuses')
  @Header('Cache-Control', 'public, max-age=3600')
  async getPitchStatuses(): Promise<{ success: boolean; data: LookupItem[] }> {
    const data = await this.lookupsService.getPitchStatuses();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get all scheduling statuses' })
  @ApiResponse({
    status: 200,
    description: 'Scheduling statuses retrieved successfully',
  })
  @Get('scheduling-statuses')
  @Header('Cache-Control', 'public, max-age=3600')
  async getSchedulingStatuses(): Promise<{
    success: boolean;
    data: LookupItem[];
  }> {
    const data = await this.lookupsService.getSchedulingStatuses();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get all comms materials' })
  @ApiResponse({
    status: 200,
    description: 'Comms materials retrieved successfully',
  })
  @Get('comms-materials')
  @Header('Cache-Control', 'public, max-age=3600')
  async getCommsMaterials(): Promise<{ success: boolean; data: LookupItem[] }> {
    const data = await this.lookupsService.getCommsMaterials();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get all translation languages' })
  @ApiResponse({
    status: 200,
    description: 'Translation languages retrieved successfully',
  })
  @Get('translation-languages')
  @Header('Cache-Control', 'public, max-age=3600')
  async getTranslationLanguages(): Promise<{
    success: boolean;
    data: LookupItem[];
  }> {
    const data = await this.lookupsService.getTranslationLanguages();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get all government representatives' })
  @ApiResponse({
    status: 200,
    description: 'Government representatives retrieved successfully',
  })
  @Get('government-representatives')
  @Header('Cache-Control', 'public, max-age=3600')
  async getGovernmentRepresentatives(): Promise<{
    success: boolean;
    data: LookupItem[];
  }> {
    const data = await this.lookupsService.getGovernmentRepresentatives();
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Get activities for lookup (related activities dropdown)',
  })
  @ApiResponse({
    status: 200,
    description: 'Activities retrieved successfully',
  })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'role', required: false, type: String })
  @Get('activities')
  @Header('Cache-Control', 'public, max-age=300')
  async getActivitiesForLookup(
    @Query('userId', new ParseOptionalIntPipe()) userId?: number,
    @Query('role') role?: string
  ): Promise<{ success: boolean; data: LookupItem[] }> {
    const params: LookupQueryParams = { userId, role };
    const data = await this.lookupsService.getActivitiesForLookup(params);
    return { success: true, data };
  }
}
