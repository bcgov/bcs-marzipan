import { forwardRef, Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { LocksModule } from '../locks/locks.module';
import { LookAheadPolicyModule } from '../look-ahead/look-ahead-policy.module';
import { PolicyModule } from '../policy/policy.module';
import { TeamsModule } from '../teams/teams.module';
import { ActivitiesController } from './activities.controller';
import { ActivitiesGateway } from './activities.gateway';
import { ActivityFlagsController } from './activity-flags.controller';
import { ActivityResponseRedactionInterceptor } from './interceptors/activity-response-redaction.interceptor';
import { ActivitiesService } from './services/activities.service';
import { ActivityDataFetcherService } from './services/activity-data-fetcher.service';
import { ActivityDisplayIdSyncService } from './services/activity-display-id-sync.service';
import { ActivityFlagsService } from './services/activity-flags.service';
import { ActivityHistoryService } from './services/activity-history.service';
import { ActivityJunctionService } from './services/activity-junction.service';
import { ActivityMapperService } from './services/activity-mapper.service';
import { ActivityUtilsService } from './services/activity-utils.service';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    forwardRef(() => LocksModule),
    PolicyModule,
    forwardRef(() => TeamsModule),
    LookAheadPolicyModule,
  ],
  providers: [
    ActivityResponseRedactionInterceptor,
    ActivitiesService,
    ActivitiesGateway,
    ActivityFlagsService,
    ActivityHistoryService,
    ActivityJunctionService,
    ActivityDataFetcherService,
    ActivityMapperService,
    ActivityUtilsService,
    ActivityDisplayIdSyncService,
  ],
  controllers: [ActivitiesController, ActivityFlagsController],
  exports: [
    ActivitiesService,
    ActivitiesGateway,
    ActivityFlagsService,
    ActivityHistoryService,
    ActivityDisplayIdSyncService,
    ActivityUtilsService,
  ],
})
export class ActivitiesModule {}
