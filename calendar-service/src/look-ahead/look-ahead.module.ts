import { Module } from '@nestjs/common';
import { LookAheadController } from './look-ahead.controller';
import { LookAheadService } from './look-ahead.service';
import { ReportsModule } from '../reports/reports.module';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [ReportsModule, ActivitiesModule],
  controllers: [LookAheadController],
  providers: [LookAheadService],
})
export class LookAheadModule {}
