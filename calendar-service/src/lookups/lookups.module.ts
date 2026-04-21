import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { TeamsModule } from '../teams/teams.module';
import { LookupsController } from './lookups.controller';
import { LookupsService } from './lookups.service';

@Module({
  imports: [DatabaseModule, TeamsModule],
  providers: [LookupsService],
  controllers: [LookupsController],
})
export class LookupsModule {}
