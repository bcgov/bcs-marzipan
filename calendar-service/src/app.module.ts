import './types/express';

import * as path from 'path';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { ActivitiesModule } from './activities/activities.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { LoggerModule } from './common/logger/logger.module';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { DatabaseModule } from './database/database.module';
import { DraftsModule } from './drafts/drafts.module';
import { LookAheadModule } from './look-ahead/look-ahead.module';
import { LookupsModule } from './lookups/lookups.module';
import { PermissionsGuard } from './policy/guards/permissions.guard';
import { RolesGuard } from './policy/guards/roles.guard';
import { DataScopeInterceptor } from './policy/interceptors/data-scope.interceptor';
import { PolicyModule } from './policy/policy.module';
import { ReportsModule } from './reports/reports.module';

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
    LookAheadModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    CorrelationIdMiddleware,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: DataScopeInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
