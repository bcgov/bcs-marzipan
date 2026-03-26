import { NestFactory } from '@nestjs/core';

import { ActivitiesService } from '../activities/services/activities.service';
import { AppModule } from '../app.module';
import { AppLogger } from '../common/logger/logger.service';

/**
 * CLI (mock/dev only): backfill `reviewed_field_snapshot` for local test data.
 * Do not run this command against production data.
 *
 * Usage (from calendar-service):
 *   npm run backfill:review-snapshots -- --reviewed-only
 *   npm run backfill:review-snapshots -- --mock-changed-only
 *   npm run backfill:review-snapshots -- --recompute-all
 *
 * Omit flags to run **both** reviewed-only + mock-changed-only (typical local reset).
 *
 * --recompute-all: rewrites snapshots for all Reviewed activities using the current
 * mapping logic (including name-to-ID lookups) for local/dev data alignment.
 */
async function bootstrap() {
  const argv = new Set(process.argv.slice(2));
  const reviewedOnly = argv.has('--reviewed-only');
  const mockChangedOnly = argv.has('--mock-changed-only');
  const recomputeAll = argv.has('--recompute-all');
  const runBoth = !reviewedOnly && !mockChangedOnly && !recomputeAll;

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  const logger = app.get(AppLogger);
  const activities = app.get(ActivitiesService);

  try {
    if (recomputeAll) {
      const n = await activities.recomputeAllReviewedSnapshots();
      logger.log(
        `Recompute all Reviewed snapshots: ${n} row(s) updated`,
        'BackfillReviewSnapshots'
      );
    }
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
