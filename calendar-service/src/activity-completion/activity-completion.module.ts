import { Module } from '@nestjs/common';

import { ActivitiesModule } from '../activities/activities.module';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { LocksModule } from '../locks/locks.module';
import { ActivityCompletionJobService } from './activity-completion-job.service';
import { ActivityCompletionSettingsController } from './activity-completion-settings.controller';

@Module({
  imports: [DatabaseModule, AuthModule, LocksModule, ActivitiesModule],
  providers: [ActivityCompletionJobService],
  controllers: [ActivityCompletionSettingsController],
  exports: [ActivityCompletionJobService],
})
export class ActivityCompletionModule {}
