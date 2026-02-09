import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeedService } from '../database/seed.service';
import { AppLogger } from '../common/logger/logger.service';

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

  logger.log('Running database seed command...', 'SeedCommand');

  try {
    const success = await seedService.seed();

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
