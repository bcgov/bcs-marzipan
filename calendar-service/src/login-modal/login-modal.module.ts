import { Module } from '@nestjs/common';

import { ActivitiesModule } from '../activities/activities.module';
import { DatabaseModule } from '../database/database.module';
import { LoginModalController } from './login-modal.controller';
import { LoginModalService } from './login-modal.service';

@Module({
  imports: [DatabaseModule, ActivitiesModule],
  controllers: [LoginModalController],
  providers: [LoginModalService],
  exports: [LoginModalService],
})
export class LoginModalModule {}
