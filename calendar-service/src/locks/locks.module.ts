import { forwardRef, Module } from '@nestjs/common';

import { ActivitiesModule } from '../activities/activities.module';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { PolicyModule } from '../policy/policy.module';
import { ActivityInfoIconsController } from './activity-info-icons.controller';
import { ApplicationSettingsService } from './application-settings.service';
import { LockHandoffDeadlineKickService } from './lock-handoff-deadline-kick.service';
import { LockHandoffPoller } from './lock-handoff-poller.service';
import { LocksController } from './locks.controller';
import { LocksService } from './locks.service';
import { RecurringLockoutService } from './recurring-lockout.service';
import { ReportCoverContactSettingsController } from './report-cover-contact-settings.controller';
import { ReviewExemptFieldsController } from './review-exempt-fields.controller';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    PolicyModule,
    forwardRef(() => ActivitiesModule),
  ],
  providers: [
    ApplicationSettingsService,
    LockHandoffDeadlineKickService,
    LocksService,
    LockHandoffPoller,
    RecurringLockoutService,
  ],
  controllers: [
    LocksController,
    ReportCoverContactSettingsController,
    ActivityInfoIconsController,
    ReviewExemptFieldsController,
  ],
  exports: [LocksService, ApplicationSettingsService, RecurringLockoutService],
})
export class LocksModule {}
