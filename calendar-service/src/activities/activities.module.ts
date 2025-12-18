import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { ActivitiesController } from './activities.controller';
import { ActivitiesGateway } from './activities.gateway';
import { ActivitiesService } from './activities.service';

@Module({
  imports: [DatabaseModule],
  providers: [ActivitiesService, ActivitiesGateway],
  controllers: [ActivitiesController],
})
export class ActivitiesModule {}
