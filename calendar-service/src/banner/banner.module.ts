import { Module } from '@nestjs/common';

import { ActivitiesModule } from '../activities/activities.module';
import { DatabaseModule } from '../database/database.module';
import { LocksModule } from '../locks/locks.module';
import { BannerController } from './banner.controller';
import { BannerService } from './banner.service';

@Module({
  imports: [DatabaseModule, ActivitiesModule, LocksModule],
  controllers: [BannerController],
  providers: [BannerService],
  exports: [BannerService],
})
export class BannerModule {}
