import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ActivitiesModule } from './activities/activities.module';
import { LookupsModule } from './lookups/lookups.module';
import { LoggerModule } from './common/logger/logger.module';

/**
 * Resolves the root .env file path.
 * The .env file is located at the monorepo root.
 * From source: calendar-service/src -> root is ../../.env
 * From compiled: calendar-service/dist/src -> root is ../../../.env
 */
function resolveRootEnvPath(): string {
  // Check if we're running from compiled code (in dist directory)
  const isCompiled = __dirname.includes(path.sep + 'dist' + path.sep);
  return path.resolve(__dirname, isCompiled ? '../../../.env' : '../../.env');
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Load .env from root directory
      envFilePath: resolveRootEnvPath(),
    }),
    LoggerModule,
    DatabaseModule,
    ActivitiesModule,
    LookupsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
