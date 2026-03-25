import { forwardRef, Module } from '@nestjs/common';

import { ActivitiesModule } from '../activities/activities.module';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { LocksController } from './locks.controller';
import { LocksService } from './locks.service';

@Module({
  imports: [DatabaseModule, AuthModule, forwardRef(() => ActivitiesModule)],
  providers: [LocksService],
  controllers: [LocksController],
  exports: [LocksService],
})
export class LocksModule {}
