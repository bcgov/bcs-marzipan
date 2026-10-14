import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module';
import { AppLogger } from '../common/logger/logger.service';
import { SeedService } from '../database/seed.service';

type SeedCommandScope = 'all' | 'config' | 'seed';

function parseScope(argv: string[]): SeedCommandScope {
  const scopeArg = argv.find((arg) => arg.startsWith('--scope='));
  const value = scopeArg?.split('=')[1]?.toLowerCase();

  if (value === 'config' || value === 'seed' || value === 'all') {
    return value;
  }

  return 'all';
}

/**
 * CLI command to seed the database with lookup table data.
 * Usage: npm run seed
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  const logger = app.get(AppLogger);
  const seedService = app.get(SeedService);
  const scope = parseScope(process.argv);

  logger.log(
    `Running database seed command (scope: ${scope})...`,
    'SeedCommand'
  );

  try {
    const success =
      scope === 'config'
        ? await seedService.seedConfigData()
        : scope === 'seed'
          ? await seedService.seedData()
          : await seedService.seed();

    if (success) {
      logger.log('Database seeding completed successfully', 'SeedCommand');
      process.exit(0);
    } else {
      logger.error('Database seeding failed', undefined, 'SeedCommand');
      process.exit(1);
    }
  } catch (error) {
    logger.error(
      `Database seeding error: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error.stack : undefined,
      'SeedCommand'
    );
    process.exit(1);
  } finally {
    await app.close();
  }
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
