import { Module } from '@nestjs/common';

import { ActivitiesModule } from '../activities/activities.module';
import { ReportsModule } from '../reports/reports.module';
import { LookAheadController } from './look-ahead.controller';
import { LookAheadService } from './look-ahead.service';

@Module({
  imports: [ReportsModule, ActivitiesModule],
  controllers: [LookAheadController],
  providers: [LookAheadService],
})
export class LookAheadModule {}
