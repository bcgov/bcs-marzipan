import { forwardRef, Module } from '@nestjs/common';

import { ActivitiesModule } from '../activities/activities.module';
import { DatabaseModule } from '../database/database.module';
import { NotificationEmailService } from './notification-email.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [DatabaseModule, forwardRef(() => ActivitiesModule)],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationEmailService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
