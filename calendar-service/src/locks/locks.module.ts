import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { LocksController } from './locks.controller';
import { LocksService } from './locks.service';

@Module({
  imports: [DatabaseModule],
  providers: [LocksService],
  controllers: [LocksController],
  exports: [LocksService],
})
export class LocksModule {}
