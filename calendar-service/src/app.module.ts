import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { PolicyModule } from './policy/policy.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PermissionsGuard } from './policy/guards/permissions.guard';
import { RolesGuard } from './policy/guards/roles.guard';
import { DataScopeInterceptor } from './policy/interceptors/data-scope.interceptor';
import { ActivitiesModule } from './activities/activities.module';
import { LookupsModule } from './lookups/lookups.module';
import { DraftsModule } from './drafts/drafts.module';
import { ReportsModule } from './reports/reports.module';
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
    PolicyModule,
    AuthModule,
    ActivitiesModule,
    LookupsModule,
    DraftsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: DataScopeInterceptor },
  ],
})
export class AppModule {}
