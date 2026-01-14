import { Controller, Get, Post, Body, Query, Header } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
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

  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        displayName: { type: 'string', nullable: true },
        sortOrder: { type: 'number' },
        isActive: { type: 'boolean', default: true },
      },
      required: ['name', 'sortOrder'],
    },
  })
  @Post('categories')
  async createCategory(
    @Body()
    body: {
      name: string;
      displayName?: string;
      sortOrder: number;
      isActive?: boolean;
    }
  ): Promise<{ success: boolean; data: any }> {
    const { name, displayName, sortOrder, isActive } = body;
    const data = await this.lookupsService.createCategory({
      name,
      displayName,
      sortOrder,
      isActive,
    });
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

  @ApiOperation({ summary: 'Create a new tag' })
  @ApiResponse({
    status: 201,
    description: 'Tag created successfully',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        displayName: { type: 'string', nullable: true },
        sortOrder: { type: 'number' },
        isActive: { type: 'boolean', default: true },
      },
      required: ['key', 'sortOrder'],
    },
  })
  @Post('tags')
  async createTag(
    @Body()
    body: {
      key: string;
      displayName?: string;
      sortOrder: number;
      isActive?: boolean;
    }
  ): Promise<{ success: boolean; data: any }> {
    const { key, displayName, sortOrder, isActive } = body;
    const data = await this.lookupsService.createTag({
      key,
      displayName,
      sortOrder,
      isActive,
    });
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

  @ApiOperation({ summary: 'Create a new comms material' })
  @ApiResponse({
    status: 201,
    description: 'Comms material created successfully',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        displayName: { type: 'string', nullable: true },
        sortOrder: { type: 'number' },
        isActive: { type: 'boolean', default: true },
      },
      required: ['name', 'sortOrder'],
    },
  })
  @Post('comms-materials')
  async createCommsMaterial(
    @Body()
    body: {
      name: string;
      displayName?: string;
      sortOrder: number;
      isActive?: boolean;
    }
  ): Promise<{ success: boolean; data: any }> {
    const { name, displayName, sortOrder, isActive } = body;
    const data = await this.lookupsService.createCommsMaterial({
      name,
      displayName,
      sortOrder,
      isActive,
    });
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

  @ApiOperation({ summary: 'Create a new government representative' })
  @ApiResponse({
    status: 201,
    description: 'Government representative created successfully',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        displayName: { type: 'string', nullable: true },
        title: { type: 'string', nullable: true },
        sortOrder: { type: 'number' },
        isActive: { type: 'boolean', default: true },
      },
      required: ['name', 'sortOrder'],
    },
  })
  @Post('government-representatives')
  async createGovernmentRepresentative(
    @Body()
    body: {
      name: string;
      displayName?: string;
      title?: string;
      sortOrder: number;
      isActive?: boolean;
    }
  ): Promise<{ success: boolean; data: any }> {
    const { name, displayName, title, sortOrder, isActive } = body;
    const data = await this.lookupsService.createGovernmentRepresentative({
      name,
      displayName,
      title,
      sortOrder,
      isActive,
    });
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

  @ApiOperation({ summary: 'Get all cities' })
  @ApiResponse({
    status: 200,
    description: 'Cities retrieved successfully',
  })
  @Get('cities')
  @Header('Cache-Control', 'public, max-age=3600')
  async getCities(): Promise<{ success: boolean; data: LookupItem[] }> {
    const data = await this.lookupsService.getCities();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Create a new city' })
  @ApiResponse({
    status: 201,
    description: 'City created successfully',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        displayName: { type: 'string', nullable: true },
        province: { type: 'string', nullable: true },
        sortOrder: { type: 'number' },
        isActive: { type: 'boolean', default: true },
      },
      required: ['name', 'sortOrder'],
    },
  })
  @Post('cities')
  async createCity(
    @Body()
    body: {
      name: string;
      displayName?: string;
      province?: string;
      sortOrder: number;
      isActive?: boolean;
    }
  ): Promise<{ success: boolean; data: any }> {
    const { name, displayName, province, sortOrder, isActive } = body;
    const data = await this.lookupsService.createCity({
      name,
      displayName,
      province,
      sortOrder,
      isActive,
    });
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get all ministries' })
  @ApiResponse({
    status: 200,
    description: 'Ministries retrieved successfully',
  })
  @Get('ministries')
  @Header('Cache-Control', 'public, max-age=3600')
  async getMinistries(): Promise<{ success: boolean; data: LookupItem[] }> {
    const data = await this.lookupsService.getMinistries();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Create a new ministry' })
  @ApiResponse({
    status: 201,
    description: 'Ministry created successfully',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        displayName: { type: 'string' },
        abbreviation: { type: 'string', nullable: true },
        ministerName: { type: 'string', nullable: true },
        sortOrder: { type: 'number' },
        isActive: { type: 'boolean', default: true },
      },
      required: ['displayName', 'sortOrder'],
    },
  })
  @Post('ministries')
  async createMinistry(
    @Body()
    body: {
      displayName: string;
      abbreviation?: string;
      ministerName?: string;
      sortOrder: number;
      isActive?: boolean;
    }
  ): Promise<{ success: boolean; data: any }> {
    const { displayName, abbreviation, ministerName, sortOrder, isActive } =
      body;
    const data = await this.lookupsService.createMinistry({
      displayName,
      abbreviation,
      ministerName,
      sortOrder,
      isActive,
    });
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get all themes' })
  @ApiResponse({
    status: 200,
    description: 'Themes retrieved successfully',
  })
  @Get('themes')
  @Header('Cache-Control', 'public, max-age=3600')
  async getThemes(): Promise<{ success: boolean; data: LookupItem[] }> {
    const data = await this.lookupsService.getThemes();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Create a new theme' })
  @ApiResponse({
    status: 201,
    description: 'Theme created successfully',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        displayName: { type: 'string', nullable: true },
        sortOrder: { type: 'number' },
        isActive: { type: 'boolean', default: true },
      },
      required: ['key', 'sortOrder'],
    },
  })
  @Post('themes')
  async createTheme(
    @Body()
    body: {
      key: string;
      displayName?: string;
      sortOrder: number;
      isActive?: boolean;
    }
  ): Promise<{ success: boolean; data: any }> {
    const { key, displayName, sortOrder, isActive } = body;
    const data = await this.lookupsService.createTheme({
      key,
      displayName,
      sortOrder,
      isActive,
    });
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get all activity statuses' })
  @ApiResponse({
    status: 200,
    description: 'Activity statuses retrieved successfully',
  })
  @Get('activity-statuses')
  @Header('Cache-Control', 'public, max-age=3600')
  async getActivityStatuses(): Promise<{
    success: boolean;
    data: LookupItem[];
  }> {
    const data = await this.lookupsService.getActivityStatuses();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Create a new activity status' })
  @ApiResponse({
    status: 201,
    description: 'Activity status created successfully',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        displayName: { type: 'string', nullable: true },
        sortOrder: { type: 'number' },
        isActive: { type: 'boolean', default: true },
      },
      required: ['name', 'sortOrder'],
    },
  })
  @Post('activity-statuses')
  async createActivityStatus(
    @Body()
    body: {
      name: string;
      displayName?: string;
      sortOrder: number;
      isActive?: boolean;
    }
  ): Promise<{ success: boolean; data: any }> {
    const { name, displayName, sortOrder, isActive } = body;
    const data = await this.lookupsService.createActivityStatus({
      name,
      displayName,
      sortOrder,
      isActive,
    });
    return { success: true, data };
  }
}
