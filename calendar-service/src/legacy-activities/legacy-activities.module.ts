import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { LegacyActivitiesController } from './legacy-activities.controller';
import { LegacyActivitiesService } from './legacy-activities.service';

@Module({
  imports: [DatabaseModule],
  controllers: [LegacyActivitiesController],
  providers: [LegacyActivitiesService],
  exports: [LegacyActivitiesService],
})
export class LegacyActivitiesModule {}
