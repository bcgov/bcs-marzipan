import { Body, Controller, ForbiddenException, Get, Put } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  PERMISSIONS,
  SYSTEM_ROLE_IDS,
  type AuthUser,
  type ResponseWrapper,
} from '@corpcal/shared';
import type {
  BannerSettings,
  RecurringLockoutBannerSettings,
} from '@corpcal/shared/api/types';
import {
  upsertBannerSettingsRequestSchema,
  upsertRecurringLockoutBannerSettingsRequestSchema,
} from '@corpcal/shared/schemas';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  BannerSettingsNullableResponseWrapperDto,
  BannerSettingsResponseWrapperDto,
  RecurringLockoutBannerSettingsNullableResponseWrapperDto,
  RecurringLockoutBannerSettingsResponseWrapperDto,
  UpsertBannerSettingsDto,
  UpsertRecurringLockoutBannerSettingsDto,
} from '../common/dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { RequirePermission } from '../policy/decorators/require-permission.decorator';
import { BannerService } from './banner.service';

@ApiTags('banner')
@Controller('banner')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  private ensureSystemAdmin(user: AuthUser): void {
    if (user.roleId !== SYSTEM_ROLE_IDS.SYSTEM_ADMIN) {
      throw new ForbiddenException(
        'Only System Admin users can manage system banners.'
      );
    }
  }

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

  @ApiOperation({
    summary: 'Get active recurring lockout banner',
    description:
      'Returns the recurring lockout banner when active for the current time of day, or null when not active.',
  })
  @ApiResponse({
    status: 200,
    description: 'Active recurring lockout banner retrieved successfully',
    type: RecurringLockoutBannerSettingsNullableResponseWrapperDto,
  })
  @Get('recurring-lockout')
  async getActiveRecurringLockoutBanner(): Promise<
    ResponseWrapper<RecurringLockoutBannerSettings | null>
  > {
    const data = await this.bannerService.getActiveRecurringLockoutBanner();
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

  @ApiOperation({ summary: 'Get recurring lockout banner settings' })
  @ApiResponse({
    status: 200,
    description: 'Recurring lockout banner settings retrieved successfully',
    type: RecurringLockoutBannerSettingsNullableResponseWrapperDto,
  })
  @RequirePermission(PERMISSIONS.SETTINGS.VIEW)
  @Get('recurring-lockout/settings')
  async getRecurringLockoutBannerSettings(): Promise<
    ResponseWrapper<RecurringLockoutBannerSettings | null>
  > {
    const data =
      await this.bannerService.getCurrentRecurringLockoutBannerSettings();
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
    this.ensureSystemAdmin(user);

    const data = await this.bannerService.upsertBannerSettings(body, user.id);
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Create or update recurring lockout banner settings',
  })
  @ApiResponse({
    status: 200,
    description: 'Recurring lockout banner settings saved successfully',
    type: RecurringLockoutBannerSettingsResponseWrapperDto,
  })
  @ApiBody({ type: UpsertRecurringLockoutBannerSettingsDto })
  @RequirePermission(PERMISSIONS.SETTINGS.MANAGE)
  @Put('recurring-lockout/settings')
  async upsertRecurringLockoutBannerSettings(
    @Body(
      new ZodValidationPipe(upsertRecurringLockoutBannerSettingsRequestSchema)
    )
    body: UpsertRecurringLockoutBannerSettingsDto,
    @CurrentUser() user: AuthUser
  ): Promise<ResponseWrapper<RecurringLockoutBannerSettings>> {
    this.ensureSystemAdmin(user);

    const data = await this.bannerService.upsertRecurringLockoutBannerSettings(
      body,
      user.id
    );
    return { success: true, data };
  }
}
