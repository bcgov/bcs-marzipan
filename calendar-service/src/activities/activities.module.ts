import { Module } from '@nestjs/common';
import { ActivitiesService } from './services/activities.service';
import { ActivitiesController } from './activities.controller';
import { ActivitiesGateway } from './activities.gateway';
import { ActivityHistoryService } from './services/activity-history.service';
import { ActivityJunctionService } from './services/activity-junction.service';
import { ActivityDataFetcherService } from './services/activity-data-fetcher.service';
import { ActivityMapperService } from './services/activity-mapper.service';
import { ActivityUtilsService } from './services/activity-utils.service';
import { DatabaseModule } from '../database/database.module';
import { PolicyModule } from '../policy/policy.module';

@Module({
  imports: [DatabaseModule, PolicyModule],
  providers: [
    ActivitiesService,
    ActivitiesGateway,
    ActivityHistoryService,
    ActivityJunctionService,
    ActivityDataFetcherService,
    ActivityMapperService,
    ActivityUtilsService,
  ],
  controllers: [ActivitiesController],
})
export class ActivitiesModule {}
