import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { LocksController } from './locks.controller';
import { LocksService } from './locks.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [LocksService],
  controllers: [LocksController],
  exports: [LocksService],
})
export class LocksModule {}
