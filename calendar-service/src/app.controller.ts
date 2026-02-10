import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { HealthResponseDto, ReadinessResponseDto } from './common/dto';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({
    summary: 'Health check',
    description:
      'Returns the health status of the service. Used by OpenShift liveness probes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    type: HealthResponseDto,
  })
  @Get('health')
  health() {
    return this.appService.getHealth();
  }

  @ApiOperation({
    summary: 'Readiness probe',
    description:
      'Checks if the service is ready to accept traffic. Verifies database connectivity. Used by OpenShift readiness probes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service readiness status',
    type: ReadinessResponseDto,
  })
  @Get('ready')
  async readiness() {
    return await this.appService.getReadiness();
  }
}
