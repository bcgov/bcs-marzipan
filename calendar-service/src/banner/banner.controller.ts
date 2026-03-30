import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  PERMISSIONS,
  type AuthUser,
  type ResponseWrapper,
} from '@corpcal/shared';
import type { BannerSettings } from '@corpcal/shared/api/types';
import { upsertBannerSettingsRequestSchema } from '@corpcal/shared/schemas';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  BannerSettingsNullableResponseWrapperDto,
  BannerSettingsResponseWrapperDto,
  UpsertBannerSettingsDto,
} from '../common/dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { RequirePermission } from '../policy/decorators/require-permission.decorator';
import { BannerService } from './banner.service';

@ApiTags('banner')
@Controller('banner')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @ApiOperation({
    summary: 'Get active banner',
    description:
      'Returns the currently active and scheduled system banner for authenticated users, or null when no banner should be shown.',
  })
  @ApiResponse({
    status: 200,
    description: 'Active banner retrieved successfully',
    type: BannerSettingsNullableResponseWrapperDto,
  })
  @Get()
  async getActiveBanner(): Promise<ResponseWrapper<BannerSettings | null>> {
    const data = await this.bannerService.getActiveBanner();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get current banner settings' })
  @ApiResponse({
    status: 200,
    description: 'Current banner settings retrieved successfully',
    type: BannerSettingsNullableResponseWrapperDto,
  })
  @RequirePermission(PERMISSIONS.SETTINGS.VIEW)
  @Get('settings')
  async getBannerSettings(): Promise<ResponseWrapper<BannerSettings | null>> {
    const data = await this.bannerService.getCurrentBannerSettings();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Create or update banner settings' })
  @ApiResponse({
    status: 200,
    description: 'Banner settings saved successfully',
    type: BannerSettingsResponseWrapperDto,
  })
  @ApiBody({ type: UpsertBannerSettingsDto })
  @RequirePermission(PERMISSIONS.SETTINGS.MANAGE)
  @Put('settings')
  async upsertBannerSettings(
    @Body(new ZodValidationPipe(upsertBannerSettingsRequestSchema))
    body: UpsertBannerSettingsDto,
    @CurrentUser() user: AuthUser
  ): Promise<ResponseWrapper<BannerSettings>> {
    const data = await this.bannerService.upsertBannerSettings(body, user.id);
    return { success: true, data };
  }
}
