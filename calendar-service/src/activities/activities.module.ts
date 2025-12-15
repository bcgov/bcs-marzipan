import { Module } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { ActivitiesGateway } from './activities.gateway';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [ActivitiesService, ActivitiesGateway],
  controllers: [ActivitiesController],
})
export class ActivitiesModule {}
