import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { DraftsCleanupService } from './drafts-cleanup.service';
import { DraftsController } from './drafts.controller';
import { DraftsService } from './drafts.service';

@Module({
  imports: [DatabaseModule],
  controllers: [DraftsController],
  providers: [DraftsService, DraftsCleanupService],
  exports: [DraftsService],
})
export class DraftsModule {}
