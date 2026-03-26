import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { LocksModule } from '../locks/locks.module';
import { PolicyModule } from '../policy/policy.module';
import { TeamsModule } from '../teams/teams.module';
import { ActivitiesController } from './activities.controller';
import { ActivitiesGateway } from './activities.gateway';
import { ActivitiesService } from './services/activities.service';
import { ActivityDataFetcherService } from './services/activity-data-fetcher.service';
import { ActivityHistoryService } from './services/activity-history.service';
import { ActivityJunctionService } from './services/activity-junction.service';
import { ActivityMapperService } from './services/activity-mapper.service';
import { ActivityUtilsService } from './services/activity-utils.service';

@Module({
  imports: [DatabaseModule, LocksModule, PolicyModule, TeamsModule],
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
  exports: [ActivitiesService, ActivitiesGateway],
})
export class ActivitiesModule {}
