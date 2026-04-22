import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { PERMISSIONS } from '@corpcal/shared';
import {
  reviewExemptFieldKeysSettingsSchema,
  type ReviewExemptFieldKeysSettings,
} from '@corpcal/shared/schemas';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { RequirePermission } from '../policy/decorators/require-permission.decorator';
import { ApplicationSettingsService } from './application-settings.service';

@ApiTags('settings')
@Controller('settings/review-exempt-fields')
@UseGuards(JwtAuthGuard)
export class ReviewExemptFieldsController {
  constructor(
    private readonly applicationSettings: ApplicationSettingsService
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get admin-configurable review-exempt form field keys',
  })
  @ApiResponse({ status: 200, description: 'Field keys' })
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PERMISSIONS.SETTINGS.MANAGE_REVIEW_EXEMPT_FIELDS)
  async getSettings(): Promise<{
    success: true;
    data: ReviewExemptFieldKeysSettings;
  }> {
    const fieldKeys = await this.applicationSettings.getReviewExemptFieldKeys();
    return { success: true, data: { fieldKeys } };
  }

  @Patch()
  @ApiOperation({ summary: 'Update review-exempt form field keys' })
  @ApiResponse({ status: 200, description: 'Updated keys' })
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PERMISSIONS.SETTINGS.MANAGE_REVIEW_EXEMPT_FIELDS)
  async patchSettings(
    @Body(new ZodValidationPipe(reviewExemptFieldKeysSettingsSchema))
    body: ReviewExemptFieldKeysSettings
  ): Promise<{ success: true; data: ReviewExemptFieldKeysSettings }> {
    await this.applicationSettings.setReviewExemptFieldKeys(body.fieldKeys);
    return { success: true, data: { fieldKeys: body.fieldKeys } };
  }
}
