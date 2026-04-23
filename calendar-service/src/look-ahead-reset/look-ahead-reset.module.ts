import { Module } from '@nestjs/common';

import { ActivitiesModule } from '../activities/activities.module';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { LocksModule } from '../locks/locks.module';
import { LookAheadResetJobService } from './look-ahead-reset-job.service';
import { LookAheadResetSettingsController } from './look-ahead-reset-settings.controller';

@Module({
  imports: [DatabaseModule, AuthModule, LocksModule, ActivitiesModule],
  providers: [LookAheadResetJobService],
  controllers: [LookAheadResetSettingsController],
  exports: [LookAheadResetJobService],
})
export class LookAheadResetModule {}
