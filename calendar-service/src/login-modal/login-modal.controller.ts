import { Body, Controller, ForbiddenException, Get, Put } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  PERMISSIONS,
  SYSTEM_ROLE_IDS,
  type AuthUser,
  type ResponseWrapper,
} from '@corpcal/shared';
import type { LoginModalSettings } from '@corpcal/shared/api/types';
import { upsertLoginModalSettingsRequestSchema } from '@corpcal/shared/schemas';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  LoginModalSettingsNullableResponseWrapperDto,
  LoginModalSettingsResponseWrapperDto,
  UpsertLoginModalSettingsDto,
} from '../common/dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { RequirePermission } from '../policy/decorators/require-permission.decorator';
import { LoginModalService } from './login-modal.service';

@ApiTags('login-modal')
@Controller('login-modal')
export class LoginModalController {
  constructor(private readonly loginModalService: LoginModalService) {}

  private ensureSystemAdmin(user: AuthUser): void {
    if (user.roleId !== SYSTEM_ROLE_IDS.SYSTEM_ADMIN) {
      throw new ForbiddenException(
        'Only System Admin users can manage the login modal.'
      );
    }
  }

  @ApiOperation({
    summary: 'Get active login modal',
    description:
      'Returns the currently active login modal for authenticated users, or null when none should be shown.',
  })
  @ApiResponse({
    status: 200,
    description: 'Active login modal retrieved successfully',
    type: LoginModalSettingsNullableResponseWrapperDto,
  })
  @Get()
  async getActive(): Promise<ResponseWrapper<LoginModalSettings | null>> {
    const data = await this.loginModalService.getActive();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Get current login modal settings' })
  @ApiResponse({
    status: 200,
    description: 'Current login modal settings retrieved successfully',
    type: LoginModalSettingsNullableResponseWrapperDto,
  })
  @RequirePermission(PERMISSIONS.SETTINGS.VIEW)
  @Get('settings')
  async getSettings(): Promise<ResponseWrapper<LoginModalSettings | null>> {
    const data = await this.loginModalService.getCurrentSettings();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Create or update login modal settings' })
  @ApiResponse({
    status: 200,
    description: 'Login modal settings saved successfully',
    type: LoginModalSettingsResponseWrapperDto,
  })
  @ApiBody({ type: UpsertLoginModalSettingsDto })
  @RequirePermission(PERMISSIONS.SETTINGS.MANAGE)
  @Put('settings')
  async upsertSettings(
    @Body(new ZodValidationPipe(upsertLoginModalSettingsRequestSchema))
    body: UpsertLoginModalSettingsDto,
    @CurrentUser() user: AuthUser
  ): Promise<ResponseWrapper<LoginModalSettings>> {
    this.ensureSystemAdmin(user);

    const data = await this.loginModalService.upsert(body, user.id);
    return { success: true, data };
  }
}
