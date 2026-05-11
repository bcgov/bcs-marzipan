import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { LookAheadPolicyService } from './look-ahead-policy.service';

/**
 * Read-only policy module used by activity write paths and the report PDF
 * cover. Kept separate from `LookAheadModule` (HTTP / report data) so it can
 * be imported by `ActivitiesModule` without forming a dependency cycle through
 * `ReportsModule`.
 */
@Module({
  imports: [DatabaseModule],
  providers: [LookAheadPolicyService],
  exports: [LookAheadPolicyService],
})
export class LookAheadPolicyModule {}
