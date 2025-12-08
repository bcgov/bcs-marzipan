import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Health and readiness endpoints used by OpenShift probes
  @Get('health')
  health() {
    return this.appService.getHealth();
  }

  @Get('ready')
  async readiness() {
    return await this.appService.getReadiness();
  }
}
