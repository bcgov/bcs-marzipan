import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { LookupsController } from './lookups.controller';
import { LookupsService } from './lookups.service';

@Module({
  imports: [DatabaseModule],
  providers: [LookupsService],
  controllers: [LookupsController],
})
export class LookupsModule {}
