import { forwardRef, Module } from '@nestjs/common';

import { ActivitiesModule } from '../activities/activities.module';
import { DatabaseModule } from '../database/database.module';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

@Module({
  imports: [DatabaseModule, forwardRef(() => ActivitiesModule)],
  controllers: [TeamsController],
  providers: [TeamsService],
  exports: [TeamsService],
})
export class TeamsModule {}
