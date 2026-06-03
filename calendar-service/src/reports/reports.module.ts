import { Module } from '@nestjs/common';

import { ActivitiesModule } from '../activities/activities.module';
import { DatabaseModule } from '../database/database.module';
import { LocksModule } from '../locks/locks.module';
import { LookAheadPolicyModule } from '../look-ahead/look-ahead-policy.module';
import { LookupsModule } from '../lookups/lookups.module';
import { PdfGeneratorService } from './pdf-generator.service';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    DatabaseModule,
    ActivitiesModule,
    LookAheadPolicyModule,
    LocksModule,
    LookupsModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService, PdfGeneratorService],
  exports: [ReportsService],
})
export class ReportsModule {}
