import { forwardRef, Module } from '@nestjs/common';

import { ActivitiesModule } from '../activities/activities.module';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { LocksModule } from '../locks/locks.module';
import { ActivityReminderJobService } from './activity-reminder-job.service';
import { ActivityReminderSettingsController } from './activity-reminder-settings.controller';
import { NotificationEmailService } from './notification-email.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    LocksModule,
    forwardRef(() => ActivitiesModule),
  ],
  controllers: [NotificationsController, ActivityReminderSettingsController],
  providers: [
    NotificationsService,
    NotificationEmailService,
    ActivityReminderJobService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
