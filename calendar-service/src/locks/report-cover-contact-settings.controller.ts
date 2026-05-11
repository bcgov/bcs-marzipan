import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { PERMISSIONS } from '@corpcal/shared';
import { reportCoverContactSettingsSchema } from '@corpcal/shared/schemas';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { RequirePermission } from '../policy/decorators/require-permission.decorator';
import { ApplicationSettingsService } from './application-settings.service';

@ApiTags('settings')
@Controller('settings/report-cover-contact')
@UseGuards(JwtAuthGuard)
export class ReportCoverContactSettingsController {
  constructor(
    private readonly applicationSettings: ApplicationSettingsService
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'Get contact phone and email shown on look-ahead family PDF cover pages',
  })
  @ApiResponse({ status: 200, description: 'Current values' })
  @RequirePermission(PERMISSIONS.SETTINGS.MANAGE)
  async getSettings() {
    const data =
      await this.applicationSettings.getLookAheadReportCoverContact();
    return { success: true, data };
  }

  @Patch()
  @ApiOperation({
    summary:
      'Update contact phone and email on look-ahead family PDF cover pages',
  })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  @RequirePermission(PERMISSIONS.SETTINGS.MANAGE)
  async patchSettings(
    @Body(new ZodValidationPipe(reportCoverContactSettingsSchema))
    body: {
      contactPhone: string;
      contactEmail: string;
    }
  ) {
    await this.applicationSettings.setLookAheadReportCoverContact(
      body.contactPhone,
      body.contactEmail
    );
    return { success: true, data: body };
  }
}
