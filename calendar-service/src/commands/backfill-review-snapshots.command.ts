import { NestFactory } from '@nestjs/core';

import { ActivitiesService } from '../activities/services/activities.service';
import { AppModule } from '../app.module';
import { AppLogger } from '../common/logger/logger.service';

/**
 * CLI: backfill `reviewed_field_snapshot` for Reviewed rows and/or mock Changed rows.
 *
 * Usage (from calendar-service):
 *   npm run backfill:review-snapshots -- --reviewed-only
 *   npm run backfill:review-snapshots -- --mock-changed-only
 *
 * Omit flags to run **both** (typical local reset; production usually uses
 * `--reviewed-only` once after deploy).
 */
async function bootstrap() {
  const argv = new Set(process.argv.slice(2));
  const reviewedOnly = argv.has('--reviewed-only');
  const mockChangedOnly = argv.has('--mock-changed-only');
  const runBoth = !reviewedOnly && !mockChangedOnly;

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  const logger = app.get(AppLogger);
  const activities = app.get(ActivitiesService);

  try {
    if (runBoth || reviewedOnly) {
      const n = await activities.backfillReviewedFieldSnapshotsWhereNull();
      logger.log(
        `Reviewed snapshot backfill: ${n} row(s) updated`,
        'BackfillReviewSnapshots'
      );
    }
    if (runBoth || mockChangedOnly) {
      const n = await activities.seedMockReviewSnapshotsForChangedActivities();
      logger.log(
        `Mock Changed snapshot seed: ${n} row(s) updated`,
        'BackfillReviewSnapshots'
      );
    }
    process.exit(0);
  } catch (error) {
    logger.error(
      `Backfill failed: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error.stack : undefined,
      'BackfillReviewSnapshots'
    );
    process.exit(1);
  } finally {
    await app.close();
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
